import { BarChart3, FileEdit, Layers, Mic, User } from 'lucide-react'
import type { AppLanguage } from '../../../../shared/ipc-contracts'
import { getTranslations } from '../../i18n/translations'

export type StudioView =
  | 'pronunciation-lab'
  | 'writing-check'
  | 'review-deck'
  | 'progress-stats'

interface SidebarRailProps {
  activeView: StudioView
  language: AppLanguage
  onSelectView: (view: StudioView) => void
}

export function SidebarRail({ activeView, language, onSelectView }: SidebarRailProps) {
  const t = getTranslations(language).nav

  const navItems: Array<{
    id: StudioView
    label: string
    icon: typeof Mic
  }> = [
    { id: 'pronunciation-lab', label: t.pronunciationLab, icon: Mic },
    { id: 'writing-check', label: t.writingCheck, icon: FileEdit },
    { id: 'review-deck', label: t.reviewDeck, icon: Layers },
    { id: 'progress-stats', label: t.progressStats, icon: BarChart3 }
  ]

  return (
    <aside className="fixed top-10 left-0 z-40 flex h-[calc(100vh-2.5rem)] w-[184px] flex-col justify-between border-r border-surface-container-high bg-surface-container-lowest py-2.5 select-none">
      <nav className="flex flex-col gap-1 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={
                isActive
                  ? 'flex items-center gap-2 rounded-lg bg-primary-container px-2.5 py-2 text-left text-xs font-semibold text-on-primary-container transition-colors'
                  : 'flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface'
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="flex flex-col gap-2 px-2">
        <button
          type="button"
          onClick={() => void window.englishChecks.toggleQuickCheck()}
          className="flex items-center justify-between rounded-lg border border-surface-container-high bg-surface-container-low px-2 py-1.5 text-[10px] text-outline transition-colors hover:border-primary/40 hover:text-on-surface"
          title={`${t.quickCheck} (Ctrl+Shift+E)`}
        >
          <span className="truncate">{t.quickCheck}</span>
          <kbd className="rounded bg-surface-container-highest px-1.5 py-0.5 font-mono text-[9px] text-on-surface">
            Ctrl+Shift+E
          </kbd>
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-surface-container-high bg-surface-container-low px-2 py-1.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
            <User className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col overflow-hidden leading-tight">
            <span className="truncate text-[11px] font-medium text-on-surface">
              English Checks
            </span>
            <span className="truncate text-[10px] text-secondary">
              {t.studioTag}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
