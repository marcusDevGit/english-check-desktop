import { ArrowRight, Award } from 'lucide-react'
import type { AppLanguage, LearningTrackProgress } from '../../../../shared/ipc-contracts'
import { getTranslations } from '../../i18n/translations'

interface TrackCardGridProps {
  tracks: LearningTrackProgress[]
  selectedTrackId: number | null
  language: AppLanguage
  onSelectTrack: (trackId: number) => void
  onOpenTrackDrills: (trackId: number, itemId: number | null) => void
}

export function TrackCardGrid({
  tracks,
  selectedTrackId,
  language,
  onSelectTrack,
  onOpenTrackDrills
}: TrackCardGridProps) {
  const t = getTranslations(language).tracks
  const isPt = language === 'pt-BR'

  return (
    <section className="grid max-h-[270px] grid-cols-1 gap-2.5 overflow-y-auto pr-1 md:grid-cols-3">
      {tracks.map((track) => {
        const isSelected = selectedTrackId === track.id
        const title = isPt ? track.titlePt : track.titleEn
        const description = isPt ? track.descriptionPt : track.descriptionEn
        const percent =
          track.totalLessons > 0
            ? Math.round((track.completedLessons / track.totalLessons) * 100)
            : track.totalItems > 0
              ? Math.round((track.completedItems / track.totalItems) * 100)
              : 0
        const isDone =
          track.totalLessons > 0
            ? track.completedLessons === track.totalLessons
            : track.totalItems > 0 && track.completedItems === track.totalItems

        return (
          <div
            key={track.id}
            onClick={() => onSelectTrack(track.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelectTrack(track.id)
              }
            }}
            className={`flex cursor-pointer flex-col justify-between gap-2 rounded-2xl border p-3 text-left shadow-lg transition-all ${
              isSelected
                ? 'border-primary/60 bg-surface-container-low ring-1 ring-primary/30'
                : 'border-surface-container-high bg-surface-container-low/80 hover:border-outline/50'
            }`}
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
                    CEFR {track.level}
                  </span>
                  {track.sourceType === 'custom_text' && (
                    <span className="rounded bg-secondary-container/25 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-secondary">
                      {t.customBadge}
                    </span>
                  )}
                  {track.totalXp > 0 && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-tertiary-container/20 px-1.5 py-0.5 font-mono text-[10px] text-tertiary">
                      <Award className="h-2.5 w-2.5" />
                      {track.earnedXp}/{track.totalXp} XP
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-outline">
                  {track.totalLessons > 0
                    ? `${track.completedLessons}/${track.totalLessons} ${
                        isPt ? 'lições' : 'lessons'
                      }`
                    : `${track.completedItems}/${track.totalItems} ${t.completedOf}`}
                </span>
              </div>

              <h2 className="mt-1.5 text-xs font-semibold text-on-surface">{title}</h2>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-on-surface-variant">
                {description}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full rounded-full bg-secondary transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {track.totalItems > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenTrackDrills(track.id, track.nextItemId)
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-1 text-[10px] font-semibold text-on-surface-variant transition-all hover:bg-primary-container hover:text-on-primary-container"
                >
                  <span>{isDone ? t.reviewTrack : t.continueTrack}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </section>
  )
}
