import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { IPC_CHANNELS } from '../shared/ipc-contracts'
import { closeDatabase, initDatabase } from './database'
import { seedPracticeItems } from './database/seed'
import { registerAiHandlers } from './ipc/ai-handlers'
import { registerDbHandlers } from './ipc/db-handlers'
import { registerValidatedHandler } from './ipc/safe-handle'
import { registerSettingsHandlers } from './ipc/settings-handlers'
import {
  hideQuickCheckWindow,
  registerQuickCheckShortcut,
  setAppQuitting,
  toggleQuickCheckWindow,
  unregisterGlobalShortcuts
} from './windows/quick-check'

let mainWindow: BrowserWindow | null = null

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 680,
    frame: false,
    show: false,
    backgroundColor: '#131315',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  win.once('ready-to-show', () => {
    win.show()
  })

  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = null
    }
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (!app.isPackaged && devUrl) {
    void win.loadURL(devUrl)
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow = win
  return win
}

function registerWindowHandlers(): void {
  registerValidatedHandler(IPC_CHANNELS.WINDOW_MINIMIZE, null, () => {
    mainWindow?.minimize()
  })

  registerValidatedHandler(IPC_CHANNELS.WINDOW_TOGGLE_MAXIMIZE, null, () => {
    if (!mainWindow) return { maximized: false }
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
      return { maximized: false }
    }
    mainWindow.maximize()
    return { maximized: true }
  })

  registerValidatedHandler(IPC_CHANNELS.WINDOW_CLOSE, null, () => {
    mainWindow?.close()
  })

  registerValidatedHandler(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, null, () => ({
    maximized: mainWindow?.isMaximized() ?? false
  }))

  registerValidatedHandler(IPC_CHANNELS.WINDOW_TOGGLE_QUICK_CHECK, null, () =>
    toggleQuickCheckWindow()
  )

  registerValidatedHandler(IPC_CHANNELS.WINDOW_HIDE_QUICK_CHECK, null, () => {
    hideQuickCheckWindow()
  })
}

function registerPomodoroStubHandlers(): void {
  const notImplemented = (): never => {
    throw new Error('Pomodoro System Tray sync is planned for v0.2.0')
  }

  registerValidatedHandler(IPC_CHANNELS.POMODORO_GET_STATE, null, () => ({
    mode: 'focus' as const,
    status: 'idle' as const,
    remainingSeconds: 25 * 60,
    totalSeconds: 25 * 60
  }))
  registerValidatedHandler(IPC_CHANNELS.POMODORO_START, null, notImplemented)
  registerValidatedHandler(IPC_CHANNELS.POMODORO_PAUSE, null, notImplemented)
  registerValidatedHandler(IPC_CHANNELS.POMODORO_RESET, null, notImplemented)
}

app.whenReady().then(() => {
  initDatabase()
  seedPracticeItems()
  registerDbHandlers()
  registerAiHandlers()
  registerSettingsHandlers()
  registerWindowHandlers()
  registerPomodoroStubHandlers()
  registerQuickCheckShortcut()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('before-quit', () => {
  setAppQuitting(true)
})

app.on('will-quit', () => {
  unregisterGlobalShortcuts()
  closeDatabase()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
