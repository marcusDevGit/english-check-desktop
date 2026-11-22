import { app, BrowserWindow, globalShortcut, screen } from 'electron'
import { join } from 'node:path'

const OVERLAY_WIDTH = 560
const OVERLAY_HEIGHT = 340

let quickCheckWindow: BrowserWindow | null = null
let isQuitting = false

export function setAppQuitting(quitting: boolean): void {
  isQuitting = quitting
}

function positionNearCursor(win: BrowserWindow): void {
  const cursorPoint = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursorPoint)
  const { x, y, width, height } = display.workArea

  const centeredX = Math.round(x + (width - OVERLAY_WIDTH) / 2)
  const centeredY = Math.round(y + (height - OVERLAY_HEIGHT) / 3)
  win.setPosition(centeredX, centeredY)
}

function getOrCreateQuickCheckWindow(): BrowserWindow {
  if (quickCheckWindow && !quickCheckWindow.isDestroyed()) {
    return quickCheckWindow
  }

  const win = new BrowserWindow({
    width: OVERLAY_WIDTH,
    height: OVERLAY_HEIGHT,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      win.hide()
    }
  })

  win.on('closed', () => {
    if (quickCheckWindow === win) {
      quickCheckWindow = null
    }
  })

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (!app.isPackaged && devUrl) {
    void win.loadURL(`${devUrl}#/quick-check`)
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: '/quick-check'
    })
  }

  quickCheckWindow = win
  return win
}

export function toggleQuickCheckWindow(): { visible: boolean } {
  const win = getOrCreateQuickCheckWindow()
  if (win.isVisible()) {
    win.hide()
    return { visible: false }
  }

  positionNearCursor(win)
  win.show()
  win.focus()
  return { visible: true }
}

export function hideQuickCheckWindow(): void {
  if (quickCheckWindow && !quickCheckWindow.isDestroyed() && quickCheckWindow.isVisible()) {
    quickCheckWindow.hide()
  }
}

export function registerQuickCheckShortcut(): boolean {
  return globalShortcut.register('CommandOrControl+Shift+E', () => {
    toggleQuickCheckWindow()
  })
}

export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll()
}
