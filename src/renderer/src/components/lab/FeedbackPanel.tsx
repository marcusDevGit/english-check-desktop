import { ArrowRight, Sparkles } from 'lucide-react'
import type {
  Accent,
  AnalyzePronunciationResponse,
  AppLanguage
} from '../../../../shared/ipc-contracts'
import { getTranslations } from '../../i18n/translations'

interface FeedbackPanelProps {
  language: AppLanguage
  accent: Accent
  category: string | undefined
  sentenceWords: string[]
  analysisResult: AnalyzePronunciationResponse | null
  onNextExercise: () => void
}

export function FeedbackPanel({
  language,
  accent,
  category,
  sentenceWords,
  analysisResult,
  onNextExercise
}: FeedbackPanelProps) {
  const t = getTranslations(language).lab
  const scoreValue = analysisResult?.overallScore ?? null
  const strokeDashoffset =
    scoreValue !== null ? 251.2 - (251.2 * scoreValue) / 100 : 251.2

  return (
    <section className="relative z-10 grid w-full grid-cols-1 gap-2.5 lg:grid-cols-12">
      {/* Column 1: Score */}
      <div className="flex flex-col justify-between gap-2 rounded-xl border border-surface-container-high bg-surface-container-low p-3 shadow-lg lg:col-span-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium tracking-wide text-on-surface uppercase">
            {t.scoreTitle}
          </span>
          <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[9px] font-semibold text-outline">
            {scoreValue !== null ? t.analyzed : t.standby}
          </span>
        </div>

        <div className="flex items-center justify-center py-0.5">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#353437" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#4edea3"
                strokeDasharray="251.2"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                strokeWidth="8"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold tracking-tight text-secondary">
                {scoreValue !== null ? scoreValue : '—'}
                <span className="text-xs font-normal">%</span>
              </span>
              <span className="max-w-[66px] truncate text-[8px] font-medium tracking-wider text-on-surface-variant uppercase">
                {analysisResult?.fluencyNote ?? t.ready}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-surface-container-high/50 pt-1 font-mono text-[10px] text-outline">
          {t.target}: <span className="text-on-surface">{accent}</span>
        </div>
      </div>

      {/* Column 2: Word-by-Word */}
      <div className="flex flex-col justify-between gap-2 rounded-xl border border-surface-container-high bg-surface-container-low p-3 shadow-lg lg:col-span-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-on-surface">{t.wordBreakdown}</span>
          <span className="text-[10px] text-outline">
            {analysisResult ? t.geminiEval : t.previewTokens}
          </span>
        </div>

        <div className="flex flex-wrap content-start items-center gap-1.5 py-0.5">
          {analysisResult
            ? analysisResult.words.map((item, idx) => {
                const style =
                  item.status === 'accurate'
                    ? 'bg-surface-container text-secondary'
                    : item.status === 'stress_issue'
                      ? 'bg-tertiary-container/20 text-tertiary'
                      : 'bg-error-container/25 text-error'
                return (
                  <div
                    key={`${item.word}-${idx}`}
                    title={item.note ?? item.ipaExpected}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium shadow-sm ${style}`}
                  >
                    <span className="text-on-surface">{item.word}</span>
                    <span className="font-mono text-[10px] font-semibold">
                      {item.score}%
                    </span>
                  </div>
                )
              })
            : sentenceWords.map((word, idx) => (
                <span
                  key={`${word}-${idx}`}
                  className="rounded-md bg-surface-container px-2 py-1 text-[11px] font-medium text-on-surface-variant"
                >
                  {word}
                </span>
              ))}
        </div>

        <div className="flex items-center gap-3 border-t border-surface-container-high/50 pt-1 text-[10px] text-outline">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> {t.accurate}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-tertiary" /> {t.stress}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-error" /> {t.mispronounced}
          </span>
        </div>
      </div>

      {/* Column 3: Coach Tip */}
      <div className="flex flex-col justify-between gap-2 rounded-xl border border-surface-container-high bg-surface-container-low p-3 shadow-lg lg:col-span-4">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/20 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-xs font-semibold text-on-surface">{t.guideTitle}</h3>
            <span className="text-[10px] text-outline">{t.guideSubtitle}</span>
          </div>
        </div>

        <div className="rounded-lg bg-surface-container-lowest p-2.5 text-[11px] leading-relaxed text-on-surface-variant">
          {analysisResult?.articulatoryTip ??
            `${t.defaultTipPrefix} "${category ?? 'phonetics'}": ${t.defaultTipSuffix}`}
        </div>

        <button
          type="button"
          onClick={onNextExercise}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-surface-container-high px-3 py-1.5 text-[11px] font-semibold text-primary shadow-sm transition-all hover:bg-primary hover:text-on-primary"
        >
          <span>{t.nextSentence}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  )
}
