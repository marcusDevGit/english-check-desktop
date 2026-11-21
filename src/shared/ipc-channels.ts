/**
 * Canonical IPC channel names shared across Main, Preload, and Renderer.
 * Kept dependency-free so sandboxed preload scripts never import runtime validators.
 */
export const IPC_CHANNELS = {
  AUDIO_ANALYZE_PRONUNCIATION: 'audio:analyze-pronunciation',
  WRITING_CHECK_GRAMMAR: 'writing:check-grammar',
  AI_EVALUATE_RECALL: 'ai:evaluate-recall',
  AI_GENERATE_DRILLS: 'ai:generate-drills',
  DB_GET_STATS: 'db:get-stats',
  DB_SAVE_SESSION: 'db:save-session',
  DB_GET_TRACKS: 'db:get-tracks',
  DB_GET_PRACTICE_ITEMS: 'db:get-practice-items',
  DB_UPDATE_PRACTICE_REVIEW: 'db:update-practice-review',
  DB_GET_PHONEME_ERRORS: 'db:get-phoneme-errors',
  WINDOW_TOGGLE_QUICK_CHECK: 'window:toggle-quick-check',
  WINDOW_HIDE_QUICK_CHECK: 'window:hide-quick-check',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_TOGGLE_MAXIMIZE: 'window:toggle-maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',
  POMODORO_GET_STATE: 'pomodoro:get-state',
  POMODORO_START: 'pomodoro:start',
  POMODORO_PAUSE: 'pomodoro:pause',
  POMODORO_RESET: 'pomodoro:reset',
  POMODORO_TICK: 'pomodoro:tick',
  SETTINGS_GET_STATUS: 'settings:get-status',
  SETTINGS_SAVE_API_KEY: 'settings:save-api-key',
  SETTINGS_CLEAR_API_KEY: 'settings:clear-api-key',
  SETTINGS_SAVE_LANGUAGE: 'settings:save-language',
  SETTINGS_UPDATED: 'settings:updated'
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
