import { AlertCircle, ArrowRight, Layers, RefreshCw, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AppLanguage,
  PhonemeError,
  PracticeItem
} from '../../../shared/ipc-contracts'
import { getTranslations, type Translations } from '../i18n/translations'

interface ReviewDeckViewProps {
  language: AppLanguage
  onPracticeItem: (itemId: number) => void
}

function formatDueLabel(
  nextReviewAt: string | null,
  t: Translations['review']
): { label: string; isDue: boolean } {
  if (!nextReviewAt) {
    return { label: t.newReady, isDue: true }
  }
  const diffMs = new Date(nextReviewAt).getTime() - Date.now()
  if (diffMs <= 0) {
    return { label: t.dueNow, isDue: true }
  }
  const hours = Math.ceil(diffMs / (1000 * 60 * 60))
  if (hours < 24) {
    return { label: `${t.inPrefix} ${hours}h`, isDue: false }
  }
  return { label: `${t.inPrefix} ${Math.ceil(hours / 24)}d`, isDue: false }
}

export function ReviewDeckView({ language, onPracticeItem }: ReviewDeckViewProps) {
  const t = getTranslations(language).review
  const [errors, setErrors] = useState<PhonemeError[]>([])
  const [items, setItems] = useState<PracticeItem[]>([])
  const [recentGeneratedIds, setRecentGeneratedIds] = useState<number[]>([])
  const [onlyAiFilter, setOnlyAiFilter] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [statusNotice, setStatusNotice] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const queueSectionRef = useRef<HTMLElement | null>(null)

  const loadDeck = useCallback(async () => {
    setIsLoading(true)
    const [errorsRes, itemsRes] = await Promise.all([
      window.englishChecks.getPhonemeErrors(),
      window.englishChecks.getPracticeItems()
    ])
    if (errorsRes.ok) setErrors(errorsRes.data)
    if (itemsRes.ok) setItems(itemsRes.data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void loadDeck()
  }, [loadDeck])

  const handleGenerateDrills = async (): Promise<void> => {
    if (isGenerating) return
    setIsGenerating(true)
    setStatusNotice(null)

    const res = await window.englishChecks.generateCustomDrills({ count: 3 })
    setIsGenerating(false)

    if (res.ok) {
      const createdIds = res.data.map((item) => item.id)
      setRecentGeneratedIds(createdIds)
      setStatusNotice({
        type: 'success',
        text: `${res.data.length} ${t.drillsGeneratedMsg}`
      })
      await loadDeck()
      queueSectionRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setStatusNotice({ type: 'error', text: res.error })
    }
  }

  const aiCount = useMemo(
    () => items.filter((item) => item.trackId === null).length,
    [items]
  )

  const displayedItems = useMemo(() => {
    const recentSet = new Set(recentGeneratedIds)
    const filtered = onlyAiFilter
      ? items.filter((item) => item.trackId === null)
      : items

    return [...filtered].sort((a, b) => {
      const aRecent = recentSet.has(a.id) ? 0 : 1
      const bRecent = recentSet.has(b.id) ? 0 : 1
      if (aRecent !== bRecent) return aRecent - bRecent

      const aCustom = a.trackId === null ? 0 : 1
      const bCustom = b.trackId === null ? 0 : 1
      if (aCustom !== bCustom) return aCustom - bCustom

      return b.id - a.id
    })
  }, [items, onlyAiFilter, recentGeneratedIds])

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden p-3">
      <section className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-surface-container-high bg-surface-container-low px-3.5 py-2 shadow-md">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-on-surface">{t.title}</span>
          <span className="rounded-full bg-surface-container px-2 py-0.5 font-mono text-[10px] text-outline">
            {errors.length} {t.hotspotsSuffix} • {items.length} {t.drillsSuffix}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => void handleGenerateDrills()}
            className="flex items-center gap-1.5 rounded-lg bg-primary-container px-3 py-1 text-[11px] font-semibold text-on-primary-container transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className="h-3 w-3" />
            <span>{isGenerating ? t.generatingDrills : t.generateDrills}</span>
          </button>

          <button
            type="button"
            onClick={() => void loadDeck()}
            className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-1 text-[11px] font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t.refresh}</span>
          </button>
        </div>
      </section>

      {statusNotice && (
        <div
          className={`rounded-xl border px-3 py-2 text-[11px] ${
            statusNotice.type === 'success'
              ? 'border-secondary/30 bg-secondary-container/20 text-secondary'
              : 'border-error/30 bg-error-container/25 text-error'
          }`}
        >
          {statusNotice.text}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12">
        <section className="flex min-h-0 flex-col gap-2.5 overflow-y-auto rounded-2xl border border-surface-container-high bg-surface-container-low p-3.5 shadow-xl lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-on-surface">
              {t.recurringHotspots}
            </h2>
            <span className="font-mono text-[10px] text-outline">{t.sqliteTracked}</span>
          </div>

          {errors.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-surface-container-high bg-surface-container-lowest/50 p-5 text-center">
              <AlertCircle className="h-5 w-5 text-outline" />
              <p className="mt-2 text-xs font-medium text-on-surface-variant">
                {t.noErrorsTitle}
              </p>
              <p className="mt-1 text-[11px] text-outline">{t.noErrorsHint}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {errors.map((err) => (
                <div
                  key={err.id}
                  className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-on-surface">
                        {err.word}
                      </span>
                      <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                        {err.expectedSound}
                      </span>
                    </div>
                    <span className="rounded-full bg-error-container/30 px-2 py-0.5 font-mono text-[10px] font-semibold text-error">
                      {err.occurrences}x
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-on-surface-variant">
                    {err.userIssue}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section
          ref={queueSectionRef}
          className="flex min-h-0 flex-col gap-2.5 overflow-y-auto rounded-2xl border border-surface-container-high bg-surface-container-low p-3.5 shadow-xl lg:col-span-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-semibold text-on-surface">{t.practiceQueue}</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOnlyAiFilter((prev) => !prev)}
                className={
                  onlyAiFilter
                    ? 'flex items-center gap-1 rounded-lg bg-primary-container px-2 py-0.5 font-mono text-[10px] font-semibold text-on-primary-container'
                    : 'flex items-center gap-1 rounded-lg bg-surface-container px-2 py-0.5 font-mono text-[10px] text-on-surface-variant hover:text-on-surface'
                }
              >
                <Sparkles className="h-2.5 w-2.5" />
                <span>
                  {t.onlyAiFilter} ({aiCount})
                </span>
              </button>
              <span className="font-mono text-[10px] text-outline">{t.orderedByDue}</span>
            </div>
          </div>

          {displayedItems.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-surface-container-high bg-surface-container-lowest/50 p-5 text-center text-xs text-outline">
              {t.noAiDrillsHint}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {displayedItems.map((item) => {
                const due = formatDueLabel(item.nextReviewAt, t)
                const isJustCreated = recentGeneratedIds.includes(item.id)
                const isAiCustom = item.trackId === null

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col justify-between gap-2 rounded-xl border bg-surface-container-lowest p-3 sm:flex-row sm:items-center ${
                      isJustCreated
                        ? 'border-primary/60 ring-1 ring-primary/25'
                        : 'border-surface-container-high'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isJustCreated && (
                          <span className="inline-flex items-center gap-1 rounded bg-primary-container px-1.5 py-0.5 font-mono text-[9px] font-semibold text-on-primary-container">
                            <Sparkles className="h-2.5 w-2.5" />
                            {t.newAiBadge}
                          </span>
                        )}
                        {!isJustCreated && isAiCustom && (
                          <span className="inline-flex items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-primary">
                            <Sparkles className="h-2.5 w-2.5" />
                            {t.aiCustomBadge}
                          </span>
                        )}
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold ${
                            due.isDue
                              ? 'bg-tertiary-container/25 text-tertiary'
                              : 'bg-surface-container text-outline'
                          }`}
                        >
                          {due.label}
                        </span>
                        <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[9px] text-primary">
                          {item.category}
                        </span>
                        <span className="font-mono text-[10px] text-outline">
                          {t.attempts}: {item.attemptsCount} • {t.last}:{' '}
                          {item.lastScore !== null ? `${item.lastScore}%` : '—'}
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs font-medium text-on-surface">
                        “{item.sentence}”
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[10px] text-outline">
                        {item.ipa}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onPracticeItem(item.id)}
                      className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary-container px-3 py-1.5 text-[11px] font-semibold text-on-primary-container transition-all hover:brightness-110"
                    >
                      <span>{t.practiceInLab}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
