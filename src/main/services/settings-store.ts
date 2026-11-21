import { app, safeStorage } from 'electron'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { AppLanguageSchema, type AppLanguage, type SettingsStatus } from '../../shared/ipc-contracts'

const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash'
const DEFAULT_LANGUAGE: AppLanguage = 'pt-BR'
const KEY_FILENAME = 'gemini-key.enc'
const PREFERENCES_FILENAME = 'preferences.json'

let devEnvLoaded = false

function loadDevEnvOnce(): void {
  if (devEnvLoaded || app.isPackaged) return
  devEnvLoaded = true

  const envPath = join(app.getAppPath(), '.env')
  if (!existsSync(envPath)) return

  try {
    process.loadEnvFile(envPath)
  } catch {
    // Ignore malformed or unreadable .env in dev
  }
}

function getUserDataFilePath(filename: string): string {
  const userDataDir = app.getPath('userData')
  mkdirSync(userDataDir, { recursive: true })
  return join(userDataDir, filename)
}

function readEncryptedApiKey(): string | null {
  if (!safeStorage.isEncryptionAvailable()) return null
  const keyPath = getUserDataFilePath(KEY_FILENAME)
  if (!existsSync(keyPath)) return null

  try {
    const encryptedBuffer = readFileSync(keyPath)
    const decrypted = safeStorage.decryptString(encryptedBuffer).trim()
    return decrypted.length > 0 ? decrypted : null
  } catch {
    return null
  }
}

export function getAppLanguage(): AppLanguage {
  const prefsPath = getUserDataFilePath(PREFERENCES_FILENAME)
  if (!existsSync(prefsPath)) return DEFAULT_LANGUAGE

  try {
    const raw = JSON.parse(readFileSync(prefsPath, 'utf-8')) as { language?: unknown }
    const parsed = AppLanguageSchema.safeParse(raw.language)
    return parsed.success ? parsed.data : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

export function saveAppLanguage(language: AppLanguage): SettingsStatus {
  const prefsPath = getUserDataFilePath(PREFERENCES_FILENAME)
  writeFileSync(prefsPath, JSON.stringify({ language }, null, 2), 'utf-8')
  return getSettingsStatus()
}

export function getGeminiModel(): string {
  loadDevEnvOnce()
  return process.env['GEMINI_MODEL']?.trim() || DEFAULT_GEMINI_MODEL
}

export function getGeminiApiKey(): string | null {
  const storedKey = readEncryptedApiKey()
  if (storedKey) return storedKey

  if (!app.isPackaged) {
    loadDevEnvOnce()
    const envKey = process.env['GEMINI_API_KEY']?.trim()
    if (envKey) return envKey
  }

  return null
}

export function getSettingsStatus(): SettingsStatus {
  const safeStorageAvailable = safeStorage.isEncryptionAvailable()
  const language = getAppLanguage()
  const storedKey = readEncryptedApiKey()
  if (storedKey) {
    return {
      hasApiKey: true,
      source: 'safeStorage',
      model: getGeminiModel(),
      safeStorageAvailable,
      language
    }
  }

  if (!app.isPackaged) {
    loadDevEnvOnce()
    if (process.env['GEMINI_API_KEY']?.trim()) {
      return {
        hasApiKey: true,
        source: 'env',
        model: getGeminiModel(),
        safeStorageAvailable,
        language
      }
    }
  }

  return {
    hasApiKey: false,
    source: 'none',
    model: getGeminiModel(),
    safeStorageAvailable,
    language
  }
}

export function saveGeminiApiKey(apiKey: string): SettingsStatus {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      'OS credential encryption (safeStorage) is unavailable on this system.'
    )
  }

  const trimmed = apiKey.trim()
  const encrypted = safeStorage.encryptString(trimmed)
  writeFileSync(getUserDataFilePath(KEY_FILENAME), encrypted)
  return getSettingsStatus()
}

export function clearGeminiApiKey(): SettingsStatus {
  const keyPath = getUserDataFilePath(KEY_FILENAME)
  if (existsSync(keyPath)) {
    rmSync(keyPath, { force: true })
  }
  return getSettingsStatus()
}
