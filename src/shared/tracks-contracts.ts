import { z } from 'zod'

export const CefrLevelSchema = z.enum(['A2', 'B1', 'B2', 'C1'])
export type CefrLevel = z.infer<typeof CefrLevelSchema>

export const TrackSourceTypeSchema = z.enum(['seed', 'custom_text'])
export type TrackSourceType = z.infer<typeof TrackSourceTypeSchema>

export const CheatSheetItemSchema = z.object({
  term: z.string().trim().min(1).max(120),
  ipa: z.string().trim().min(1).max(180),
  meaningPt: z.string().trim().min(1).max(240),
  example: z.string().trim().min(3).max(320)
})
export type CheatSheetItem = z.infer<typeof CheatSheetItemSchema>

export const ShadowingPayloadSchema = z.object({
  type: z.literal('shadowing'),
  sentence: z.string().trim().min(5).max(400),
  ipa: z.string().trim().min(2).max(400),
  ptTranslation: z.string().trim().min(3).max(400),
  phoneticsTip: z.string().trim().min(3).max(400)
})

export const ListeningRepeatPayloadSchema = z.object({
  type: z.literal('listening_repeat'),
  sentence: z.string().trim().min(5).max(400),
  ipa: z.string().trim().min(2).max(400),
  contextHint: z.string().trim().min(3).max(300),
  connectedSpeechNote: z.string().trim().min(3).max(400)
})

export const OpenQaPayloadSchema = z.object({
  type: z.literal('open_qa'),
  question: z.string().trim().min(5).max(400),
  ptContext: z.string().trim().min(3).max(400),
  suggestedSeconds: z.number().int().min(10).max(60).default(20),
  expectedTopics: z.array(z.string().trim().min(2).max(120)).min(2).max(5),
  starterChips: z.array(z.string().trim().min(2).max(120)).min(2).max(5)
})

export const MicroWritingPayloadSchema = z.object({
  type: z.literal('micro_writing'),
  scenario: z.string().trim().min(5).max(400),
  taskPrompt: z.string().trim().min(5).max(400),
  targetExpressions: z.array(z.string().trim().min(2).max(120)).min(2).max(6),
  starterChips: z.array(z.string().trim().min(2).max(120)).min(2).max(5),
  sampleAnswer: z.string().trim().min(5).max(600)
})

export const RoleplayPayloadSchema = z.object({
  type: z.literal('roleplay'),
  persona: z.string().trim().min(3).max(160),
  scenario: z.string().trim().min(5).max(500),
  openingLine: z.string().trim().min(5).max(400),
  objectives: z.array(z.string().trim().min(3).max(180)).min(2).max(4),
  starterChips: z.array(z.string().trim().min(2).max(120)).min(2).max(5),
  maxTurns: z.number().int().min(3).max(6).default(4)
})

export const ActivityPayloadSchema = z.discriminatedUnion('type', [
  ShadowingPayloadSchema,
  ListeningRepeatPayloadSchema,
  OpenQaPayloadSchema,
  MicroWritingPayloadSchema,
  RoleplayPayloadSchema
])
export type ActivityPayload = z.infer<typeof ActivityPayloadSchema>

export const LessonActivityTypeSchema = z.enum([
  'shadowing',
  'listening_repeat',
  'open_qa',
  'micro_writing',
  'roleplay'
])
export type LessonActivityType = z.infer<typeof LessonActivityTypeSchema>

export const GeneratedActivitySchema = z.object({
  stepOrder: z.number().int().min(1).max(5),
  payload: ActivityPayloadSchema
})
export type GeneratedActivity = z.infer<typeof GeneratedActivitySchema>

export const GeneratedLessonSchema = z.object({
  slug: z.string().trim().min(3).max(120),
  titlePt: z.string().trim().min(3).max(180),
  titleEn: z.string().trim().min(3).max(180),
  xpReward: z.number().int().min(20).max(500).default(100),
  cheatSheet: z.array(CheatSheetItemSchema).min(3).max(5),
  activities: z.array(GeneratedActivitySchema).length(5)
})
export type GeneratedLesson = z.infer<typeof GeneratedLessonSchema>

export const GeneratedTrackSchema = z.object({
  slug: z.string().trim().min(3).max(120),
  level: CefrLevelSchema,
  category: z.string().trim().min(2).max(60),
  titlePt: z.string().trim().min(3).max(180),
  titleEn: z.string().trim().min(3).max(180),
  descriptionPt: z.string().trim().min(5).max(500),
  descriptionEn: z.string().trim().min(5).max(500),
  orderIndex: z.number().int().nonnegative(),
  lessons: z.array(GeneratedLessonSchema).min(1).max(6)
})
export type GeneratedTrack = z.infer<typeof GeneratedTrackSchema>

export const CurriculumSeedSchema = z.array(GeneratedTrackSchema)
export type CurriculumSeed = z.infer<typeof CurriculumSeedSchema>

export const LessonActivityRecordSchema = z.object({
  id: z.number().int(),
  lessonId: z.number().int(),
  stepOrder: z.number().int(),
  activityType: LessonActivityTypeSchema,
  payload: ActivityPayloadSchema,
  completed: z.boolean(),
  score: z.number().nullable(),
  updatedAt: z.string().nullable()
})
export type LessonActivityRecord = z.infer<typeof LessonActivityRecordSchema>

export const LessonSummarySchema = z.object({
  id: z.number().int(),
  trackId: z.number().int(),
  slug: z.string(),
  titlePt: z.string(),
  titleEn: z.string(),
  xpReward: z.number().int(),
  cheatSheet: z.array(CheatSheetItemSchema),
  orderIndex: z.number().int(),
  bestScore: z.number().nullable(),
  completedAt: z.string().nullable(),
  activities: z.array(LessonActivityRecordSchema)
})
export type LessonSummary = z.infer<typeof LessonSummarySchema>

export const GetTrackLessonsRequestSchema = z.object({
  trackId: z.number().int().positive()
})
export type GetTrackLessonsRequest = z.infer<typeof GetTrackLessonsRequestSchema>

export const CompleteLessonActivityRequestSchema = z.object({
  activityId: z.number().int().positive(),
  score: z.number().min(0).max(100)
})
export type CompleteLessonActivityRequest = z.infer<
  typeof CompleteLessonActivityRequestSchema
>

export const CompleteLessonActivityResponseSchema = z.object({
  activity: LessonActivityRecordSchema,
  lessonCompleted: z.boolean(),
  xpEarned: z.number().int().nonnegative()
})
export type CompleteLessonActivityResponse = z.infer<
  typeof CompleteLessonActivityResponseSchema
>
