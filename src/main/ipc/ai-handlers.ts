import {
  AnalyzePronunciationRequestSchema,
  CheckGrammarRequestSchema,
  EvaluateRecallRequestSchema,
  GenerateDrillsRequestSchema,
  IPC_CHANNELS
} from '../../shared/ipc-contracts'
import {
  getPhonemeErrors,
  insertCustomPracticeItems,
  saveStudySession,
  updatePracticeReview,
  upsertPhonemeErrors
} from '../database/repository'
import {
  analyzePronunciation,
  checkWriting,
  evaluateActiveRecall,
  generateCustomDrills
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
}
