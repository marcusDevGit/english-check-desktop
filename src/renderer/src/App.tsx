import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppLanguage, PomodoroState } from '../../shared/ipc-contracts'
import { SidebarRail, type StudioView } from './components/layout/SidebarRail'
import { TitleBar } from './components/layout/TitleBar'
import { SettingsModal } from './components/settings/SettingsModal'
import { ProgressStatsView } from './views/ProgressStatsView'
import { PronunciationLabView } from './views/PronunciationLabView'
import { QuickCheckOverlayView } from './views/QuickCheckOverlayView'
import { ReviewDeckView } from './views/ReviewDeckView'
import { TracksView } from './views/TracksView'
import { WritingCheckView } from './views/WritingCheckView'

const DEFAULT_POMODORO_STATE: PomodoroState = {
  mode: 'focus',
  status: 'idle',
  remainingSeconds: 25 * 60,
  totalSeconds: 25 * 60
}

export default function App() {
  const [isQuickCheckRoute] = useState(
    () => window.location.hash === '#/quick-check'
  )
  const [language, setLanguage] = useState<AppLanguage>('pt-BR')
  const [activeView, setActiveView] = useState<StudioView>('pronunciation-lab')
  const [streakDays, setStreakDays] = useState<number>(0)
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>(
    DEFAULT_POMODORO_STATE
  )
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null)
  const [selectedLabItemId, setSelectedLabItemId] = useState<number | null>(null)
  const prevPomodoroRef = useRef<PomodoroState>(DEFAULT_POMODORO_STATE)

  useEffect(() => {
    let active = true
    window.englishChecks
      .getSettingsStatus()
      .then((res) => {
        if (active && res.ok) {
          setLanguage(res.data.language)
        }
      })
      .catch(() => {
        // Keep pt-BR default
      })

    const unsubscribe = window.englishChecks.onSettingsUpdated((status) => {
      if (active) {
        setLanguage(status.language)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const refreshStreak = useCallback(() => {
    if (isQuickCheckRoute) return
    window.englishChecks
      .getStats()
      .then((res) => {
        if (res.ok) {
          setStreakDays(res.data.currentStreakDays)
        }
      })
      .catch(() => {
        // Keep 0 streak gracefully
      })
  }, [isQuickCheckRoute])

  useEffect(() => {
    refreshStreak()
  }, [refreshStreak])

  useEffect(() => {
    if (isQuickCheckRoute) return
    let active = true

    window.englishChecks
      .getPomodoroState()
      .then((res) => {
        if (active && res.ok) {
          prevPomodoroRef.current = res.data
          setPomodoroState(res.data)
        }
      })
      .catch(() => {
        // Keep default idle state
      })

    const unsubscribePomodoro = window.englishChecks.onPomodoroTick((nextState) => {
      if (!active) return
      const prev = prevPomodoroRef.current
      if (
        prev.mode === 'focus' &&
        prev.status === 'running' &&
        nextState.mode === 'break'
      ) {
        refreshStreak()
      }
      prevPomodoroRef.current = nextState
      setPomodoroState(nextState)
    })

    return () => {
      active = false
      unsubscribePomodoro()
    }
  }, [isQuickCheckRoute, refreshStreak])

  const handleStartPomodoro = (): void => {
    void window.englishChecks.startPomodoro().then((res) => {
      if (res.ok) {
        prevPomodoroRef.current = res.data
        setPomodoroState(res.data)
      }
    })
  }

  const handlePausePomodoro = (): void => {
    void window.englishChecks.pausePomodoro().then((res) => {
      if (res.ok) {
        prevPomodoroRef.current = res.data
        setPomodoroState(res.data)
      }
    })
  }

  const handleResetPomodoro = (): void => {
    void window.englishChecks.resetPomodoro().then((res) => {
      if (res.ok) {
        prevPomodoroRef.current = res.data
        setPomodoroState(res.data)
      }
    })
  }

  if (isQuickCheckRoute) {
    return <QuickCheckOverlayView language={language} />
  }

  const handlePracticeFromDeck = (itemId: number): void => {
    setSelectedTrackId(null)
    setSelectedLabItemId(itemId)
    setActiveView('pronunciation-lab')
  }

  const handleOpenTrackItem = (trackId: number, itemId: number | null): void => {
    setSelectedTrackId(trackId)
    setSelectedLabItemId(itemId)
    setActiveView('pronunciation-lab')
  }

  return (
    <div className="h-screen overflow-hidden bg-surface-dim text-on-surface">
      <TitleBar
        streakDays={streakDays}
        language={language}
        pomodoro={pomodoroState}
        onStartPomodoro={handleStartPomodoro}
        onPausePomodoro={handlePausePomodoro}
        onResetPomodoro={handleResetPomodoro}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <SidebarRail
        activeView={activeView}
        language={language}
        onSelectView={setActiveView}
      />

      <div className="h-full pl-[184px] pt-10">
        <main className="h-full overflow-y-auto bg-surface-dim">
          {activeView === 'pronunciation-lab' && (
            <PronunciationLabView
              language={language}
              selectedTrackId={selectedTrackId}
              onSelectTrackId={setSelectedTrackId}
              selectedPracticeItemId={selectedLabItemId}
              onSessionRecorded={refreshStreak}
            />
          )}

          {activeView === 'tracks' && (
            <TracksView
              language={language}
              onOpenTrackItem={handleOpenTrackItem}
              onSessionRecorded={refreshStreak}
            />
          )}

          {activeView === 'writing-check' && (
            <WritingCheckView
              language={language}
              onSessionRecorded={refreshStreak}
            />
          )}

          {activeView === 'review-deck' && (
            <ReviewDeckView
              language={language}
              onPracticeItem={handlePracticeFromDeck}
            />
          )}

          {activeView === 'progress-stats' && (
            <ProgressStatsView language={language} />
          )}
        </main>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        language={language}
        onLanguageChanged={setLanguage}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}
