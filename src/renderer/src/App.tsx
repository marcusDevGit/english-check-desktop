import { useCallback, useEffect, useState } from 'react'
import type { AppLanguage } from '../../shared/ipc-contracts'
import { SidebarRail, type StudioView } from './components/layout/SidebarRail'
import { TitleBar } from './components/layout/TitleBar'
import { SettingsModal } from './components/settings/SettingsModal'
import { ProgressStatsView } from './views/ProgressStatsView'
import { PronunciationLabView } from './views/PronunciationLabView'
import { QuickCheckOverlayView } from './views/QuickCheckOverlayView'
import { ReviewDeckView } from './views/ReviewDeckView'
import { WritingCheckView } from './views/WritingCheckView'

export default function App() {
  const [isQuickCheckRoute] = useState(
    () => window.location.hash === '#/quick-check'
  )
  const [language, setLanguage] = useState<AppLanguage>('pt-BR')
  const [activeView, setActiveView] = useState<StudioView>('pronunciation-lab')
  const [streakDays, setStreakDays] = useState<number>(0)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedLabItemId, setSelectedLabItemId] = useState<number | null>(null)

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

  if (isQuickCheckRoute) {
    return <QuickCheckOverlayView language={language} />
  }

  const handlePracticeFromDeck = (itemId: number): void => {
    setSelectedLabItemId(itemId)
    setActiveView('pronunciation-lab')
  }

  return (
    <div className="h-screen overflow-hidden bg-surface-dim text-on-surface">
      <TitleBar
        streakDays={streakDays}
        language={language}
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
              selectedPracticeItemId={selectedLabItemId}
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
