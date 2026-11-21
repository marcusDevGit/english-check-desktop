import { IPC_CHANNELS } from '../../shared/ipc-contracts'
import {
  getPomodoroState,
  pausePomodoro,
  resetPomodoro,
  startPomodoro
} from '../services/pomodoro'
import { registerValidatedHandler } from './safe-handle'

export function registerPomodoroHandlers(): void {
  registerValidatedHandler(IPC_CHANNELS.POMODORO_GET_STATE, null, () =>
    getPomodoroState()
  )
  registerValidatedHandler(IPC_CHANNELS.POMODORO_START, null, () =>
    startPomodoro()
  )
  registerValidatedHandler(IPC_CHANNELS.POMODORO_PAUSE, null, () =>
    pausePomodoro()
  )
  registerValidatedHandler(IPC_CHANNELS.POMODORO_RESET, null, () =>
    resetPomodoro()
  )
}
