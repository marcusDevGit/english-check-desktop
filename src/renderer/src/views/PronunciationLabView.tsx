import { AlertTriangle, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  Accent,
  AnalyzePronunciationResponse,
  AppLanguage,
  EvaluateRecallResponse,
  LearningTrackProgress,
  PracticeItem
} from '../../../shared/ipc-contracts'
import { FeedbackPanel } from '../components/lab/FeedbackPanel'
import { LabToolbar } from '../components/lab/LabToolbar'
import { SentenceFocusCard } from '../components/lab/SentenceFocusCard'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { getTranslations } from '../i18n/translations'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

interface PronunciationLabViewProps {
  language: AppLanguage
  selectedTrackId?: number | null
  onSelectTrackId?: (trackId: number | null) => void
  selectedPracticeItemId?: number | null
  onSessionRecorded?: () => void
}

export function PronunciationLabView({
  language,
  selectedTrackId = null,
  onSelectTrackId,
  selectedPracticeItemId,
  onSessionRecorded
}: PronunciationLabViewProps) {
  const t = getTranslations(language).lab

  const [tracks, setTracks] = useState<LearningTrackProgress[]>([])
  const [items, setItems] = useState<PracticeItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [accent, setAccent] = useState<Accent>('US')
  const [playbackRate, setPlaybackRate] = useState<1.0 | 0.8>(1.0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isEvaluatingRecall, setIsEvaluatingRecall] = useState(false)
  const [analysisResult, setAnalysisResult] =
    useState<AnalyzePronunciationResponse | null>(null)
  const [recallResult, setRecallResult] = useState<EvaluateRecallResponse | null>(null)
  const [recallAnswer, setRecallAnswer] = useState('')
  const [isSentenceHidden, setIsSentenceHidden] = useState(false)
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null)

  const recorder = useAudioRecorder(language)
  const { toggleRecording, clearRecording } = recorder
  const tts = useSpeechSynthesis(accent, language)

  const loadPracticeItems = useCallback(async () => {
    try {
      const [itemsRes, tracksRes] = await Promise.all([
        window.englishChecks.getPracticeItems(),
        window.englishChecks.getTracks()
      ])
      if (itemsRes.ok) {
        setItems(itemsRes.data)
      }
      if (tracksRes.ok) {
        setTracks(tracksRes.data)
      }
    } catch {
      // Keep empty state gracefully if IPC fails
    }
  }, [])

  useEffect(() => {
    void loadPracticeItems()
  }, [loadPracticeItems])

  const trackScopedItems = useMemo(() => {
    if (!selectedTrackId) return items
    return items.filter((item) => item.trackId === selectedTrackId)
  }, [items, selectedTrackId])

  const categories = useMemo(() => {
    const unique = Array.from(new Set(trackScopedItems.map((item) => item.category)))
    return ['All', ...unique]
  }, [trackScopedItems])

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return trackScopedItems
    return trackScopedItems.filter((item) => item.category === selectedCategory)
  }, [selectedCategory, trackScopedItems])

  useEffect(() => {
    if (!selectedPracticeItemId || filteredItems.length === 0) return
    setSelectedCategory('All')
    const idx = trackScopedItems.findIndex((item) => item.id === selectedPracticeItemId)
    if (idx >= 0) {
      setCurrentIndex(idx)
    }
  }, [filteredItems.length, selectedPracticeItemId, trackScopedItems])

  const currentItem = filteredItems[currentIndex] ?? filteredItems[0] ?? null

  useEffect(() => {
    if (!currentItem) return
    const shouldHideByDefault =
      currentItem.activityType === 'shadowing' ||
      currentItem.activityType === 'active_recall'
    setIsSentenceHidden(shouldHideByDefault)
    setRecallAnswer('')
    setRecallResult(null)
    setAnalysisResult(null)
    setAnalysisNotice(null)
  }, [currentItem?.id])

  const resetCurrentAttempt = useCallback(() => {
    clearRecording()
    setAnalysisResult(null)
    setRecallResult(null)
    setAnalysisNotice(null)
  }, [clearRecording])

  const goToNextExercise = useCallback(() => {
    if (filteredItems.length <= 1) return
    resetCurrentAttempt()
    setCurrentIndex((prev) => (prev + 1) % filteredItems.length)
  }, [filteredItems.length, resetCurrentAttempt])

  const shuffleExercise = useCallback(() => {
    if (filteredItems.length <= 1) return
    resetCurrentAttempt()
    const nextIdx = Math.floor(Math.random() * filteredItems.length)
    setCurrentIndex(nextIdx === currentIndex ? (nextIdx + 1) % filteredItems.length : nextIdx)
  }, [currentIndex, filteredItems.length, resetCurrentAttempt])

  const handleAnalyze = useCallback(async () => {
    if (!currentItem || !recorder.audioBytes || !recorder.mimeType) return
    setIsAnalyzing(true)
    setAnalysisNotice(null)
    setRecallResult(null)

    const result = await window.englishChecks.analyzePronunciation({
      audio: recorder.audioBytes,
      mimeType: recorder.mimeType,
      targetText: currentItem.sentence,
      accent,
      practiceItemId: currentItem.id,
      durationSeconds: Math.max(1, Math.round(recorder.durationMs / 1000))
    })

    setIsAnalyzing(false)
    if (result.ok) {
      setAnalysisResult(result.data)
      setIsSentenceHidden(false)
      void loadPracticeItems()
      onSessionRecorded?.()
    } else {
      setAnalysisNotice(result.error)
    }
  }, [
    accent,
    currentItem,
    loadPracticeItems,
    onSessionRecorded,
    recorder.audioBytes,
    recorder.durationMs,
    recorder.mimeType
  ])

  const handleEvaluateRecall = useCallback(async () => {
    if (!currentItem || !currentItem.promptPt || !recallAnswer.trim() || isEvaluatingRecall) {
      return
    }
    setIsEvaluatingRecall(true)
    setAnalysisNotice(null)
    setAnalysisResult(null)

    const result = await window.englishChecks.evaluateRecall({
      promptPt: currentItem.promptPt,
      expectedEnglish: currentItem.sentence,
      userAnswer: recallAnswer.trim(),
      practiceItemId: currentItem.id
    })

    setIsEvaluatingRecall(false)
    if (result.ok) {
      setRecallResult(result.data)
      setIsSentenceHidden(false)
      void loadPracticeItems()
      onSessionRecorded?.()
    } else {
      setAnalysisNotice(result.error)
    }
  }, [currentItem, isEvaluatingRecall, loadPracticeItems, onSessionRecorded, recallAnswer])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (isEditableTarget(event.target)) return

      if (event.code === 'Space') {
        event.preventDefault()
        if (document.activeElement instanceof HTMLButtonElement) {
          document.activeElement.blur()
        }
        void toggleRecording()
        return
      }

      if (event.ctrlKey && event.key.toLowerCase() === 'r') {
        event.preventDefault()
        shuffleExercise()
        return
      }

      if (!event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'r') {
        event.preventDefault()
        resetCurrentAttempt()
        return
      }

      if (event.key === 'Enter' && !(document.activeElement instanceof HTMLButtonElement)) {
        event.preventDefault()
        goToNextExercise()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNextExercise, resetCurrentAttempt, shuffleExercise, toggleRecording])

  const sentenceWords = useMemo(() => {
    if (!currentItem) return []
    return currentItem.sentence.split(/\s+/).filter(Boolean)
  }, [currentItem])

  return (
    <div className="relative flex min-h-full w-full flex-col justify-between gap-2.5 overflow-x-hidden p-3">
      <div className="pointer-events-none absolute -top-32 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-32 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />

      <LabToolbar
        language={language}
        devices={recorder.devices}
        selectedDeviceId={recorder.selectedDeviceId}
        onSelectDevice={recorder.setSelectedDeviceId}
        onRefreshDevices={() => void recorder.refreshDevices()}
        isRecording={recorder.isRecording}
        inputLevel={recorder.inputLevel}
        accent={accent}
        onSelectAccent={setAccent}
        tracks={tracks}
        selectedTrackId={selectedTrackId}
        onSelectTrack={(nextTrackId) => {
          onSelectTrackId?.(nextTrackId)
          setSelectedCategory('All')
          setCurrentIndex(0)
          resetCurrentAttempt()
        }}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(category) => {
          setSelectedCategory(category)
          setCurrentIndex(0)
          resetCurrentAttempt()
        }}
        onShuffle={shuffleExercise}
        onNext={goToNextExercise}
      />

      {(recorder.error || tts.voiceWarning || analysisNotice) && (
        <div className="relative z-10 flex flex-col gap-1.5">
          {recorder.error && (
            <div className="flex items-center gap-2 rounded-xl border border-error/30 bg-error-container/25 px-3 py-2 text-[11px] text-error">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{recorder.error}</span>
            </div>
          )}
          {tts.voiceWarning && (
            <div className="flex items-center gap-2 rounded-xl border border-tertiary/30 bg-tertiary-container/20 px-3 py-2 text-[11px] text-tertiary">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{tts.voiceWarning}</span>
            </div>
          )}
          {analysisNotice && (
            <div className="flex items-center gap-2 rounded-xl border border-error/30 bg-error-container/20 px-3 py-2 text-[11px] text-error">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>{analysisNotice}</span>
            </div>
          )}
        </div>
      )}

      <SentenceFocusCard
        language={language}
        item={currentItem}
        accent={accent}
        playbackRate={playbackRate}
        onChangePlaybackRate={setPlaybackRate}
        isSpeaking={tts.isSpeaking}
        onToggleSpeak={() => {
          if (!currentItem) return
          if (tts.isSpeaking) {
            tts.stopSpeaking()
          } else {
            tts.speak(currentItem.sentence, accent, playbackRate)
          }
        }}
        activeVoiceLabel={tts.activeVoiceLabel}
        isSentenceHidden={isSentenceHidden}
        onToggleHideSentence={() => setIsSentenceHidden((prev) => !prev)}
        recallAnswer={recallAnswer}
        onChangeRecallAnswer={setRecallAnswer}
        isEvaluatingRecall={isEvaluatingRecall}
        onEvaluateRecall={() => void handleEvaluateRecall()}
        isRecording={recorder.isRecording}
        isPlayingRecording={recorder.isPlayingRecording}
        liveSamples={recorder.liveSamples}
        recordedPeaks={recorder.recordedPeaks}
        durationMs={recorder.durationMs}
        hasAudioBytes={Boolean(recorder.audioBytes)}
        mimeType={recorder.mimeType}
        isAnalyzing={isAnalyzing}
        onToggleRecording={() => void toggleRecording()}
        onTogglePlayRecording={() => {
          if (recorder.isPlayingRecording) {
            recorder.stopPlayback()
          } else {
            recorder.playRecording()
          }
        }}
        onRetry={resetCurrentAttempt}
        onAnalyze={() => void handleAnalyze()}
      />

      <FeedbackPanel
        language={language}
        accent={accent}
        category={currentItem?.category}
        sentenceWords={sentenceWords}
        isSentenceHidden={isSentenceHidden}
        analysisResult={analysisResult}
        recallResult={recallResult}
        onNextExercise={goToNextExercise}
      />

      <footer className="relative z-10 flex w-full items-center justify-between rounded-xl border border-surface-container-high bg-surface-container-lowest px-3 py-1.5 text-[11px] text-outline shadow-md">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          <span className="font-medium text-on-surface">
            {t.drillsLoaded} ({items.length})
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span>{t.shortcutRecord}</span>
          <span>•</span>
          <span>{t.shortcutRetry}</span>
          <span>•</span>
          <span>{t.shortcutShuffle}</span>
        </div>
      </footer>
    </div>
  )
}
