import {
  CompleteLessonActivityRequestSchema,
  GetTrackLessonsRequestSchema,
  IPC_CHANNELS,
  SaveSessionRequestSchema,
  UpdatePracticeReviewRequestSchema
} from '../../shared/ipc-contracts'
import {
  completeLessonActivity,
  getLearningTracksProgress,
  getPhonemeErrors,
  getPracticeItems,
  getStudyStats,
  getTrackLessons,
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

  registerValidatedHandler(IPC_CHANNELS.DB_GET_TRACKS, null, () =>
    getLearningTracksProgress()
  )

  registerValidatedHandler(
    IPC_CHANNELS.DB_GET_TRACK_LESSONS,
    GetTrackLessonsRequestSchema,
    (input) => getTrackLessons(input)
  )

  registerValidatedHandler(
    IPC_CHANNELS.DB_COMPLETE_LESSON_ACTIVITY,
    CompleteLessonActivityRequestSchema,
    (input) => completeLessonActivity(input)
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
