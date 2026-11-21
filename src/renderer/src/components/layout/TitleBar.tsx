import { Flame, Minus, Pause, Play, RotateCcw, Settings, SpellCheck, Square, X } from 'lucide-react'
import { useState } from 'react'
import type { AppLanguage } from '../../../../shared/ipc-contracts'
import { getTranslations } from '../../i18n/translations'

interface TitleBarProps {
  streakDays: number
  language: AppLanguage
  onOpenSettings: () => void
}

export function TitleBar({ streakDays, language, onOpenSettings }: TitleBarProps) {
  const t = getTranslations(language).titleBar
  const [isMaximized, setIsMaximized] = useState(false)

  const handleToggleMaximize = async (): Promise<void> => {
    const result = await window.englishChecks.toggleMaximizeWindow()
    if (result.ok) {
      setIsMaximized(result.data.maximized)
    }
  }

  return (
    <header className="app-drag fixed top-0 right-0 left-0 z-50 flex h-10 items-center justify-between border-b border-surface-container-high bg-surface-container-lowest px-2 select-none">
      <div className="flex items-center gap-3 pl-2">
        <div className="flex items-center gap-2">
          <SpellCheck className="h-[18px] w-[18px] text-primary" />
          <span className="text-xs font-semibold tracking-wide text-on-surface">
            English Checks
          </span>
        </div>
        <span className="rounded bg-surface-container-high px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wider text-on-surface-variant uppercase">
          v0.1.0
        </span>
      </div>

      <div className="app-no-drag flex items-center gap-3">
        <div className="flex items-center gap-1 rounded bg-surface-container px-2 py-0.5 text-xs font-medium text-tertiary">
          <Flame className="h-3.5 w-3.5 text-tertiary" />
          <span>
            {streakDays} {t.days}
          </span>
        </div>

        <div
          className="flex items-center gap-2 rounded bg-surface-container px-2.5 py-0.5 font-mono text-xs text-on-surface-variant"
          title={t.pomodoroTooltip}
        >
          <span className="text-on-surface">25:00</span>
          <span className="text-[10px] text-outline">•</span>
          <span>{t.focus}</span>
          <button
            type="button"
            disabled
            aria-label={t.pomodoroTooltip}
            className="flex items-center text-outline/60 transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled
            aria-label={t.pomodoroTooltip}
            className="flex items-center text-outline/60 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <span className="hidden text-[9px] text-outline/70 sm:inline">
            <Pause className="hidden" />
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          title={t.settingsTitle}
          className="flex h-6 w-6 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <div className="app-no-drag -mr-2 flex h-full items-center">
        <button
          type="button"
          onClick={() => void window.englishChecks.minimizeWindow()}
          aria-label={t.minimize}
          className="flex h-10 w-11 items-center justify-center text-outline transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => void handleToggleMaximize()}
          aria-label={isMaximized ? t.restore : t.maximize}
          className="flex h-10 w-11 items-center justify-center text-outline transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <Square className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => void window.englishChecks.closeWindow()}
          aria-label={t.close}
          className="flex h-10 w-11 items-center justify-center text-outline transition-colors hover:bg-error-container hover:text-on-error-container"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
