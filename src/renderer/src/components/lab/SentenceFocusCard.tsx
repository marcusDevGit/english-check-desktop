import { Mic, Play, RotateCcw, Sparkles, Square, Volume2 } from 'lucide-react'
import type { Accent, AppLanguage, PracticeItem } from '../../../../shared/ipc-contracts'
import { getTranslations } from '../../i18n/translations'
import { WaveformCanvas } from '../audio/WaveformCanvas'

interface SentenceFocusCardProps {
  language: AppLanguage
  item: PracticeItem | null
  accent: Accent
  playbackRate: 1.0 | 0.8
  onChangePlaybackRate: (rate: 1.0 | 0.8) => void
  isSpeaking: boolean
  onToggleSpeak: () => void
  activeVoiceLabel: string | null
  isRecording: boolean
  isPlayingRecording: boolean
  liveSamples: number[]
  recordedPeaks: number[]
  durationMs: number
  hasAudioBytes: boolean
  mimeType: string | null
  isAnalyzing: boolean
  onToggleRecording: () => void
  onTogglePlayRecording: () => void
  onRetry: () => void
  onAnalyze: () => void
}

function formatDuration(ms: number): string {
  const totalSeconds = ms / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = (totalSeconds % 60).toFixed(2).padStart(5, '0')
  return `${String(minutes).padStart(2, '0')}:${seconds}`
}

export function SentenceFocusCard({
  language,
  item,
  playbackRate,
  onChangePlaybackRate,
  isSpeaking,
  onToggleSpeak,
  activeVoiceLabel,
  isRecording,
  isPlayingRecording,
  liveSamples,
  recordedPeaks,
  durationMs,
  hasAudioBytes,
  mimeType,
  isAnalyzing,
  onToggleRecording,
  onTogglePlayRecording,
  onRetry,
  onAnalyze
}: SentenceFocusCardProps) {
  const t = getTranslations(language).lab

  return (
    <section className="relative z-10 flex w-full flex-col gap-2.5 overflow-hidden rounded-2xl border border-surface-container-high bg-surface-container-low p-3.5 shadow-xl">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

      {/* Meta Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="flex h-4 w-4 items-center justify-center rounded bg-primary-container text-on-primary-container">
            <Volume2 className="h-2.5 w-2.5" />
          </span>
          <span className="font-mono text-[10px] font-semibold tracking-wider text-primary uppercase">
            Drill #{item?.id ?? '—'}
          </span>
          <span className="text-outline">•</span>
          <span className="font-medium tracking-wide text-on-surface-variant">
            {item?.category ?? '...'}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] text-outline">
          <span className="rounded bg-surface-container px-2 py-0.5">
            {t.attempts}: {item?.attemptsCount ?? 0}
          </span>
          <span className="rounded bg-surface-container px-2 py-0.5">
            {t.last}:{' '}
            {item?.lastScore !== null && item?.lastScore !== undefined
              ? `${item.lastScore}%`
              : '—'}
          </span>
        </div>
      </div>

      {/* Sentence & IPA */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-lg leading-snug font-semibold tracking-tight text-on-surface lg:text-xl">
          {item ? `“${item.sentence}”` : t.loadingDrills}
        </h1>

        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-container-lowest/80 px-2.5 py-1.5 font-mono text-xs text-on-surface-variant shadow-inner">
          <span className="text-[11px] text-outline select-none">IPA:</span>
          <span className="text-primary/95">{item?.ipa ?? '/.../'}</span>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              disabled={!item}
              onClick={onToggleSpeak}
              className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-1 font-sans text-[11px] font-medium text-primary transition-colors hover:bg-surface-container-high disabled:opacity-40"
            >
              {isSpeaking ? (
                <Square className="h-3 w-3 fill-current" />
              ) : (
                <Play className="h-3 w-3 fill-current" />
              )}
              <span>{isSpeaking ? t.stopNative : t.listenNative}</span>
            </button>

            <div className="flex rounded bg-surface-container-high p-0.5 font-mono text-[10px]">
              {([1.0, 0.8] as const).map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => onChangePlaybackRate(rate)}
                  className={
                    playbackRate === rate
                      ? 'rounded bg-surface-container px-1.5 py-0.5 font-bold text-primary'
                      : 'rounded px-1.5 py-0.5 text-outline hover:text-on-surface'
                  }
                >
                  {rate.toFixed(1)}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Waveform Stage */}
      <div className="relative flex w-full flex-col gap-1 overflow-hidden rounded-xl bg-surface-container-lowest px-3 py-2 shadow-inner">
        <div className="flex items-center justify-between font-mono text-[10px] text-outline">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-secondary">
              <span
                className={`h-2 w-2 rounded-full ${
                  isRecording ? 'animate-pulse bg-error' : 'bg-secondary'
                }`}
              />
              {isRecording
                ? t.recordingLive
                : hasAudioBytes
                  ? `${t.captured} (${mimeType ?? 'audio/webm'})`
                  : t.micReady}
            </span>
            {activeVoiceLabel && (
              <span className="hidden text-[10px] text-outline/80 md:inline">
                TTS: {activeVoiceLabel}
              </span>
            )}
          </div>

          <span className="font-semibold text-on-surface">
            {formatDuration(durationMs)}
          </span>
        </div>

        <WaveformCanvas
          isRecording={isRecording}
          liveSamples={liveSamples}
          recordedPeaks={recordedPeaks}
          standbyLabel={t.standbyHint}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <div className="order-2 flex items-center gap-2 sm:order-1">
          <button
            type="button"
            disabled={!hasAudioBytes || isRecording}
            onClick={onTogglePlayRecording}
            className="flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 text-xs font-medium text-on-surface shadow-sm transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPlayingRecording ? (
              <Square className="h-3.5 w-3.5 text-secondary" />
            ) : (
              <Play className="h-3.5 w-3.5 text-secondary" />
            )}
            <span>{isPlayingRecording ? t.stopPlayback : t.playRecording}</span>
          </button>

          <button
            type="button"
            disabled={!hasAudioBytes || isRecording}
            onClick={onRetry}
            title="R"
            className="flex items-center gap-1 rounded-lg bg-surface-container px-2.5 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5 text-outline" />
            <span>{t.retry}</span>
            <kbd className="ml-0.5 font-mono text-[9px] opacity-60">R</kbd>
          </button>
        </div>

        <div className="order-1 flex flex-col items-center gap-1 sm:order-2">
          <div className="group relative">
            <div
              className={`absolute -inset-1.5 rounded-full blur-md transition duration-300 ${
                isRecording
                  ? 'animate-pulse bg-error/45'
                  : 'bg-secondary/30 group-hover:bg-secondary/50'
              }`}
            />
            <button
              type="button"
              onClick={onToggleRecording}
              aria-label={isRecording ? t.toStop : t.toRecord}
              className={`relative flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 ${
                isRecording
                  ? 'bg-error-container text-on-error-container'
                  : 'bg-secondary-container text-on-secondary-container'
              }`}
            >
              {isRecording ? (
                <Square className="h-4 w-4 fill-current" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-outline">
            <span>{t.press}</span>
            <kbd className="rounded bg-surface-container-high px-1.5 py-0.5 font-mono text-[9px] text-on-surface">
              {t.spacebar}
            </kbd>
            <span>{isRecording ? t.toStop : t.toRecord}</span>
          </div>
        </div>

        <div className="order-3 flex items-center">
          <button
            type="button"
            disabled={!hasAudioBytes || isRecording || isAnalyzing}
            onClick={onAnalyze}
            className="flex items-center gap-1.5 rounded-lg bg-primary-container px-3.5 py-1.5 text-xs font-semibold text-on-primary-container shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isAnalyzing ? t.analyzing : t.analyze}</span>
          </button>
        </div>
      </div>
    </section>
  )
}
