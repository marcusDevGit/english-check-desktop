import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import type {
  EnglishChecksApi,
  PomodoroState,
  SettingsStatus
} from '../shared/ipc-contracts'

const englishChecksApi: EnglishChecksApi = {
  analyzePronunciation: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.AUDIO_ANALYZE_PRONUNCIATION, payload),

  checkGrammar: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.WRITING_CHECK_GRAMMAR, payload),

  evaluateRecall: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.AI_EVALUATE_RECALL, payload),

  evaluateOpenQa: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.AI_EVALUATE_OPEN_QA, payload),

  evaluateRoleplayTurn: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.AI_ROLEPLAY_TURN, payload),

  generateCustomTrack: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.AI_GENERATE_CUSTOM_TRACK, payload),

  generateCustomDrills: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.AI_GENERATE_DRILLS, payload ?? { count: 3 }),

  getStats: () => ipcRenderer.invoke(IPC_CHANNELS.DB_GET_STATS),

  saveSession: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_SAVE_SESSION, payload),

  getTracks: () => ipcRenderer.invoke(IPC_CHANNELS.DB_GET_TRACKS),

  getTrackLessons: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_TRACK_LESSONS, payload),

  completeLessonActivity: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_COMPLETE_LESSON_ACTIVITY, payload),

  getPracticeItems: () =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_PRACTICE_ITEMS),

  updatePracticeReview: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_UPDATE_PRACTICE_REVIEW, payload),

  getPhonemeErrors: () =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_PHONEME_ERRORS),

  toggleQuickCheck: () =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_TOGGLE_QUICK_CHECK),

  hideQuickCheck: () =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_HIDE_QUICK_CHECK),

  minimizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),

  toggleMaximizeWindow: () =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_TOGGLE_MAXIMIZE),

  closeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),

  isWindowMaximized: () =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),

  getPomodoroState: () =>
    ipcRenderer.invoke(IPC_CHANNELS.POMODORO_GET_STATE),

  startPomodoro: () => ipcRenderer.invoke(IPC_CHANNELS.POMODORO_START),

  pausePomodoro: () => ipcRenderer.invoke(IPC_CHANNELS.POMODORO_PAUSE),

  resetPomodoro: () => ipcRenderer.invoke(IPC_CHANNELS.POMODORO_RESET),

  onPomodoroTick: (callback) => {
    const listener = (_event: IpcRendererEvent, state: PomodoroState): void => {
      callback(state)
    }
    ipcRenderer.on(IPC_CHANNELS.POMODORO_TICK, listener)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.POMODORO_TICK, listener)
    }
  },

  getSettingsStatus: () =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_STATUS),

  saveApiKey: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SAVE_API_KEY, payload),

  clearApiKey: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_CLEAR_API_KEY),

  saveLanguage: (payload) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SAVE_LANGUAGE, payload),

  onSettingsUpdated: (callback) => {
    const listener = (_event: IpcRendererEvent, status: SettingsStatus): void => {
      callback(status)
    }
    ipcRenderer.on(IPC_CHANNELS.SETTINGS_UPDATED, listener)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.SETTINGS_UPDATED, listener)
    }
  }
}

contextBridge.exposeInMainWorld('englishChecks', englishChecksApi)
