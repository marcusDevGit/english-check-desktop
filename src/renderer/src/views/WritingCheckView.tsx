import { AlertTriangle, Check, Copy, Eraser, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type {
  AppLanguage,
  CheckGrammarResponse,
  WritingContext
} from '../../../shared/ipc-contracts'
import { getTranslations } from '../i18n/translations'

interface WritingCheckViewProps {
  language: AppLanguage
  onSessionRecorded: () => void
}

const CONTEXT_IDS: WritingContext[] = ['work_tech', 'email', 'conversation', 'academic']

export function WritingCheckView({ language, onSessionRecorded }: WritingCheckViewProps) {
  const t = getTranslations(language).writing

  const [context, setContext] = useState<WritingContext>('work_tech')
  const [draft, setDraft] = useState(
    'I have worked on this feature since two days ago and I am thinking to deploy it tomorrow morning if everybody agree.'
  )
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<CheckGrammarResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCheck = useCallback(async () => {
    const trimmed = draft.trim()
    if (!trimmed || isChecking) return

    setIsChecking(true)
    setError(null)
    const response = await window.englishChecks.checkGrammar({
      text: trimmed,
      context
    })
    setIsChecking(false)

    if (response.ok) {
      setResult(response.data)
      onSessionRecorded()
    } else {
      setError(response.error)
    }
  }, [context, draft, isChecking, onSessionRecorded])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault()
        void handleCheck()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleCheck])

  const copyText = (id: string, text: string): void => {
    void navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500)
  }

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0
  const score = result?.naturalnessScore ?? null
  const dashOffset = score !== null ? 251.2 - (251.2 * score) / 100 : 251.2

  return (
    <div className="relative flex h-full w-full flex-col gap-3 overflow-hidden p-3">
      {/* Top Context Bar */}
      <section className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-surface-container-high bg-surface-container-low px-3 py-2 text-xs shadow-md">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 font-mono text-[10px] text-outline uppercase">
            {t.contextLabel}
          </span>
          {CONTEXT_IDS.map((id) => {
            const active = context === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setContext(id)}
                className={
                  active
                    ? 'flex items-center gap-1.5 rounded-lg bg-surface-container-high px-2.5 py-1 text-[11px] font-semibold text-primary shadow-sm'
                    : 'rounded-lg bg-surface-container px-2.5 py-1 text-[11px] text-on-surface-variant transition-colors hover:text-on-surface'
                }
              >
                {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                <span>{t.contexts[id]}</span>
              </button>
            )
          })}
        </div>

        <span className="font-mono text-[10px] text-outline">
          {t.shortcut}{' '}
          <kbd className="rounded bg-surface-container-high px-1.5 py-0.5 text-on-surface">
            Ctrl+Enter
          </kbd>
        </span>
      </section>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-error/30 bg-error-container/25 px-3 py-2 text-[11px] text-error">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Split Workspace */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Left: Draft Editor */}
        <section className="flex min-h-0 flex-col justify-between gap-3 rounded-2xl border border-surface-container-high bg-surface-container-low p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface">{t.originalDraft}</span>
            <span className="font-mono text-[10px] text-outline">
              {wordCount} {t.words} • {draft.length} {t.chars}
            </span>
          </div>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t.placeholder}
            className="min-h-0 flex-1 resize-none rounded-xl border border-surface-container-high bg-surface-container-lowest p-3 text-sm leading-relaxed text-on-surface placeholder:text-outline/60 focus:border-primary focus:outline-none"
          />

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft('')
                setResult(null)
                setError(null)
              }}
              className="flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <Eraser className="h-3.5 w-3.5" />
              <span>{t.clear}</span>
            </button>

            <button
              type="button"
              disabled={!draft.trim() || isChecking}
              onClick={() => void handleCheck()}
              className="flex items-center gap-1.5 rounded-lg bg-primary-container px-4 py-1.5 text-xs font-semibold text-on-primary-container shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isChecking ? t.checking : t.checkBtn}</span>
            </button>
          </div>
        </section>

        {/* Right: AI Evaluation */}
        <section className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-2xl border border-surface-container-high bg-surface-container-low p-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-surface-container-high pb-2.5">
            <div>
              <h2 className="text-xs font-semibold text-on-surface">{t.aiEval}</h2>
              <p className="text-[10px] text-outline">{t.aiEvalSubtitle}</p>
            </div>

            <div className="relative flex h-14 w-14 items-center justify-center">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#353437" strokeWidth="9" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#4edea3"
                  strokeDasharray="251.2"
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  strokeWidth="9"
                />
              </svg>
              <span className="absolute font-mono text-xs font-bold text-secondary">
                {score !== null ? `${score}%` : '—'}
              </span>
            </div>
          </div>

          {!result ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-surface-container-high bg-surface-container-lowest/50 p-6 text-center text-xs text-outline">
              {t.emptyHint}
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-secondary/25 bg-surface-container-lowest p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-semibold text-secondary uppercase">
                    {t.correctedVersion}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDraft(result.correctedText)}
                      className="rounded bg-surface-container px-2 py-0.5 text-[10px] font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                    >
                      {t.replaceDraft}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText('corrected', result.correctedText)}
                      className="flex items-center gap-1 rounded bg-surface-container px-2 py-0.5 text-[10px] text-primary hover:bg-surface-container-high"
                    >
                      {copiedId === 'corrected' ? (
                        <Check className="h-3 w-3 text-secondary" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>{copiedId === 'corrected' ? t.copied : t.copy}</span>
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-on-surface">
                  {result.correctedText}
                </p>
              </div>

              {result.naturalAlternatives.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] text-outline uppercase">
                    {t.alternatives}
                  </span>
                  {result.naturalAlternatives.map((alt, idx) => (
                    <div
                      key={`${alt.label}-${idx}`}
                      className="flex items-start justify-between gap-2 rounded-xl bg-surface-container-lowest p-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="inline-block rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-primary">
                          {alt.label}
                        </span>
                        <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                          {alt.text}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyText(`alt-${idx}`, alt.text)}
                        className="shrink-0 rounded p-1 text-outline hover:bg-surface-container hover:text-on-surface"
                        title={t.copy}
                      >
                        {copiedId === `alt-${idx}` ? (
                          <Check className="h-3.5 w-3.5 text-secondary" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {result.explanations.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] text-outline uppercase">
                    {t.notes}
                  </span>
                  {result.explanations.map((note, idx) => (
                    <div
                      key={`${note.rule}-${idx}`}
                      className="rounded-xl border border-surface-container-high bg-surface-container-lowest/80 p-2.5"
                    >
                      <p className="text-[11px] font-semibold text-tertiary">{note.rule}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-on-surface-variant">
                        {note.detail}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
