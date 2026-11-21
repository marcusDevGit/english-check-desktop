import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { IPC_CHANNELS } from '../shared/ipc-contracts'
import { closeDatabase, initDatabase } from './database'
import { seedPracticeItems } from './database/seed'
import { registerAiHandlers } from './ipc/ai-handlers'
import { registerDbHandlers } from './ipc/db-handlers'
import { registerPomodoroHandlers } from './ipc/pomodoro-handlers'
import { registerValidatedHandler } from './ipc/safe-handle'
import { registerSettingsHandlers } from './ipc/settings-handlers'
import {
  cleanupPomodoro,
  setPomodoroWindowFocusHandler
} from './services/pomodoro'
import { destroyTray, initTray } from './tray'
import {
  hideQuickCheckWindow,
  registerQuickCheckShortcut,
  setAppQuitting,
  toggleQuickCheckWindow,
  unregisterGlobalShortcuts
} from './windows/quick-check'

let mainWindow: BrowserWindow | null = null
let isQuittingApp = false

function showMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    const win = createMainWindow()
    win.once('ready-to-show', () => {
      win.show()
      win.focus()
    })
    return
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }
  mainWindow.show()
  mainWindow.focus()
}

function quitApplication(): void {
  isQuittingApp = true
  setAppQuitting(true)
  app.quit()
}

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

  // Hide to Windows System Tray instead of quitting so Pomodoro & Ctrl+Shift+E keep running.
  win.on('close', (event) => {
    if (!isQuittingApp) {
      event.preventDefault()
      win.hide()
    }
  })

  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = null
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

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.englishchecks.desktop')
  }

  app.on('second-instance', () => {
    showMainWindow()
  })

  app.whenReady().then(() => {
    initDatabase()
    seedPracticeItems()
    registerDbHandlers()
    registerAiHandlers()
    registerSettingsHandlers()
    registerWindowHandlers()
    registerPomodoroHandlers()
    setPomodoroWindowFocusHandler(showMainWindow)
    registerQuickCheckShortcut()
    createMainWindow()
    initTray({
      onShowMainWindow: showMainWindow,
      onToggleQuickCheck: () => {
        toggleQuickCheckWindow()
      },
      onQuitApp: quitApplication
    })

    app.on('activate', () => {
      showMainWindow()
    })
  })

  app.on('before-quit', () => {
    isQuittingApp = true
    setAppQuitting(true)
  })

  app.on('will-quit', () => {
    cleanupPomodoro()
    destroyTray()
    unregisterGlobalShortcuts()
    closeDatabase()
  })

  // Keep running in the Windows System Tray when windows are closed/hidden.
  app.on('window-all-closed', () => {
    if (isQuittingApp && process.platform !== 'darwin') {
      app.quit()
    }
  })
}
