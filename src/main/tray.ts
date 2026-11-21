import { Menu, Tray, nativeImage } from 'electron'
import { deflateSync } from 'node:zlib'
import type { PomodoroState } from '../shared/ipc-contracts'
import {
  formatPomodoroTime,
  getPomodoroState,
  pausePomodoro,
  resetPomodoro,
  startPomodoro,
  subscribePomodoroState
} from './services/pomodoro'
import { getAppLanguage } from './services/settings-store'

interface TrayActions {
  onShowMainWindow: () => void
  onToggleQuickCheck: () => void
  onQuitApp: () => void
}

let tray: Tray | null = null
let trayActions: TrayActions | null = null
let unsubscribeState: (() => void) | null = null

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function makePngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'ascii')
  const lengthBuffer = Buffer.alloc(4)
  lengthBuffer.writeUInt32BE(data.length, 0)

  const crcInput = Buffer.concat([typeBuffer, data])
  const crcBuffer = Buffer.alloc(4)
  crcBuffer.writeUInt32BE(crc32(crcInput), 0)

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer])
}

/**
 * Builds a crisp 32x32 RGBA Studio Nocturne tray badge in memory so Windows Tray
 * never depends on external `.ico` path resolution inside packaged ASAR archives.
 */
function createTrayIcon() {
  const size = 32
  const stride = 1 + size * 4
  const raw = Buffer.alloc(stride * size)

  const isInsideRoundedBadge = (x: number, y: number): boolean => {
    const margin = 2
    const radius = 7
    const min = margin
    const max = size - 1 - margin
    if (x < min || x > max || y < min || y > max) return false

    const dx = Math.max(min + radius - x, 0, x - (max - radius))
    const dy = Math.max(min + radius - y, 0, y - (max - radius))
    return dx * dx + dy * dy <= radius * radius
  }

  const isAccentGlyph = (x: number, y: number): boolean => {
    // Stylized minimal voice-bar triad inside the badge
    if (x >= 9 && x <= 11 && y >= 13 && y <= 19) return true
    if (x >= 14 && x <= 17 && y >= 9 && y <= 23) return true
    if (x >= 20 && x <= 22 && y >= 12 && y <= 20) return true
    return false
  }

  for (let y = 0; y < size; y++) {
    const rowStart = y * stride
    raw[rowStart] = 0 // PNG filter type 0

    for (let x = 0; x < size; x++) {
      const px = rowStart + 1 + x * 4
      if (!isInsideRoundedBadge(x, y)) {
        raw[px] = 0
        raw[px + 1] = 0
        raw[px + 2] = 0
        raw[px + 3] = 0
      } else if (isAccentGlyph(x, y)) {
        // Ice-blue Studio Nocturne accent (#ADC6FF)
        raw[px] = 173
        raw[px + 1] = 198
        raw[px + 2] = 255
        raw[px + 3] = 255
      } else {
        // Deep indigo badge fill (#354B8C)
        raw[px] = 53
        raw[px + 1] = 75
        raw[px + 2] = 140
        raw[px + 3] = 255
      }
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const idat = deflateSync(raw)
  const pngBuffer = Buffer.concat([
    signature,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', idat),
    makePngChunk('IEND', Buffer.alloc(0))
  ])

  return nativeImage.createFromBuffer(pngBuffer)
}

function buildStatusSummary(state: PomodoroState): string {
  const isPt = getAppLanguage() === 'pt-BR'
  const timeText = formatPomodoroTime(state.remainingSeconds)
  const modeLabel =
    state.mode === 'focus'
      ? isPt
        ? 'Foco'
        : 'Focus'
      : isPt
        ? 'Pausa'
        : 'Break'

  const statusLabel =
    state.status === 'running'
      ? isPt
        ? 'Em andamento'
        : 'Running'
      : state.status === 'paused'
        ? isPt
          ? 'Pausado'
          : 'Paused'
        : isPt
          ? 'Pronto'
          : 'Ready'

  return `${timeText} • ${modeLabel} (${statusLabel})`
}

function updateTrayPresentation(state: PomodoroState): void {
  if (!tray || !trayActions) {
    return
  }

  const isPt = getAppLanguage() === 'pt-BR'
  const summary = buildStatusSummary(state)

  tray.setToolTip(`English Checks — ${summary}`)

  const menu = Menu.buildFromTemplate([
    {
      label: `English Checks (${summary})`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: isPt ? 'Abrir English Checks' : 'Open English Checks',
      click: () => trayActions?.onShowMainWindow()
    },
    {
      label: isPt ? 'Quick Check (Ctrl+Shift+E)' : 'Quick Check (Ctrl+Shift+E)',
      click: () => trayActions?.onToggleQuickCheck()
    },
    { type: 'separator' },
    {
      label:
        state.status === 'running'
          ? isPt
            ? 'Pausar Pomodoro'
            : 'Pause Pomodoro'
          : isPt
            ? 'Iniciar Pomodoro'
            : 'Start Pomodoro',
      click: () => {
        if (getPomodoroState().status === 'running') {
          pausePomodoro()
        } else {
          startPomodoro()
        }
      }
    },
    {
      label: isPt ? 'Resetar Pomodoro' : 'Reset Pomodoro',
      click: () => resetPomodoro()
    },
    { type: 'separator' },
    {
      label: isPt ? 'Sair' : 'Quit',
      click: () => trayActions?.onQuitApp()
    }
  ])

  tray.setContextMenu(menu)
}

export function initTray(actions: TrayActions): void {
  trayActions = actions

  if (!tray) {
    tray = new Tray(createTrayIcon())
    tray.on('click', () => {
      trayActions?.onShowMainWindow()
    })
    tray.on('double-click', () => {
      trayActions?.onShowMainWindow()
    })
  }

  unsubscribeState?.()
  unsubscribeState = subscribePomodoroState((nextState) => {
    updateTrayPresentation(nextState)
  })

  updateTrayPresentation(getPomodoroState())
}

export function refreshTray(): void {
  updateTrayPresentation(getPomodoroState())
}

export function destroyTray(): void {
  unsubscribeState?.()
  unsubscribeState = null
  trayActions = null

  if (tray) {
    tray.destroy()
    tray = null
  }
}
