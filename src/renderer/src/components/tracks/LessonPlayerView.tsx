import { useEffect, useState } from 'react'
import type {
  AnalyzePronunciationResponse,
  AppLanguage,
  CheckGrammarResponse,
  EvaluateOpenQaResponse,
  LearningTrackProgress,
  LessonActivityRecord,
  LessonSummary
} from '../../../../shared/ipc-contracts'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis'
import { AudioRepetitionStep } from './AudioRepetitionStep'
import { CheatSheetStep } from './CheatSheetStep'
import { LessonHeaderStepper } from './LessonHeaderStepper'
import { MicroWritingStep } from './MicroWritingStep'
import { OpenQaStep } from './OpenQaStep'
import { RoleplayStep, type RoleplayChatItem } from './RoleplayStep'

interface LessonPlayerViewProps {
  language: AppLanguage
  track: LearningTrackProgress
  lesson: LessonSummary
  onBack: () => void
  onLessonUpdated: () => void
  onSessionRecorded?: () => void
}

export function LessonPlayerView({
  language,
  track,
  lesson,
  onBack,
  onLessonUpdated,
  onSessionRecorded
}: LessonPlayerViewProps) {
  const isPt = language === 'pt-BR'

  const [viewPhase, setViewPhase] = useState<'cheat_sheet' | 'activity'>('cheat_sheet')
  const [stepIndex, setStepIndex] = useState(0)
  const [activities, setActivities] = useState<LessonActivityRecord[]>(lesson.activities)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [earnedXpNotice, setEarnedXpNotice] = useState<number | null>(null)

  const [speechResult, setSpeechResult] = useState<AnalyzePronunciationResponse | null>(null)
  const [openQaResult, setOpenQaResult] = useState<EvaluateOpenQaResponse | null>(null)
  const [writingResult, setWritingResult] = useState<CheckGrammarResponse | null>(null)
  const [roleplayHistory, setRoleplayHistory] = useState<RoleplayChatItem[]>([])
  const [achievedObjectives, setAchievedObjectives] = useState<string[]>([])
  const [latestRoleplayScore, setLatestRoleplayScore] = useState<number>(80)

  const recorder = useAudioRecorder(language)
  const { clearRecording } = recorder
  const tts = useSpeechSynthesis('US', language)
  const { stopSpeaking } = tts

  const activeActivity = activities[stepIndex] ?? null

  useEffect(() => {
    setActivities(lesson.activities)
    setViewPhase('cheat_sheet')
    setStepIndex(0)
    setEarnedXpNotice(null)
  }, [lesson.id, lesson.activities])

  useEffect(() => {
    clearRecording()
    stopSpeaking()
    setErrorMsg(null)
    setSpeechResult(null)
    setOpenQaResult(null)
    setWritingResult(null)

    if (activeActivity?.payload.type === 'roleplay') {
      setRoleplayHistory([
        { role: 'assistant', content: activeActivity.payload.openingLine }
      ])
      setAchievedObjectives([])
      setLatestRoleplayScore(activeActivity.score ?? 80)
    }
  }, [activeActivity?.id, activeActivity?.payload, activeActivity?.score, clearRecording, stopSpeaking])

  const markActivityCompleted = async (
    activityId: number,
    score: number
  ): Promise<void> => {
    const completion = await window.englishChecks.completeLessonActivity({
      activityId,
      score
    })
    if (completion.ok) {
      setActivities((prev) =>
        prev.map((item) => (item.id === activityId ? completion.data.activity : item))
      )
      if (completion.data.xpEarned > 0) {
        setEarnedXpNotice(completion.data.xpEarned)
      }
      onLessonUpdated()
      onSessionRecorded?.()
    }
  }

  const runWithSubmissionGuard = async (task: () => Promise<void>): Promise<void> => {
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      await task()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAnalyzeAudioStep = (): void => {
    if (!activeActivity || !recorder.audioBytes || !recorder.mimeType) return
    const payload = activeActivity.payload
    if (payload.type !== 'shadowing' && payload.type !== 'listening_repeat') return

    void runWithSubmissionGuard(async () => {
      const res = await window.englishChecks.analyzePronunciation({
        audio: recorder.audioBytes!,
        mimeType: recorder.mimeType!,
        targetText: payload.sentence,
        accent: 'US',
        durationSeconds: Math.max(1, Math.round(recorder.durationMs / 1000))
      })
      if (!res.ok) {
        setErrorMsg(res.error)
        return
      }
      setSpeechResult(res.data)
      await markActivityCompleted(activeActivity.id, res.data.overallScore)
    })
  }

  const handleAnalyzeOpenQa = (): void => {
    if (!activeActivity || !recorder.audioBytes || !recorder.mimeType) return
    const payload = activeActivity.payload
    if (payload.type !== 'open_qa') return

    void runWithSubmissionGuard(async () => {
      const res = await window.englishChecks.evaluateOpenQa({
        audio: recorder.audioBytes!,
        mimeType: recorder.mimeType!,
        question: payload.question,
        expectedTopics: payload.expectedTopics,
        level: track.level,
        durationSeconds: Math.max(1, Math.round(recorder.durationMs / 1000))
      })
      if (!res.ok) {
        setErrorMsg(res.error)
        return
      }
      setOpenQaResult(res.data)
      await markActivityCompleted(activeActivity.id, res.data.score)
    })
  }

  const handleCheckMicroWriting = (draft: string): void => {
    if (!activeActivity || activeActivity.payload.type !== 'micro_writing') return

    void runWithSubmissionGuard(async () => {
      const res = await window.englishChecks.checkGrammar({
        text: draft,
        context: 'work_tech'
      })
      if (!res.ok) {
        setErrorMsg(res.error)
        return
      }
      setWritingResult(res.data)
      await markActivityCompleted(activeActivity.id, res.data.naturalnessScore)
    })
  }

  const handleRoleplayTurn = (userMessage?: string): void => {
    if (!activeActivity || activeActivity.payload.type !== 'roleplay') return
    const payload = activeActivity.payload
    const isVoice = userMessage === undefined
    if (isVoice && (!recorder.audioBytes || !recorder.mimeType)) return

    void runWithSubmissionGuard(async () => {
      const res = await window.englishChecks.evaluateRoleplayTurn({
        persona: payload.persona,
        scenario: payload.scenario,
        objectives: payload.objectives,
        history: roleplayHistory.map(({ role, content }) => ({ role, content })),
        userMessage,
        audio: isVoice ? recorder.audioBytes ?? undefined : undefined,
        mimeType: isVoice ? recorder.mimeType ?? undefined : undefined
      })
      if (!res.ok) {
        setErrorMsg(res.error)
        return
      }
      setRoleplayHistory((prev) => [
        ...prev,
        { role: 'user', content: res.data.userTranscript },
        {
          role: 'assistant',
          content: res.data.assistantReply,
          feedback: res.data.turnFeedback
        }
      ])
      setAchievedObjectives(res.data.achievedObjectives)
      setLatestRoleplayScore(Math.round(res.data.suggestedScore))
      if (isVoice) clearRecording()
    })
  }

  const handleSpeakToggle = (text: string): void => {
    if (tts.isSpeaking) {
      tts.stopSpeaking()
    } else {
      tts.speak(text, 'US', 0.95)
    }
  }

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden p-3">
      <LessonHeaderStepper
        language={language}
        level={track.level}
        lessonTitle={isPt ? lesson.titlePt : lesson.titleEn}
        xpReward={lesson.xpReward}
        activities={activities}
        viewPhase={viewPhase}
        stepIndex={stepIndex}
        earnedXpNotice={earnedXpNotice}
        onBack={onBack}
        onSelectCheatSheet={() => setViewPhase('cheat_sheet')}
        onSelectStep={(idx) => {
          setViewPhase('activity')
          setStepIndex(idx)
        }}
      />

      {errorMsg && (
        <div className="rounded-xl border border-error/40 bg-error-container/20 px-3.5 py-2 text-xs text-error">
          {errorMsg}
        </div>
      )}

      <section className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-surface-container-high bg-surface-container-low p-4 shadow-xl">
        {viewPhase === 'cheat_sheet' && (
          <CheatSheetStep
            language={language}
            items={lesson.cheatSheet}
            onSpeak={(text) => tts.speak(text, 'US', 0.95)}
            onStartLesson={() => {
              setViewPhase('activity')
              setStepIndex(0)
            }}
          />
        )}

        {viewPhase === 'activity' &&
          activeActivity &&
          (activeActivity.payload.type === 'shadowing' ||
            activeActivity.payload.type === 'listening_repeat') && (
            <AudioRepetitionStep
              key={activeActivity.id}
              language={language}
              payload={activeActivity.payload}
              isSpeaking={tts.isSpeaking}
              isRecording={recorder.isRecording}
              isPlayingRecording={recorder.isPlayingRecording}
              hasRecording={Boolean(recorder.audioBytes)}
              isSubmitting={isSubmitting}
              result={speechResult}
              hasNextStep={stepIndex < activities.length - 1}
              onSpeakToggle={handleSpeakToggle}
              onToggleRecording={() => void recorder.toggleRecording()}
              onTogglePlayback={() =>
                recorder.isPlayingRecording
                  ? recorder.stopPlayback()
                  : recorder.playRecording()
              }
              onAnalyze={handleAnalyzeAudioStep}
              onNextStep={() => setStepIndex((i) => i + 1)}
            />
          )}

        {viewPhase === 'activity' &&
          activeActivity &&
          activeActivity.payload.type === 'open_qa' && (
            <OpenQaStep
              key={activeActivity.id}
              language={language}
              payload={activeActivity.payload}
              isRecording={recorder.isRecording}
              hasRecording={Boolean(recorder.audioBytes)}
              isSubmitting={isSubmitting}
              result={openQaResult}
              hasNextStep={stepIndex < activities.length - 1}
              onSpeakChip={(chip) => tts.speak(chip, 'US', 0.95)}
              onToggleRecording={() => void recorder.toggleRecording()}
              onAnalyze={handleAnalyzeOpenQa}
              onNextStep={() => setStepIndex((i) => i + 1)}
            />
          )}

        {viewPhase === 'activity' &&
          activeActivity &&
          activeActivity.payload.type === 'micro_writing' && (
            <MicroWritingStep
              key={activeActivity.id}
              language={language}
              payload={activeActivity.payload}
              isSubmitting={isSubmitting}
              result={writingResult}
              hasNextStep={stepIndex < activities.length - 1}
              onSubmit={handleCheckMicroWriting}
              onNextStep={() => setStepIndex((i) => i + 1)}
            />
          )}

        {viewPhase === 'activity' &&
          activeActivity &&
          activeActivity.payload.type === 'roleplay' && (
            <RoleplayStep
              key={activeActivity.id}
              language={language}
              payload={activeActivity.payload}
              history={roleplayHistory}
              achievedObjectives={achievedObjectives}
              isRecording={recorder.isRecording}
              hasRecording={Boolean(recorder.audioBytes)}
              isSubmitting={isSubmitting}
              onSpeakLine={(text) => tts.speak(text, 'US', 0.95)}
              onToggleRecording={() => void recorder.toggleRecording()}
              onSendTextTurn={(msg) => handleRoleplayTurn(msg)}
              onSendVoiceTurn={() => handleRoleplayTurn(undefined)}
              onFinishRoleplay={() =>
                void runWithSubmissionGuard(() =>
                  markActivityCompleted(activeActivity.id, latestRoleplayScore)
                )
              }
            />
          )}
      </section>
    </div>
  )
}
