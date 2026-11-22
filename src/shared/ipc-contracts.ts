import { z } from 'zod'
import { IPC_CHANNELS } from './ipc-channels'
import {
  CefrLevelSchema,
  TrackSourceTypeSchema,
  type CompleteLessonActivityRequest,
  type CompleteLessonActivityResponse,
  type GetTrackLessonsRequest,
  type LessonSummary
} from './tracks-contracts'

export { IPC_CHANNELS }
export type { IpcChannel } from './ipc-channels'
export * from './tracks-contracts'

/**
 * Standard discriminated union returned by every IPC invoke handler.
 */
export type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

/**
 * Validates raw Uint8Array payloads across Chromium/Electron contextBridge realms.
 * Avoids `instanceof ArrayBuffer`, which can fail across isolated execution contexts.
 */
export const Uint8ArraySchema = z.custom<Uint8Array>(
  (value) => value instanceof Uint8Array && value.byteLength > 0,
  { message: 'Audio payload must be a non-empty Uint8Array.' }
)

export const AccentSchema = z.enum(['US', 'UK'])
export type Accent = z.infer<typeof AccentSchema>

export const AnalyzePronunciationRequestSchema = z.object({
  audio: Uint8ArraySchema,
  mimeType: z.string().trim().min(1),
  targetText: z.string().trim().min(1).max(1000),
  accent: AccentSchema,
  practiceItemId: z.number().int().positive().optional(),
  durationSeconds: z.number().int().nonnegative().optional()
})
export type AnalyzePronunciationRequest = z.infer<
  typeof AnalyzePronunciationRequestSchema
>

export const WordEvaluationSchema = z.object({
  word: z.string(),
  status: z.enum(['accurate', 'stress_issue', 'mispronounced']),
  score: z.number().min(0).max(100),
  ipaExpected: z.string().optional(),
  note: z.string().optional()
})
export type WordEvaluation = z.infer<typeof WordEvaluationSchema>

export const FlaggedPhonemeSchema = z.object({
  word: z.string(),
  expectedSound: z.string(),
  userIssue: z.string()
})

export const AnalyzePronunciationResponseSchema = z.object({
  overallScore: z.number().min(0).max(100),
  fluencyNote: z.string(),
  words: z.array(WordEvaluationSchema),
  articulatoryTip: z.string(),
  flaggedPhonemes: z.array(FlaggedPhonemeSchema)
})
export type AnalyzePronunciationResponse = z.infer<
  typeof AnalyzePronunciationResponseSchema
>

export const WritingContextSchema = z.enum([
  'email',
  'work_tech',
  'conversation',
  'academic'
])
export type WritingContext = z.infer<typeof WritingContextSchema>

export const CheckGrammarRequestSchema = z.object({
  text: z.string().trim().min(1).max(5000),
  context: WritingContextSchema.default('work_tech')
})
export type CheckGrammarRequest = z.infer<typeof CheckGrammarRequestSchema>

export const CheckGrammarResponseSchema = z.object({
  naturalnessScore: z.number().min(0).max(100),
  correctedText: z.string(),
  naturalAlternatives: z.array(
    z.object({
      label: z.string(),
      text: z.string()
    })
  ),
  explanations: z.array(
    z.object({
      rule: z.string(),
      detail: z.string()
    })
  )
})
export type CheckGrammarResponse = z.infer<typeof CheckGrammarResponseSchema>

export const EvaluateRecallRequestSchema = z.object({
  promptPt: z.string().trim().min(1).max(1000),
  expectedEnglish: z.string().trim().min(1).max(1000),
  userAnswer: z.string().trim().min(1).max(1500),
  practiceItemId: z.number().int().positive().optional()
})
export type EvaluateRecallRequest = z.infer<typeof EvaluateRecallRequestSchema>

export const EvaluateRecallResponseSchema = z.object({
  score: z.number().min(0).max(100),
  isMeaningAccurate: z.boolean(),
  feedback: z.string(),
  betterPhrasing: z.string(),
  grammarNote: z.string()
})
export type EvaluateRecallResponse = z.infer<typeof EvaluateRecallResponseSchema>

export const EvaluateOpenQaRequestSchema = z.object({
  audio: Uint8ArraySchema,
  mimeType: z.string().trim().min(1),
  question: z.string().trim().min(1).max(600),
  expectedTopics: z.array(z.string().trim().min(1)).min(1).max(6),
  level: CefrLevelSchema,
  durationSeconds: z.number().int().nonnegative().optional()
})
export type EvaluateOpenQaRequest = z.infer<typeof EvaluateOpenQaRequestSchema>

export const EvaluateOpenQaResponseSchema = z.object({
  score: z.number().min(0).max(100),
  transcript: z.string(),
  coveredTopics: z.array(z.string()),
  missingTopics: z.array(z.string()),
  feedback: z.string(),
  improvedAnswer: z.string()
})
export type EvaluateOpenQaResponse = z.infer<typeof EvaluateOpenQaResponseSchema>

export const RoleplayMessageSchema = z.object({
  role: z.enum(['assistant', 'user']),
  content: z.string().trim().min(1).max(1500)
})
export type RoleplayMessage = z.infer<typeof RoleplayMessageSchema>

export const RoleplayTurnRequestSchema = z
  .object({
    persona: z.string().trim().min(1).max(300),
    scenario: z.string().trim().min(1).max(800),
    objectives: z.array(z.string().trim().min(1)).min(1).max(5),
    history: z.array(RoleplayMessageSchema).min(1).max(16),
    userMessage: z.string().trim().max(1500).optional(),
    audio: Uint8ArraySchema.optional(),
    mimeType: z.string().trim().min(1).optional()
  })
  .refine(
    (value) =>
      Boolean(
        (value.userMessage && value.userMessage.trim().length > 0) ||
          (value.audio && value.mimeType)
      ),
    { message: 'Provide either a text message or an audio recording.' }
  )
export type RoleplayTurnRequest = z.infer<typeof RoleplayTurnRequestSchema>

export const RoleplayTurnResponseSchema = z.object({
  userTranscript: z.string(),
  assistantReply: z.string(),
  achievedObjectives: z.array(z.string()),
  turnFeedback: z.string(),
  suggestedScore: z.number().min(0).max(100)
})
export type RoleplayTurnResponse = z.infer<typeof RoleplayTurnResponseSchema>

export const GenerateCustomTrackRequestSchema = z.object({
  titleHint: z.string().trim().max(120).optional(),
  level: CefrLevelSchema,
  sourceText: z.string().trim().min(80).max(12000)
})
export type GenerateCustomTrackRequest = z.infer<
  typeof GenerateCustomTrackRequestSchema
>

export const GenerateDrillsRequestSchema = z.object({
  count: z.number().int().min(1).max(5).default(3)
})
export type GenerateDrillsRequest = z.infer<typeof GenerateDrillsRequestSchema>

export const GeneratedDrillsPayloadSchema = z.object({
  drills: z
    .array(
      z.object({
        sentence: z.string().trim().min(5).max(300),
        ipa: z.string().trim().min(3).max(400),
        category: z.string().trim().min(2).max(60),
        promptPt: z.string().trim().min(3).max(300),
        contrastHint: z.string().trim().min(3).max(300),
        activityType: z.enum(['pronunciation', 'minimal_pair'])
      })
    )
    .min(1)
    .max(5)
})

export const SessionTypeSchema = z.enum(['pronunciation', 'writing', 'pomodoro'])
export type SessionType = z.infer<typeof SessionTypeSchema>

export const SaveSessionRequestSchema = z.object({
  type: SessionTypeSchema,
  durationSeconds: z.number().int().nonnegative(),
  score: z.number().min(0).max(100).nullable()
})
export type SaveSessionRequest = z.infer<typeof SaveSessionRequestSchema>

export const StudySessionSchema = z.object({
  id: z.number().int(),
  type: SessionTypeSchema,
  durationSeconds: z.number().int(),
  score: z.number().nullable(),
  createdAt: z.string()
})
export type StudySession = z.infer<typeof StudySessionSchema>

export const StudyStatsSchema = z.object({
  currentStreakDays: z.number().int().nonnegative(),
  totalFocusMinutes: z.number().nonnegative(),
  averageScore: z.number().min(0).max(100),
  totalSessions: z.number().int().nonnegative(),
  recentSessions: z.array(StudySessionSchema)
})
export type StudyStats = z.infer<typeof StudyStatsSchema>

export const ActivityTypeSchema = z.enum([
  'pronunciation',
  'minimal_pair',
  'active_recall',
  'shadowing'
])
export type ActivityType = z.infer<typeof ActivityTypeSchema>

export const TrackLevelSchema = CefrLevelSchema
export type TrackLevel = z.infer<typeof TrackLevelSchema>

export const LearningTrackProgressSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  titlePt: z.string(),
  titleEn: z.string(),
  descriptionPt: z.string(),
  descriptionEn: z.string(),
  level: TrackLevelSchema,
  category: z.string(),
  sourceType: TrackSourceTypeSchema,
  orderIndex: z.number().int(),
  totalItems: z.number().int(),
  completedItems: z.number().int(),
  nextItemId: z.number().int().nullable(),
  totalLessons: z.number().int().nonnegative(),
  completedLessons: z.number().int().nonnegative(),
  totalXp: z.number().int().nonnegative(),
  earnedXp: z.number().int().nonnegative()
})
export type LearningTrackProgress = z.infer<typeof LearningTrackProgressSchema>

export const PracticeItemSchema = z.object({
  id: z.number().int(),
  trackId: z.number().int().nullable(),
  activityType: ActivityTypeSchema,
  sentence: z.string(),
  ipa: z.string(),
  category: z.string(),
  promptPt: z.string().nullable(),
  contrastHint: z.string().nullable(),
  orderIndex: z.number().int(),
  attemptsCount: z.number().int(),
  lastScore: z.number().nullable(),
  nextReviewAt: z.string().nullable()
})
export type PracticeItem = z.infer<typeof PracticeItemSchema>

export const UpdatePracticeReviewRequestSchema = z.object({
  itemId: z.number().int().positive(),
  score: z.number().min(0).max(100),
  nextReviewAt: z.string()
})
export type UpdatePracticeReviewRequest = z.infer<
  typeof UpdatePracticeReviewRequestSchema
>

export const PhonemeErrorSchema = z.object({
  id: z.number().int(),
  word: z.string(),
  expectedSound: z.string(),
  userIssue: z.string(),
  occurrences: z.number().int(),
  updatedAt: z.string()
})
export type PhonemeError = z.infer<typeof PhonemeErrorSchema>

export const PomodoroStateSchema = z.object({
  mode: z.enum(['focus', 'break']),
  status: z.enum(['idle', 'running', 'paused']),
  remainingSeconds: z.number().int().nonnegative(),
  totalSeconds: z.number().int().positive()
})
export type PomodoroState = z.infer<typeof PomodoroStateSchema>

export const AppLanguageSchema = z.enum(['pt-BR', 'en'])
export type AppLanguage = z.infer<typeof AppLanguageSchema>

export const SettingsStatusSchema = z.object({
  hasApiKey: z.boolean(),
  source: z.enum(['safeStorage', 'env', 'none']),
  model: z.string(),
  safeStorageAvailable: z.boolean(),
  language: AppLanguageSchema
})
export type SettingsStatus = z.infer<typeof SettingsStatusSchema>

export const SaveApiKeyRequestSchema = z.object({
  apiKey: z.string().trim().min(10, 'API key is too short').max(256)
})
export type SaveApiKeyRequest = z.infer<typeof SaveApiKeyRequestSchema>

export const SaveLanguageRequestSchema = z.object({
  language: AppLanguageSchema
})
export type SaveLanguageRequest = z.infer<typeof SaveLanguageRequestSchema>

/**
 * Typed bridge exposed on `window.englishChecks` via Electron contextBridge.
 */
export interface EnglishChecksApi {
  analyzePronunciation: (
    payload: AnalyzePronunciationRequest
  ) => Promise<IpcResult<AnalyzePronunciationResponse>>
  checkGrammar: (
    payload: CheckGrammarRequest
  ) => Promise<IpcResult<CheckGrammarResponse>>
  evaluateRecall: (
    payload: EvaluateRecallRequest
  ) => Promise<IpcResult<EvaluateRecallResponse>>
  evaluateOpenQa: (
    payload: EvaluateOpenQaRequest
  ) => Promise<IpcResult<EvaluateOpenQaResponse>>
  evaluateRoleplayTurn: (
    payload: RoleplayTurnRequest
  ) => Promise<IpcResult<RoleplayTurnResponse>>
  generateCustomTrack: (
    payload: GenerateCustomTrackRequest
  ) => Promise<IpcResult<LearningTrackProgress>>
  generateCustomDrills: (
    payload?: GenerateDrillsRequest
  ) => Promise<IpcResult<PracticeItem[]>>
  getStats: () => Promise<IpcResult<StudyStats>>
  saveSession: (
    payload: SaveSessionRequest
  ) => Promise<IpcResult<StudySession>>
  getTracks: () => Promise<IpcResult<LearningTrackProgress[]>>
  getTrackLessons: (
    payload: GetTrackLessonsRequest
  ) => Promise<IpcResult<LessonSummary[]>>
  completeLessonActivity: (
    payload: CompleteLessonActivityRequest
  ) => Promise<IpcResult<CompleteLessonActivityResponse>>
  getPracticeItems: () => Promise<IpcResult<PracticeItem[]>>
  updatePracticeReview: (
    payload: UpdatePracticeReviewRequest
  ) => Promise<IpcResult<PracticeItem>>
  getPhonemeErrors: () => Promise<IpcResult<PhonemeError[]>>
  toggleQuickCheck: () => Promise<IpcResult<{ visible: boolean }>>
  hideQuickCheck: () => Promise<IpcResult<void>>
  minimizeWindow: () => Promise<IpcResult<void>>
  toggleMaximizeWindow: () => Promise<IpcResult<{ maximized: boolean }>>
  closeWindow: () => Promise<IpcResult<void>>
  isWindowMaximized: () => Promise<IpcResult<{ maximized: boolean }>>
  getPomodoroState: () => Promise<IpcResult<PomodoroState>>
  startPomodoro: () => Promise<IpcResult<PomodoroState>>
  pausePomodoro: () => Promise<IpcResult<PomodoroState>>
  resetPomodoro: () => Promise<IpcResult<PomodoroState>>
  onPomodoroTick: (callback: (state: PomodoroState) => void) => () => void
  getSettingsStatus: () => Promise<IpcResult<SettingsStatus>>
  saveApiKey: (payload: SaveApiKeyRequest) => Promise<IpcResult<SettingsStatus>>
  clearApiKey: () => Promise<IpcResult<SettingsStatus>>
  saveLanguage: (payload: SaveLanguageRequest) => Promise<IpcResult<SettingsStatus>>
  onSettingsUpdated: (callback: (status: SettingsStatus) => void) => () => void
}
