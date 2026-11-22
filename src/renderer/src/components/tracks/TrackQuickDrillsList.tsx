import { ArrowRight, CheckCircle2 } from 'lucide-react'
import type { AppLanguage, PracticeItem } from '../../../../shared/ipc-contracts'
import { getTranslations } from '../../i18n/translations'

interface TrackQuickDrillsListProps {
  trackId: number
  items: PracticeItem[]
  language: AppLanguage
  onOpenTrackItem: (trackId: number, itemId: number) => void
}

export function TrackQuickDrillsList({
  trackId,
  items,
  language,
  onOpenTrackItem
}: TrackQuickDrillsListProps) {
  const t = getTranslations(language).tracks

  return (
    <>
      {items.map((item, idx) => {
        const mastered = item.lastScore !== null && item.lastScore >= 75
        return (
          <div
            key={item.id}
            className="flex flex-col justify-between gap-2 rounded-xl border border-surface-container-high bg-surface-container-lowest p-3 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] text-outline">#{idx + 1}</span>
                <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-primary">
                  {t.activityTypes[item.activityType]}
                </span>
                <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[9px] text-on-surface-variant">
                  {item.category}
                </span>
                {mastered && (
                  <span className="inline-flex items-center gap-1 rounded bg-secondary-container/25 px-1.5 py-0.5 font-mono text-[9px] text-secondary">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {t.mastered}
                  </span>
                )}
                {item.lastScore !== null && (
                  <span className="font-mono text-[10px] text-outline">
                    {item.lastScore}%
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs font-medium text-on-surface">
                “{item.sentence}”
              </p>
              {item.promptPt && (
                <p className="mt-0.5 text-[11px] text-on-surface-variant">
                  <span className="font-mono text-[10px] text-outline">
                    {t.contextPtLabel}{' '}
                  </span>
                  {item.promptPt}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onOpenTrackItem(trackId, item.id)}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-surface-container-high px-3 py-1.5 text-[11px] font-semibold text-primary transition-all hover:bg-primary hover:text-on-primary"
            >
              <span>{t.practiceNow}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </>
  )
}
