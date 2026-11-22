import {
  AnalyzePronunciationRequestSchema,
  CheckGrammarRequestSchema,
  EvaluateOpenQaRequestSchema,
  EvaluateRecallRequestSchema,
  GenerateCustomTrackRequestSchema,
  GenerateDrillsRequestSchema,
  IPC_CHANNELS,
  RoleplayTurnRequestSchema
} from '../../shared/ipc-contracts'
import {
  getLearningTracksProgress,
  getPhonemeErrors,
  insertCustomPracticeItems,
  saveStudySession,
  updatePracticeReview,
  upsertGeneratedCurriculumTracks,
  upsertPhonemeErrors
} from '../database/repository'
import {
  analyzePronunciation,
  checkWriting,
  evaluateActiveRecall,
  evaluateOpenQa,
  evaluateRoleplayTurn,
  generateCustomDrills,
  generateCustomTrackFromContent
} from '../services/ai-evaluator'
import { registerValidatedHandler } from './safe-handle'

function computeNextReviewIso(score: number): string {
  const now = new Date()
  if (score >= 85) {
    now.setDate(now.getDate() + 3)
  } else if (score >= 70) {
    now.setDate(now.getDate() + 1)
  } else {
    now.setHours(now.getHours() + 4)
  }
  return now.toISOString()
}

export function registerAiHandlers(): void {
  registerValidatedHandler(
    IPC_CHANNELS.AUDIO_ANALYZE_PRONUNCIATION,
    AnalyzePronunciationRequestSchema,
    async (input) => {
      const result = await analyzePronunciation(input)
      const roundedScore = Math.round(result.overallScore)

      saveStudySession({
        type: 'pronunciation',
        durationSeconds: input.durationSeconds ?? 10,
        score: roundedScore
      })

      if (input.practiceItemId) {
        updatePracticeReview({
          itemId: input.practiceItemId,
          score: roundedScore,
          nextReviewAt: computeNextReviewIso(roundedScore)
        })
      }

      if (result.flaggedPhonemes.length > 0) {
        upsertPhonemeErrors(result.flaggedPhonemes)
      }

      return result
    }
  )

  registerValidatedHandler(
    IPC_CHANNELS.WRITING_CHECK_GRAMMAR,
    CheckGrammarRequestSchema,
    async (input) => {
      const result = await checkWriting(input)
      saveStudySession({
        type: 'writing',
        durationSeconds: 60,
        score: Math.round(result.naturalnessScore)
      })
      return result
    }
  )

  registerValidatedHandler(
    IPC_CHANNELS.AI_EVALUATE_RECALL,
    EvaluateRecallRequestSchema,
    async (input) => {
      const result = await evaluateActiveRecall(input)
      const roundedScore = Math.round(result.score)

      saveStudySession({
        type: 'writing',
        durationSeconds: 30,
        score: roundedScore
      })

      if (input.practiceItemId) {
        updatePracticeReview({
          itemId: input.practiceItemId,
          score: roundedScore,
          nextReviewAt: computeNextReviewIso(roundedScore)
        })
      }

      return result
    }
  )

  registerValidatedHandler(
    IPC_CHANNELS.AI_GENERATE_DRILLS,
    GenerateDrillsRequestSchema,
    async (input) => {
      const topErrors = getPhonemeErrors()
      const generated = await generateCustomDrills(topErrors, input.count)
      return insertCustomPracticeItems(generated)
    }
  )

  registerValidatedHandler(
    IPC_CHANNELS.AI_EVALUATE_OPEN_QA,
    EvaluateOpenQaRequestSchema,
    async (input) => {
      const result = await evaluateOpenQa(input)
      saveStudySession({
        type: 'pronunciation',
        durationSeconds: input.durationSeconds ?? 20,
        score: Math.round(result.score)
      })
      return result
    }
  )

  registerValidatedHandler(
    IPC_CHANNELS.AI_ROLEPLAY_TURN,
    RoleplayTurnRequestSchema,
    async (input) => evaluateRoleplayTurn(input)
  )

  registerValidatedHandler(
    IPC_CHANNELS.AI_GENERATE_CUSTOM_TRACK,
    GenerateCustomTrackRequestSchema,
    async (input) => {
      const generatedTrack = await generateCustomTrackFromContent(input)
      upsertGeneratedCurriculumTracks([generatedTrack], 'custom_text')
      const created = getLearningTracksProgress().find(
        (track) => track.slug === generatedTrack.slug
      )
      if (!created) {
        throw new Error('Failed to load newly generated custom track.')
      }
      return created
    }
  )
}
