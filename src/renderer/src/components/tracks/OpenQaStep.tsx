import { ArrowRight, Clock, Loader2, Mic, Sparkles, Square } from 'lucide-react'
import { useEffect, useState } from 'react'
import type {
  ActivityPayload,
  AppLanguage,
  EvaluateOpenQaResponse
} from '../../../../shared/ipc-contracts'
import { getTranslations } from '../../i18n/translations'

type OpenQaPayload = Extract<ActivityPayload, { type: 'open_qa' }>

interface OpenQaStepProps {
  language: AppLanguage
  payload: OpenQaPayload
  isRecording: boolean
  hasRecording: boolean
  isSubmitting: boolean
  result: EvaluateOpenQaResponse | null
  hasNextStep: boolean
  onSpeakChip: (chip: string) => void
  onToggleRecording: () => void
  onAnalyze: () => void
  onNextStep: () => void
}

export function OpenQaStep({
  language,
  payload,
  isRecording,
  hasRecording,
  isSubmitting,
  result,
  hasNextStep,
  onSpeakChip,
  onToggleRecording,
  onAnalyze,
  onNextStep
}: OpenQaStepProps) {
  const t = getTranslations(language).tracks
  const isPt = language === 'pt-BR'
  const [secondsLeft, setSecondsLeft] = useState(payload.suggestedSeconds)
  const [activeChip, setActiveChip] = useState<string | null>(null)

  useEffect(() => {
    setSecondsLeft(payload.suggestedSeconds)
    setActiveChip(null)
  }, [payload])

  useEffect(() => {
    if (!isRecording) return
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [isRecording])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="rounded bg-primary/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
          {t.stepLabels.open_qa}
        </span>
        <div className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-1 font-mono text-xs text-tertiary">
          <Clock className="h-3.5 w-3.5" />
          <span>{secondsLeft}s</span>
        </div>
      </div>

      <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
        <p className="text-base font-semibold text-on-surface">{payload.question}</p>
        <p className="mt-1.5 text-xs text-on-surface-variant">{payload.ptContext}</p>

        <div className="mt-3">
          <p className="font-mono text-[10px] uppercase text-outline">
            {isPt ? 'Tópicos esperados:' : 'Target topics:'}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {payload.expectedTopics.map((topic) => {
              const covered = result?.coveredTopics.includes(topic)
              return (
                <span
                  key={topic}
                  className={`rounded-md px-2 py-0.5 text-[11px] ${
                    covered
                      ? 'bg-secondary-container/30 font-semibold text-secondary'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {topic}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium text-outline">
          {t.starterChipsLabel}
        </p>
        <div className="flex flex-wrap gap-2">
          {payload.starterChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setActiveChip(chip)
                onSpeakChip(chip)
              }}
              className={`rounded-lg border px-2.5 py-1 text-xs transition-all ${
                activeChip === chip
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-surface-container-high bg-surface-container-lowest text-on-surface-variant hover:border-primary/50 hover:text-on-surface'
              }`}
            >
              “{chip}”
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleRecording}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold ${
            isRecording
              ? 'animate-pulse bg-error text-on-error'
              : 'bg-primary text-on-primary'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="h-3.5 w-3.5" />
              <span>{isPt ? 'Parar Resposta' : 'Stop Answer'}</span>
            </>
          ) : (
            <>
              <Mic className="h-3.5 w-3.5" />
              <span>{isPt ? 'Gravar Resposta Livre' : 'Record Spoken Answer'}</span>
            </>
          )}
        </button>

        {hasRecording && !isRecording && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onAnalyze}
            className="flex items-center gap-1.5 rounded-xl bg-secondary-container px-4 py-2 text-xs font-semibold text-on-secondary-container hover:brightness-110 disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>{isSubmitting ? t.analyzing : t.analyzeAudio}</span>
          </button>
        )}
      </div>

      {result && (
        <div className="flex flex-col gap-2 rounded-2xl border border-secondary/30 bg-surface-container-lowest p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-secondary">
              Score: {result.score}%
            </span>
            {hasNextStep && (
              <button
                type="button"
                onClick={onNextStep}
                className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary"
              >
                <span>{t.nextStep}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-outline">
            <strong className="text-on-surface-variant">Transcript: </strong>“
            {result.transcript}”
          </p>
          <p className="text-xs text-on-surface">{result.feedback}</p>
          <p className="rounded-lg bg-surface-container p-2.5 text-xs text-primary">
            <strong>{isPt ? 'Versão mais natural: ' : 'Model phrasing: '}</strong>
            {result.improvedAnswer}
          </p>
        </div>
      )}
    </div>
  )
}
