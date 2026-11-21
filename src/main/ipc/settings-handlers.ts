import { BrowserWindow } from 'electron'
import {
  IPC_CHANNELS,
  SaveApiKeyRequestSchema,
  SaveLanguageRequestSchema,
  type SettingsStatus
} from '../../shared/ipc-contracts'
import {
  clearGeminiApiKey,
  getSettingsStatus,
  saveAppLanguage,
  saveGeminiApiKey
} from '../services/settings-store'
import { refreshTray } from '../tray'
import { registerValidatedHandler } from './safe-handle'

function broadcastSettingsUpdated(status: SettingsStatus): SettingsStatus {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.SETTINGS_UPDATED, status)
    }
  }
  refreshTray()
  return status
}

export function registerSettingsHandlers(): void {
  registerValidatedHandler(IPC_CHANNELS.SETTINGS_GET_STATUS, null, () =>
    getSettingsStatus()
  )

  registerValidatedHandler(
    IPC_CHANNELS.SETTINGS_SAVE_API_KEY,
    SaveApiKeyRequestSchema,
    (input) => broadcastSettingsUpdated(saveGeminiApiKey(input.apiKey))
  )

  registerValidatedHandler(IPC_CHANNELS.SETTINGS_CLEAR_API_KEY, null, () =>
    broadcastSettingsUpdated(clearGeminiApiKey())
  )

  registerValidatedHandler(
    IPC_CHANNELS.SETTINGS_SAVE_LANGUAGE,
    SaveLanguageRequestSchema,
    (input) => broadcastSettingsUpdated(saveAppLanguage(input.language))
  )
}
