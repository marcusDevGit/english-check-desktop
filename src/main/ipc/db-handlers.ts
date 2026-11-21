import {
  IPC_CHANNELS,
  SaveSessionRequestSchema,
  UpdatePracticeReviewRequestSchema
} from '../../shared/ipc-contracts'
import {
  getPhonemeErrors,
  getPracticeItems,
  getStudyStats,
  saveStudySession,
  updatePracticeReview
} from '../database/repository'
import { registerValidatedHandler } from './safe-handle'

export function registerDbHandlers(): void {
  registerValidatedHandler(IPC_CHANNELS.DB_GET_STATS, null, () => getStudyStats())

  registerValidatedHandler(
    IPC_CHANNELS.DB_SAVE_SESSION,
    SaveSessionRequestSchema,
    (input) => saveStudySession(input)
  )

  registerValidatedHandler(IPC_CHANNELS.DB_GET_PRACTICE_ITEMS, null, () =>
    getPracticeItems()
  )

  registerValidatedHandler(
    IPC_CHANNELS.DB_UPDATE_PRACTICE_REVIEW,
    UpdatePracticeReviewRequestSchema,
    (input) => updatePracticeReview(input)
  )

  registerValidatedHandler(IPC_CHANNELS.DB_GET_PHONEME_ERRORS, null, () =>
    getPhonemeErrors()
  )
}
