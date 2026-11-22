import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type {
  ActivityPayload,
  AppLanguage,
  CheckGrammarResponse
} from '../../../../shared/ipc-contracts'
import { getTranslations } from '../../i18n/translations'

type MicroWritingPayload = Extract<ActivityPayload, { type: 'micro_writing' }>

interface MicroWritingStepProps {
  language: AppLanguage
  payload: MicroWritingPayload
  isSubmitting: boolean
  result: CheckGrammarResponse | null
  hasNextStep: boolean
  onSubmit: (draft: string) => void
  onNextStep: () => void
}

export function MicroWritingStep({
  language,
  payload,
  isSubmitting,
  result,
  hasNextStep,
  onSubmit,
  onNextStep
}: MicroWritingStepProps) {
  const t = getTranslations(language).tracks
  const isPt = language === 'pt-BR'
  const [draft, setDraft] = useState('')
  const [showSample, setShowSample] = useState(false)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="rounded bg-primary/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
          {t.stepLabels.micro_writing}
        </span>
        <button
          type="button"
          onClick={() => setShowSample((v) => !v)}
          className="text-[11px] font-medium text-primary hover:underline"
        >
          {showSample ? t.hideSampleAnswer : t.showSampleAnswer}
        </button>
      </div>

      <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
        <p className="text-xs text-on-surface-variant">{payload.scenario}</p>
        <p className="mt-1.5 text-sm font-semibold text-on-surface">
          {payload.taskPrompt}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {payload.targetExpressions.map((expr) => (
            <span
              key={expr}
              className="rounded bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary"
            >
              {expr}
            </span>
          ))}
        </div>

        {showSample && (
          <p className="mt-3 rounded-lg bg-surface-container p-2.5 text-xs italic text-secondary">
            {payload.sampleAnswer}
          </p>
        )}
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
              onClick={() =>
                setDraft((prev) => (prev.trim() ? `${prev.trim()} ${chip}` : `${chip} `))
              }
              className="rounded-lg border border-surface-container-high bg-surface-container-lowest px-2.5 py-1 text-xs text-on-surface-variant transition-colors hover:border-primary/50 hover:text-primary"
            >
              + {chip}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
        placeholder={
          isPt
            ? 'Escreva sua resposta em inglês aqui ou clique em um Starter Chip...'
            : 'Write your English response here or click a Starter Chip...'
        }
        className="w-full rounded-xl border border-surface-container-high bg-surface-container-lowest p-3 text-xs text-on-surface outline-none focus:border-primary"
      />

      <div className="flex justify-end">
        <button
          type="button"
          disabled={isSubmitting || !draft.trim()}
          onClick={() => onSubmit(draft.trim())}
          className="flex items-center gap-1.5 rounded-xl bg-primary-container px-4 py-2 text-xs font-semibold text-on-primary-container hover:brightness-110 disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          <span>{isSubmitting ? t.analyzing : t.checkWriting}</span>
        </button>
      </div>

      {result && (
        <div className="flex flex-col gap-2 rounded-2xl border border-secondary/30 bg-surface-container-lowest p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-secondary">
              Naturalness: {result.naturalnessScore}%
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
          <p className="rounded-lg bg-surface-container p-2.5 text-xs text-on-surface">
            {result.correctedText}
          </p>
          {result.explanations.map((exp, idx) => (
            <p key={idx} className="text-[11px] text-on-surface-variant">
              <strong className="text-primary">{exp.rule}: </strong>
              {exp.detail}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
