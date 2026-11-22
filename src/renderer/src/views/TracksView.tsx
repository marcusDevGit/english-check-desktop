import { BookOpen, Compass, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  AppLanguage,
  LearningTrackProgress,
  LessonSummary,
  PracticeItem
} from '../../../shared/ipc-contracts'
import { CustomTrackModal } from '../components/tracks/CustomTrackModal'
import { LessonPlayerView } from '../components/tracks/LessonPlayerView'
import { TrackCardGrid } from '../components/tracks/TrackCardGrid'
import { TrackLessonsList } from '../components/tracks/TrackLessonsList'
import { TrackQuickDrillsList } from '../components/tracks/TrackQuickDrillsList'
import { getTranslations } from '../i18n/translations'

interface TracksViewProps {
  language: AppLanguage
  onOpenTrackItem: (trackId: number, itemId: number | null) => void
  onSessionRecorded?: () => void
}

export function TracksView({
  language,
  onOpenTrackItem,
  onSessionRecorded
}: TracksViewProps) {
  const t = getTranslations(language).tracks
  const isPt = language === 'pt-BR'

  const [tracks, setTracks] = useState<LearningTrackProgress[]>([])
  const [items, setItems] = useState<PracticeItem[]>([])
  const [trackLessons, setTrackLessons] = useState<LessonSummary[]>([])
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null)
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'lessons' | 'drills'>('lessons')
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false)
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

  const loadLessonsForTrack = useCallback(async (trackId: number) => {
    const res = await window.englishChecks.getTrackLessons({ trackId })
    setTrackLessons(res.ok ? res.data : [])
  }, [])

  useEffect(() => {
    if (!selectedTrack) {
      setTrackLessons([])
      return
    }
    void loadLessonsForTrack(selectedTrack.id)
  }, [loadLessonsForTrack, selectedTrack])

  const trackItems = useMemo(() => {
    if (!selectedTrack) return []
    return items
      .filter((item) => item.trackId === selectedTrack.id)
      .sort((a, b) => a.orderIndex - b.orderIndex || a.id - b.id)
  }, [items, selectedTrack])

  const activeLesson = useMemo(
    () => trackLessons.find((lesson) => lesson.id === activeLessonId) ?? null,
    [activeLessonId, trackLessons]
  )

  if (selectedTrack && activeLesson) {
    return (
      <LessonPlayerView
        language={language}
        track={selectedTrack}
        lesson={activeLesson}
        onBack={() => setActiveLessonId(null)}
        onLessonUpdated={() => {
          void loadData()
          void loadLessonsForTrack(selectedTrack.id)
        }}
        onSessionRecorded={onSessionRecorded}
      />
    )
  }

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden p-3">
      <section className="flex items-center justify-between rounded-xl border border-surface-container-high bg-surface-container-low px-3.5 py-2 shadow-md">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-primary" />
          <div>
            <h1 className="text-xs font-semibold text-on-surface">{t.title}</h1>
            <p className="text-[10px] text-outline">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCustomModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-container px-2.5 py-1 text-[11px] font-semibold text-on-primary-container transition-all hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t.createCustomBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              void loadData()
              if (selectedTrack) void loadLessonsForTrack(selectedTrack.id)
            }}
            className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-1 text-[11px] font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isPt ? 'Atualizar' : 'Refresh'}</span>
          </button>
        </div>
      </section>

      <TrackCardGrid
        tracks={tracks}
        selectedTrackId={selectedTrack?.id ?? null}
        language={language}
        onSelectTrack={(id) => {
          setSelectedTrackId(id)
          setActiveTab('lessons')
        }}
        onOpenTrackDrills={onOpenTrackItem}
      />

      <section className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden rounded-2xl border border-surface-container-high bg-surface-container-low p-3.5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold text-on-surface">
            {selectedTrack ? (isPt ? selectedTrack.titlePt : selectedTrack.titleEn) : ''}
          </h2>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('lessons')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                activeTab === 'lessons'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <BookOpen className="h-3 w-3" />
              <span>
                {t.guidedLessonsTab} ({trackLessons.length})
              </span>
            </button>

            {trackItems.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('drills')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  activeTab === 'drills'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>
                  {t.quickDrillsTab} ({trackItems.length})
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {activeTab === 'lessons' && (
            <TrackLessonsList
              lessons={trackLessons}
              language={language}
              onOpenLesson={setActiveLessonId}
            />
          )}

          {activeTab === 'drills' && selectedTrack && (
            <TrackQuickDrillsList
              trackId={selectedTrack.id}
              items={trackItems}
              language={language}
              onOpenTrackItem={onOpenTrackItem}
            />
          )}
        </div>
      </section>

      <CustomTrackModal
        isOpen={isCustomModalOpen}
        language={language}
        onClose={() => setIsCustomModalOpen(false)}
        onCreated={(createdTrack) => {
          setIsCustomModalOpen(false)
          setSelectedTrackId(createdTrack.id)
          setActiveTab('lessons')
          void loadData()
          void loadLessonsForTrack(createdTrack.id)
        }}
      />
    </div>
  )
}
