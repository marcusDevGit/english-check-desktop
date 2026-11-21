import { Check, Copy, Mic, Sparkles, Square, Volume2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type {
  Accent,
  AnalyzePronunciationResponse,
  AppLanguage,
  CheckGrammarResponse
} from '../../../shared/ipc-contracts'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { getTranslations } from '../i18n/translations'

type QuickMode = 'pronunciation' | 'grammar'

interface QuickCheckOverlayViewProps {
  language: AppLanguage
}

export function QuickCheckOverlayView({ language }: QuickCheckOverlayViewProps) {
  const t = getTranslations(language).quickCheck

  const [mode, setMode] = useState<QuickMode>('pronunciation')
  const [accent, setAccent] = useState<Accent>('US')
  const [phrase, setPhrase] = useState('Schedule the architecture review')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [pronunciationResult, setPronunciationResult] =
    useState<AnalyzePronunciationResponse | null>(null)
  const [grammarResult, setGrammarResult] = useState<CheckGrammarResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const recorder = useAudioRecorder(language)
  const tts = useSpeechSynthesis(accent, language)

  useEffect(() => {
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
    return () => {
      document.documentElement.style.background = ''
      document.body.style.background = ''
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        tts.stopSpeaking()
        if (recorder.isRecording) {
          recorder.stopRecording()
        }
        void window.englishChecks.hideQuickCheck()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [recorder, tts])

  const handleAnalyzePronunciation = useCallback(async () => {
    if (!phrase.trim() || !recorder.audioBytes || !recorder.mimeType || isAnalyzing) return

    setIsAnalyzing(true)
    setErrorMessage(null)
    const res = await window.englishChecks.analyzePronunciation({
      audio: recorder.audioBytes,
      mimeType: recorder.mimeType,
      targetText: phrase.trim(),
      accent,
      durationSeconds: Math.max(1, Math.round(recorder.durationMs / 1000))
    })
    setIsAnalyzing(false)

    if (res.ok) {
      setPronunciationResult(res.data)
    } else {
      setErrorMessage(res.error)
    }
  }, [accent, isAnalyzing, phrase, recorder.audioBytes, recorder.durationMs, recorder.mimeType])

  const handleCheckGrammar = useCallback(async () => {
    if (!phrase.trim() || isAnalyzing) return

    setIsAnalyzing(true)
    setErrorMessage(null)
    const res = await window.englishChecks.checkGrammar({
      text: phrase.trim(),
      context: 'work_tech'
    })
    setIsAnalyzing(false)

    if (res.ok) {
      setGrammarResult(res.data)
    } else {
      setErrorMessage(res.error)
    }
  }, [isAnalyzing, phrase])

  const copyCorrected = (text: string): void => {
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-transparent p-1.5 select-none">
      <div className="flex h-full w-full flex-col justify-between gap-2 rounded-2xl border border-primary/40 bg-surface-container-low/95 p-3 shadow-2xl backdrop-blur-xl">
        {/* Top Compact Header (Draggable) */}
        <header className="app-drag flex items-center justify-between gap-2">
          <div className="app-no-drag flex items-center gap-1 rounded-lg bg-surface-container-lowest p-0.5">
            <button
              type="button"
              onClick={() => {
                setMode('pronunciation')
                setErrorMessage(null)
              }}
              className={
                mode === 'pronunciation'
                  ? 'rounded-md bg-primary-container px-2.5 py-1 text-[11px] font-semibold text-on-primary-container'
                  : 'rounded-md px-2.5 py-1 text-[11px] text-on-surface-variant hover:text-on-surface'
              }
            >
              {t.quickPronunciation}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('grammar')
                setErrorMessage(null)
              }}
              className={
                mode === 'grammar'
                  ? 'rounded-md bg-primary-container px-2.5 py-1 text-[11px] font-semibold text-on-primary-container'
                  : 'rounded-md px-2.5 py-1 text-[11px] text-on-surface-variant hover:text-on-surface'
              }
            >
              {t.quickGrammar}
            </button>
          </div>

          <div className="app-no-drag flex items-center gap-1.5">
            {mode === 'pronunciation' && (
              <button
                type="button"
                onClick={() => setAccent((prev) => (prev === 'US' ? 'UK' : 'US'))}
                className="rounded bg-surface-container px-2 py-0.5 font-mono text-[10px] font-semibold text-primary hover:bg-surface-container-high"
                title={t.toggleAccent}
              >
                {accent}
              </button>
            )}
            <button
              type="button"
              onClick={() => void window.englishChecks.hideQuickCheck()}
              className="flex items-center gap-1 rounded-md bg-surface-container px-1.5 py-0.5 text-[10px] text-outline hover:bg-surface-container-high hover:text-on-surface"
              title={t.closeEsc}
            >
              <kbd className="font-mono text-[9px]">Esc</kbd>
              <X className="h-3 w-3" />
            </button>
          </div>
        </header>

        {/* Input Row */}
        <div className="flex items-center gap-2 rounded-xl border border-surface-container-high bg-surface-container-lowest px-3 py-2">
          <input
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && mode === 'grammar') {
                e.preventDefault()
                void handleCheckGrammar()
              }
            }}
            placeholder={
              mode === 'pronunciation' ? t.placeholderPron : t.placeholderGrammar
            }
            className="min-w-0 flex-1 bg-transparent text-xs text-on-surface placeholder:text-outline/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (!phrase.trim()) return
              if (tts.isSpeaking) {
                tts.stopSpeaking()
              } else {
                tts.speak(phrase.trim(), accent, 1.0)
              }
            }}
            title={t.listenNative}
            className="shrink-0 rounded-lg bg-surface-container p-1.5 text-primary transition-colors hover:bg-surface-container-high"
          >
            <Volume2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-2">
          {mode === 'pronunciation' ? (
            <>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => void recorder.toggleRecording()}
                  className={`flex h-8 w-8 items-center justify-center rounded-full shadow transition-transform active:scale-95 ${
                    recorder.isRecording
                      ? 'animate-pulse bg-error-container text-on-error-container'
                      : 'bg-secondary-container text-on-secondary-container'
                  }`}
                >
                  {recorder.isRecording ? (
                    <Square className="h-3.5 w-3.5 fill-current" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>

                <div className="flex h-5 items-center gap-0.5">
                  {(recorder.liveSamples.length > 0
                    ? recorder.liveSamples.slice(-16)
                    : Array.from({ length: 16 }, () => 0.15)
                  ).map((sample, idx) => (
                    <span
                      key={idx}
                      style={{ height: `${Math.max(20, Math.round(sample * 100))}%` }}
                      className={`w-1 rounded-full transition-all ${
                        recorder.isRecording ? 'bg-primary' : 'bg-surface-variant'
                      }`}
                    />
                  ))}
                </div>

                <span className="font-mono text-[10px] text-outline">
                  {recorder.isRecording
                    ? t.listening
                    : recorder.audioBytes
                      ? t.audioReady
                      : t.clickMic}
                </span>
              </div>

              <button
                type="button"
                disabled={!recorder.audioBytes || recorder.isRecording || isAnalyzing}
                onClick={() => void handleAnalyzePronunciation()}
                className="flex items-center gap-1.5 rounded-lg bg-primary-container px-3 py-1.5 text-[11px] font-semibold text-on-primary-container transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isAnalyzing ? t.analyzing : t.analyze}</span>
              </button>
            </>
          ) : (
            <>
              <span className="font-mono text-[10px] text-outline">
                {t.pressEnter}{' '}
                <kbd className="rounded bg-surface-container-high px-1 py-0.5 text-on-surface">
                  {t.enterKey}
                </kbd>{' '}
                {t.toEvaluate}
              </span>
              <button
                type="button"
                disabled={!phrase.trim() || isAnalyzing}
                onClick={() => void handleCheckGrammar()}
                className="flex items-center gap-1.5 rounded-lg bg-primary-container px-3 py-1.5 text-[11px] font-semibold text-on-primary-container transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isAnalyzing ? t.checking : t.checkGrammar}</span>
              </button>
            </>
          )}
        </div>

        {/* Instant Result Drawer */}
        <div className="min-h-[88px] flex-1 overflow-y-auto rounded-xl border border-surface-container-high bg-surface-container-lowest p-2.5">
          {errorMessage || recorder.error ? (
            <p className="text-[11px] leading-relaxed text-error">
              {errorMessage ?? recorder.error}
            </p>
          ) : mode === 'pronunciation' ? (
            pronunciationResult ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-secondary-container/25 px-1.5 py-0.5 font-mono text-[10px] font-bold text-secondary">
                    {pronunciationResult.overallScore}%
                  </span>
                  {pronunciationResult.words.map((w, idx) => (
                    <span
                      key={`${w.word}-${idx}`}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        w.status === 'accurate'
                          ? 'bg-surface-container text-secondary'
                          : w.status === 'stress_issue'
                            ? 'bg-tertiary-container/20 text-tertiary'
                            : 'bg-error-container/25 text-error'
                      }`}
                    >
                      {w.word}
                    </span>
                  ))}
                </div>
                <p className="line-clamp-2 text-[11px] leading-snug text-on-surface-variant">
                  {pronunciationResult.articulatoryTip}
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-outline">{t.emptyPron}</p>
            )
          ) : grammarResult ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-secondary-container/25 px-1.5 py-0.5 font-mono text-[10px] font-bold text-secondary">
                  {grammarResult.naturalnessScore}% {t.natural}
                </span>
                <button
                  type="button"
                  onClick={() => copyCorrected(grammarResult.correctedText)}
                  className="flex items-center gap-1 rounded bg-surface-container px-1.5 py-0.5 text-[10px] text-primary hover:bg-surface-container-high"
                >
                  {copied ? <Check className="h-3 w-3 text-secondary" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? t.copied : t.copyFix}</span>
                </button>
              </div>
              <p className="text-xs font-medium text-on-surface">
                {grammarResult.correctedText}
              </p>
              {grammarResult.explanations[0] && (
                <p className="line-clamp-2 text-[10px] text-on-surface-variant">
                  {grammarResult.explanations[0].detail}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-outline">{t.emptyGrammar}</p>
          )}
        </div>
      </div>
    </div>
  )
}
