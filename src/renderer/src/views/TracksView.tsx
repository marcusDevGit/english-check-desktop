import { ArrowRight, CheckCircle2, Compass, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  AppLanguage,
  LearningTrackProgress,
  PracticeItem
} from '../../../shared/ipc-contracts'
import { getTranslations } from '../i18n/translations'

interface TracksViewProps {
  language: AppLanguage
  onOpenTrackItem: (trackId: number, itemId: number | null) => void
}

export function TracksView({ language, onOpenTrackItem }: TracksViewProps) {
  const t = getTranslations(language).tracks
  const [tracks, setTracks] = useState<LearningTrackProgress[]>([])
  const [items, setItems] = useState<PracticeItem[]>([])
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    const [tracksRes, itemsRes] = await Promise.all([
      window.englishChecks.getTracks(),
      window.englishChecks.getPracticeItems()
    ])
    if (tracksRes.ok) {
      setTracks(tracksRes.data)
      setSelectedTrackId((prev) => prev ?? tracksRes.data[0]?.id ?? null)
    }
    if (itemsRes.ok) {
      setItems(itemsRes.data)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const selectedTrack = useMemo(
    () => tracks.find((track) => track.id === selectedTrackId) ?? tracks[0] ?? null,
    [selectedTrackId, tracks]
  )

  const trackItems = useMemo(() => {
    if (!selectedTrack) return []
    return items
      .filter((item) => item.trackId === selectedTrack.id)
      .sort((a, b) => a.orderIndex - b.orderIndex || a.id - b.id)
  }, [items, selectedTrack])

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden p-3">
      {/* Header */}
      <section className="flex items-center justify-between rounded-xl border border-surface-container-high bg-surface-container-low px-3.5 py-2 shadow-md">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-primary" />
          <div>
            <h1 className="text-xs font-semibold text-on-surface">{t.title}</h1>
            <p className="text-[10px] text-outline">{t.subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-1 text-[11px] font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{language === 'pt-BR' ? 'Atualizar' : 'Refresh'}</span>
        </button>
      </section>

      {/* Track Cards */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {tracks.map((track) => {
          const isSelected = selectedTrack?.id === track.id
          const title = language === 'pt-BR' ? track.titlePt : track.titleEn
          const description =
            language === 'pt-BR' ? track.descriptionPt : track.descriptionEn
          const percent =
            track.totalItems > 0
              ? Math.round((track.completedItems / track.totalItems) * 100)
              : 0
          const isDone = track.totalItems > 0 && track.completedItems === track.totalItems

          return (
            <div
              key={track.id}
              onClick={() => setSelectedTrackId(track.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedTrackId(track.id)
                }
              }}
              className={`flex cursor-pointer flex-col justify-between gap-2.5 rounded-2xl border p-3.5 text-left shadow-lg transition-all ${
                isSelected
                  ? 'border-primary/60 bg-surface-container-low ring-1 ring-primary/30'
                  : 'border-surface-container-high bg-surface-container-low/80 hover:border-outline/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
                    CEFR {track.level}
                  </span>
                  <span className="font-mono text-[10px] text-outline">
                    {track.completedItems}/{track.totalItems} {t.completedOf}
                  </span>
                </div>

                <h2 className="mt-2 text-xs font-semibold text-on-surface">{title}</h2>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-on-surface-variant">
                  {description}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-secondary transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenTrackItem(track.id, track.nextItemId)
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-container px-3 py-1.5 text-[11px] font-semibold text-on-primary-container transition-all hover:brightness-110"
                >
                  <span>{isDone ? t.reviewTrack : t.continueTrack}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </section>

      {/* Selected Track Activities */}
      <section className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-2xl border border-surface-container-high bg-surface-container-low p-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-on-surface">
            {selectedTrack
              ? language === 'pt-BR'
                ? selectedTrack.titlePt
                : selectedTrack.titleEn
              : ''}
          </h2>
          <span className="font-mono text-[10px] text-outline">
            {trackItems.length} {language === 'pt-BR' ? 'atividades' : 'activities'}
          </span>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {trackItems.map((item, idx) => {
            const mastered = item.lastScore !== null && item.lastScore >= 75
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-2 rounded-xl border border-surface-container-high bg-surface-container-lowest p-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[10px] text-outline">
                      #{idx + 1}
                    </span>
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
                  onClick={() =>
                    selectedTrack && onOpenTrackItem(selectedTrack.id, item.id)
                  }
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-surface-container-high px-3 py-1.5 text-[11px] font-semibold text-primary transition-all hover:bg-primary hover:text-on-primary"
                >
                  <span>{t.practiceNow}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
