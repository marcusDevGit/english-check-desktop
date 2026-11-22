import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Mic,
  Play,
  Sparkles,
  Square,
  Volume2
} from 'lucide-react'
import { useState } from 'react'
import type {
  ActivityPayload,
  AnalyzePronunciationResponse,
  AppLanguage
} from '../../../../shared/ipc-contracts'
import { getTranslations } from '../../i18n/translations'

type AudioRepetitionPayload = Extract<
  ActivityPayload,
  { type: 'shadowing' | 'listening_repeat' }
>

interface AudioRepetitionStepProps {
  language: AppLanguage
  payload: AudioRepetitionPayload
  isSpeaking: boolean
  isRecording: boolean
  isPlayingRecording: boolean
  hasRecording: boolean
  isSubmitting: boolean
  result: AnalyzePronunciationResponse | null
  hasNextStep: boolean
  onSpeakToggle: (sentence: string) => void
  onToggleRecording: () => void
  onTogglePlayback: () => void
  onAnalyze: () => void
  onNextStep: () => void
}

export function AudioRepetitionStep({
  language,
  payload,
  isSpeaking,
  isRecording,
  isPlayingRecording,
  hasRecording,
  isSubmitting,
  result,
  hasNextStep,
  onSpeakToggle,
  onToggleRecording,
  onTogglePlayback,
  onAnalyze,
  onNextStep
}: AudioRepetitionStepProps) {
  const t = getTranslations(language).tracks
  const isPt = language === 'pt-BR'
  const [revealText, setRevealText] = useState(payload.type === 'shadowing')

  const showSentence = payload.type === 'shadowing' || revealText

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="rounded bg-primary/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
          {t.stepLabels[payload.type]}
        </span>

        {payload.type === 'listening_repeat' && (
          <button
            type="button"
            onClick={() => setRevealText((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-1 text-[11px] text-on-surface-variant hover:bg-surface-container-high"
          >
            {revealText ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>{isPt ? 'Ocultar texto' : 'Hide text'}</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>{isPt ? 'Revelar texto' : 'Reveal text'}</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
        {showSentence ? (
          <>
            <p className="text-base font-semibold text-on-surface">
              “{payload.sentence}”
            </p>
            <p className="mt-1 font-mono text-xs text-outline">{payload.ipa}</p>
          </>
        ) : (
          <p className="text-xs italic text-on-surface-variant">
            {isPt
              ? 'Ouça o áudio nativo primeiro, repita em voz alta e revele o texto se precisar confirmar alguma palavra.'
              : 'Listen to native audio first, repeat aloud, and reveal the text only if you need to check a word.'}
          </p>
        )}

        <p className="mt-2.5 text-xs text-on-surface-variant">
          {payload.type === 'shadowing' ? payload.ptTranslation : payload.contextHint}
        </p>

        <div className="mt-3 rounded-xl bg-surface-container px-3 py-2 text-[11px] text-on-surface-variant">
          <span className="font-semibold text-primary">
            {isPt ? 'Dica: ' : 'Coach Tip: '}
          </span>
          {payload.type === 'shadowing'
            ? payload.phoneticsTip
            : payload.connectedSpeechNote}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => onSpeakToggle(payload.sentence)}
          className="flex items-center gap-1.5 rounded-xl bg-surface-container px-3.5 py-2 text-xs font-medium text-on-surface hover:bg-surface-container-high"
        >
          <Volume2 className="h-4 w-4 text-primary" />
          <span>{isSpeaking ? (isPt ? 'Parar Áudio' : 'Stop Audio') : t.listenNative}</span>
        </button>

        <button
          type="button"
          onClick={onToggleRecording}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            isRecording
              ? 'animate-pulse bg-error text-on-error'
              : 'bg-primary text-on-primary'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="h-3.5 w-3.5" />
              <span>{isPt ? 'Parar Gravação' : 'Stop Recording'}</span>
            </>
          ) : (
            <>
              <Mic className="h-3.5 w-3.5" />
              <span>{isPt ? 'Gravar Voz' : 'Record Voice'}</span>
            </>
          )}
        </button>

        {hasRecording && !isRecording && (
          <>
            <button
              type="button"
              onClick={onTogglePlayback}
              className="flex items-center gap-1.5 rounded-xl bg-surface-container px-3 py-2 text-xs text-on-surface-variant hover:bg-surface-container-high"
            >
              <Play className="h-3.5 w-3.5" />
              <span>
                {isPlayingRecording
                  ? isPt
                    ? 'Parar'
                    : 'Stop'
                  : isPt
                    ? 'Ouvir Minha Voz'
                    : 'Play Voice'}
              </span>
            </button>

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
          </>
        )}
      </div>

      {result && (
        <div className="rounded-2xl border border-secondary/30 bg-surface-container-lowest p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-secondary">
              {result.overallScore}% • {result.fluencyNote}
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
          <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
            {result.articulatoryTip}
          </p>
        </div>
      )}
    </div>
  )
}
