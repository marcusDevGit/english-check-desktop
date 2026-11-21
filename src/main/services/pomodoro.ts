import { BrowserWindow, Notification } from 'electron'
import { IPC_CHANNELS, type PomodoroState } from '../../shared/ipc-contracts'
import { saveStudySession } from '../database/repository'
import { getAppLanguage } from './settings-store'

export const FOCUS_DURATION_SECONDS = 25 * 60
export const BREAK_DURATION_SECONDS = 5 * 60

type StateListener = (state: PomodoroState) => void

let state: PomodoroState = {
  mode: 'focus',
  status: 'idle',
  remainingSeconds: FOCUS_DURATION_SECONDS,
  totalSeconds: FOCUS_DURATION_SECONDS
}

let timerId: NodeJS.Timeout | null = null
let onWindowFocusRequested: (() => void) | null = null
const stateListeners = new Set<StateListener>()

export function formatPomodoroTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function setPomodoroWindowFocusHandler(handler: () => void): void {
  onWindowFocusRequested = handler
}

export function subscribePomodoroState(listener: StateListener): () => void {
  stateListeners.add(listener)
  return () => {
    stateListeners.delete(listener)
  }
}

export function getPomodoroState(): PomodoroState {
  return { ...state }
}

function clearPomodoroInterval(): void {
  if (timerId !== null) {
    clearInterval(timerId)
    timerId = null
  }
}

function emitState(): PomodoroState {
  const snapshot = getPomodoroState()

  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.POMODORO_TICK, snapshot)
    }
  }

  for (const listener of stateListeners) {
    listener(snapshot)
  }

  return snapshot
}

function showPhaseNotification(completedMode: 'focus' | 'break'): void {
  if (!Notification.isSupported()) {
    return
  }

  const language = getAppLanguage()
  const isPt = language === 'pt-BR'

  const title =
    completedMode === 'focus'
      ? isPt
        ? 'Bloco de foco concluído!'
        : 'Focus block completed!'
      : isPt
        ? 'Pausa finalizada!'
        : 'Break finished!'

  const body =
    completedMode === 'focus'
      ? isPt
        ? '25 minutos registrados no seu histórico. Hora de uma pausa de 5 minutos.'
        : '25 minutes saved to your study history. Time for a 5-minute break.'
      : isPt
        ? 'Pronto para iniciar o próximo bloco de 25 minutos no English Checks.'
        : 'Ready to start your next 25-minute focus block in English Checks.'

  const notification = new Notification({ title, body })
  notification.on('click', () => {
    onWindowFocusRequested?.()
  })
  notification.show()
}

function handlePhaseComplete(): void {
  clearPomodoroInterval()
  const completedMode = state.mode

  if (completedMode === 'focus') {
    try {
      saveStudySession({
        type: 'pomodoro',
        durationSeconds: state.totalSeconds,
        score: null
      })
    } catch (error) {
      console.error('Failed to persist completed Pomodoro session:', error)
    }

    state = {
      mode: 'break',
      status: 'idle',
      remainingSeconds: BREAK_DURATION_SECONDS,
      totalSeconds: BREAK_DURATION_SECONDS
    }
  } else {
    state = {
      mode: 'focus',
      status: 'idle',
      remainingSeconds: FOCUS_DURATION_SECONDS,
      totalSeconds: FOCUS_DURATION_SECONDS
    }
  }

  showPhaseNotification(completedMode)
  emitState()
}

export function startPomodoro(): PomodoroState {
  if (state.status === 'running') {
    return getPomodoroState()
  }

  if (state.remainingSeconds <= 0) {
    const duration =
      state.mode === 'focus' ? FOCUS_DURATION_SECONDS : BREAK_DURATION_SECONDS
    state = {
      ...state,
      remainingSeconds: duration,
      totalSeconds: duration
    }
  }

  state = {
    ...state,
    status: 'running'
  }

  clearPomodoroInterval()
  timerId = setInterval(() => {
    if (state.status !== 'running') {
      return
    }

    const nextRemaining = Math.max(0, state.remainingSeconds - 1)
    if (nextRemaining === 0) {
      handlePhaseComplete()
      return
    }

    state = {
      ...state,
      remainingSeconds: nextRemaining
    }
    emitState()
  }, 1000)

  return emitState()
}

export function pausePomodoro(): PomodoroState {
  clearPomodoroInterval()
  if (state.status !== 'running') {
    return getPomodoroState()
  }

  state = {
    ...state,
    status: 'paused'
  }
  return emitState()
}

export function resetPomodoro(): PomodoroState {
  clearPomodoroInterval()
  state = {
    mode: 'focus',
    status: 'idle',
    remainingSeconds: FOCUS_DURATION_SECONDS,
    totalSeconds: FOCUS_DURATION_SECONDS
  }
  return emitState()
}

export function cleanupPomodoro(): void {
  clearPomodoroInterval()
  stateListeners.clear()
  onWindowFocusRequested = null
}
