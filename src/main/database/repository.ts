import { asc, desc, eq, inArray, sql } from 'drizzle-orm'
import {
  ActivityPayloadSchema,
  CheatSheetItemSchema,
  type CompleteLessonActivityRequest,
  type CompleteLessonActivityResponse,
  type GeneratedTrack,
  type GetTrackLessonsRequest,
  type LearningTrackProgress,
  type LessonActivityRecord,
  type LessonSummary,
  type PhonemeError,
  type PracticeItem,
  type SaveSessionRequest,
  type StudySession,
  type StudyStats,
  type TrackSourceType,
  type UpdatePracticeReviewRequest
} from '../../shared/ipc-contracts'
import { getDb } from './index'
import {
  learningTracks,
  lessonActivities,
  lessons,
  phonemeErrors,
  practiceItems,
  studySessions
} from './schema'

const MASTERY_THRESHOLD_SCORE = 75

function toDayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function calculateStreakDays(isoDates: string[]): number {
  if (isoDates.length === 0) return 0

  const uniqueDays = new Set(isoDates.map((iso) => toDayKey(new Date(iso))))
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  if (!uniqueDays.has(toDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!uniqueDays.has(toDayKey(cursor))) {
      return 0
    }
  }

  let streak = 0
  while (uniqueDays.has(toDayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function getStudyStats(): StudyStats {
  const db = getDb()

  const recentRows = db
    .select()
    .from(studySessions)
    .orderBy(desc(studySessions.id))
    .limit(10)
    .all()

  const allRows = db
    .select({
      durationSeconds: studySessions.durationSeconds,
      score: studySessions.score,
      createdAt: studySessions.createdAt
    })
    .from(studySessions)
    .all()

  const totalSessions = allRows.length
  const totalSeconds = allRows.reduce((sum, row) => sum + row.durationSeconds, 0)
  const scoredRows = allRows.filter((row): row is typeof row & { score: number } => row.score !== null)
  const averageScore =
    scoredRows.length > 0
      ? Math.round(scoredRows.reduce((sum, row) => sum + row.score, 0) / scoredRows.length)
      : 0

  return {
    currentStreakDays: calculateStreakDays(allRows.map((row) => row.createdAt)),
    totalFocusMinutes: Math.round((totalSeconds / 60) * 10) / 10,
    averageScore,
    totalSessions,
    recentSessions: recentRows
  }
}

export function saveStudySession(input: SaveSessionRequest): StudySession {
  const db = getDb()
  return db
    .insert(studySessions)
    .values({
      type: input.type,
      durationSeconds: input.durationSeconds,
      score: input.score
    })
    .returning()
    .get()
}

export function getLearningTracksProgress(): LearningTrackProgress[] {
  const db = getDb()
  const tracks = db
    .select()
    .from(learningTracks)
    .orderBy(asc(learningTracks.orderIndex), asc(learningTracks.id))
    .all()

  const items = db
    .select()
    .from(practiceItems)
    .orderBy(asc(practiceItems.orderIndex), asc(practiceItems.id))
    .all()

  const allLessons = db
    .select({
      trackId: lessons.trackId,
      xpReward: lessons.xpReward,
      completedAt: lessons.completedAt
    })
    .from(lessons)
    .all()

  return tracks.map((track) => {
    const trackItems = items.filter((item) => item.trackId === track.id)
    const completedItems = trackItems.filter(
      (item) => item.lastScore !== null && item.lastScore >= MASTERY_THRESHOLD_SCORE
    ).length
    const nextPending = trackItems.find(
      (item) => item.lastScore === null || item.lastScore < MASTERY_THRESHOLD_SCORE
    )

    const trackLessons = allLessons.filter((lesson) => lesson.trackId === track.id)
    const completedTrackLessons = trackLessons.filter(
      (lesson) => lesson.completedAt !== null
    )
    const totalXp = trackLessons.reduce((sum, lesson) => sum + lesson.xpReward, 0)
    const earnedXp = completedTrackLessons.reduce(
      (sum, lesson) => sum + lesson.xpReward,
      0
    )

    return {
      id: track.id,
      slug: track.slug,
      titlePt: track.titlePt,
      titleEn: track.titleEn,
      descriptionPt: track.descriptionPt,
      descriptionEn: track.descriptionEn,
      level: track.level,
      category: track.category,
      sourceType: track.sourceType,
      orderIndex: track.orderIndex,
      totalItems: trackItems.length,
      completedItems,
      nextItemId: nextPending?.id ?? trackItems[0]?.id ?? null,
      totalLessons: trackLessons.length,
      completedLessons: completedTrackLessons.length,
      totalXp,
      earnedXp
    }
  })
}

export function getTrackLessons(input: GetTrackLessonsRequest): LessonSummary[] {
  const db = getDb()
  const trackLessons = db
    .select()
    .from(lessons)
    .where(eq(lessons.trackId, input.trackId))
    .orderBy(asc(lessons.orderIndex), asc(lessons.id))
    .all()

  if (trackLessons.length === 0) {
    return []
  }

  const lessonIds = trackLessons.map((lesson) => lesson.id)
  const rawActivities = db
    .select()
    .from(lessonActivities)
    .where(inArray(lessonActivities.lessonId, lessonIds))
    .orderBy(asc(lessonActivities.stepOrder), asc(lessonActivities.id))
    .all()

  const activitiesByLesson = new Map<number, LessonActivityRecord[]>()
  for (const row of rawActivities) {
    const parsedPayload = ActivityPayloadSchema.parse(JSON.parse(row.payloadJson))
    const mapped: LessonActivityRecord = {
      id: row.id,
      lessonId: row.lessonId,
      stepOrder: row.stepOrder,
      activityType: row.activityType,
      payload: parsedPayload,
      completed: Boolean(row.completed),
      score: row.score,
      updatedAt: row.updatedAt
    }

    const list = activitiesByLesson.get(row.lessonId)
    if (list) {
      list.push(mapped)
    } else {
      activitiesByLesson.set(row.lessonId, [mapped])
    }
  }

  return trackLessons.map((lesson) => ({
    id: lesson.id,
    trackId: lesson.trackId,
    slug: lesson.slug,
    titlePt: lesson.titlePt,
    titleEn: lesson.titleEn,
    xpReward: lesson.xpReward,
    cheatSheet: CheatSheetItemSchema.array().parse(JSON.parse(lesson.cheatSheetJson)),
    orderIndex: lesson.orderIndex,
    bestScore: lesson.bestScore,
    completedAt: lesson.completedAt,
    activities: activitiesByLesson.get(lesson.id) ?? []
  }))
}

export function completeLessonActivity(
  input: CompleteLessonActivityRequest
): CompleteLessonActivityResponse {
  const db = getDb()
  const now = new Date().toISOString()
  const roundedScore = Math.round(input.score)

  return db.transaction((tx) => {
    const updatedRow = tx
      .update(lessonActivities)
      .set({
        completed: true,
        score: roundedScore,
        updatedAt: now
      })
      .where(eq(lessonActivities.id, input.activityId))
      .returning()
      .get()

    if (!updatedRow) {
      throw new Error(`Lesson activity #${input.activityId} not found`)
    }

    const siblings = tx
      .select()
      .from(lessonActivities)
      .where(eq(lessonActivities.lessonId, updatedRow.lessonId))
      .all()

    const lesson = tx
      .select()
      .from(lessons)
      .where(eq(lessons.id, updatedRow.lessonId))
      .get()

    if (!lesson) {
      throw new Error(`Lesson #${updatedRow.lessonId} not found`)
    }

    const lessonCompleted =
      siblings.length > 0 && siblings.every((item) => Boolean(item.completed))

    let xpEarned = 0
    if (lessonCompleted) {
      const scored = siblings.filter(
        (item): item is typeof item & { score: number } => item.score !== null
      )
      const averageScore =
        scored.length > 0
          ? Math.round(scored.reduce((sum, item) => sum + item.score, 0) / scored.length)
          : roundedScore

      const isFirstCompletion = lesson.completedAt === null
      if (isFirstCompletion) {
        xpEarned = lesson.xpReward
      }

      tx.update(lessons)
        .set({
          completedAt: lesson.completedAt ?? now,
          bestScore: Math.max(lesson.bestScore ?? 0, averageScore)
        })
        .where(eq(lessons.id, lesson.id))
        .run()
    }

    return {
      activity: {
        id: updatedRow.id,
        lessonId: updatedRow.lessonId,
        stepOrder: updatedRow.stepOrder,
        activityType: updatedRow.activityType,
        payload: ActivityPayloadSchema.parse(JSON.parse(updatedRow.payloadJson)),
        completed: Boolean(updatedRow.completed),
        score: updatedRow.score,
        updatedAt: updatedRow.updatedAt
      },
      lessonCompleted,
      xpEarned
    }
  })
}

export function upsertGeneratedCurriculumTracks(
  tracks: GeneratedTrack[],
  sourceType: TrackSourceType = 'seed'
): number {
  if (tracks.length === 0) return 0
  const db = getDb()

  return db.transaction((tx) => {
    let syncedTracks = 0

    for (const track of tracks) {
      const savedTrack = tx
        .insert(learningTracks)
        .values({
          slug: track.slug,
          titlePt: track.titlePt,
          titleEn: track.titleEn,
          descriptionPt: track.descriptionPt,
          descriptionEn: track.descriptionEn,
          level: track.level,
          category: track.category,
          sourceType,
          orderIndex: track.orderIndex
        })
        .onConflictDoUpdate({
          target: learningTracks.slug,
          set: {
            titlePt: track.titlePt,
            titleEn: track.titleEn,
            descriptionPt: track.descriptionPt,
            descriptionEn: track.descriptionEn,
            level: track.level,
            category: track.category,
            sourceType,
            orderIndex: track.orderIndex
          }
        })
        .returning()
        .get()

      track.lessons.forEach((lesson, lessonIndex) => {
        const cheatSheetJson = JSON.stringify(lesson.cheatSheet)
        const savedLesson = tx
          .insert(lessons)
          .values({
            trackId: savedTrack.id,
            slug: lesson.slug,
            titlePt: lesson.titlePt,
            titleEn: lesson.titleEn,
            xpReward: lesson.xpReward,
            cheatSheetJson,
            orderIndex: lessonIndex + 1
          })
          .onConflictDoUpdate({
            target: lessons.slug,
            set: {
              trackId: savedTrack.id,
              titlePt: lesson.titlePt,
              titleEn: lesson.titleEn,
              xpReward: lesson.xpReward,
              cheatSheetJson,
              orderIndex: lessonIndex + 1
            }
          })
          .returning()
          .get()

        for (const activity of lesson.activities) {
          const payloadJson = JSON.stringify(activity.payload)
          tx.insert(lessonActivities)
            .values({
              lessonId: savedLesson.id,
              stepOrder: activity.stepOrder,
              activityType: activity.payload.type,
              payloadJson
            })
            .onConflictDoUpdate({
              target: [lessonActivities.lessonId, lessonActivities.stepOrder],
              set: {
                activityType: activity.payload.type,
                payloadJson
              }
            })
            .run()
        }
      })

      syncedTracks += 1
    }

    return syncedTracks
  })
}

export function getPracticeItems(): PracticeItem[] {
  const db = getDb()
  return db
    .select()
    .from(practiceItems)
    .orderBy(
      asc(practiceItems.trackId),
      asc(practiceItems.orderIndex),
      asc(practiceItems.id)
    )
    .all()
}

export function updatePracticeReview(input: UpdatePracticeReviewRequest): PracticeItem {
  const db = getDb()
  const updated = db
    .update(practiceItems)
    .set({
      attemptsCount: sql`${practiceItems.attemptsCount} + 1`,
      lastScore: input.score,
      nextReviewAt: input.nextReviewAt
    })
    .where(eq(practiceItems.id, input.itemId))
    .returning()
    .get()

  if (!updated) {
    throw new Error(`Practice item #${input.itemId} not found`)
  }

  return updated
}

export function getPhonemeErrors(): PhonemeError[] {
  const db = getDb()
  return db
    .select()
    .from(phonemeErrors)
    .orderBy(desc(phonemeErrors.occurrences), desc(phonemeErrors.updatedAt))
    .all()
}

export function insertCustomPracticeItems(
  items: Array<{
    sentence: string
    ipa: string
    category: string
    promptPt: string
    contrastHint: string
    activityType: 'pronunciation' | 'minimal_pair'
  }>
): PracticeItem[] {
  if (items.length === 0) return []
  const db = getDb()
  const created: PracticeItem[] = []

  for (const item of items) {
    const inserted = db
      .insert(practiceItems)
      .values({
        trackId: null,
        activityType: item.activityType,
        sentence: item.sentence,
        ipa: item.ipa,
        category: item.category,
        promptPt: item.promptPt,
        contrastHint: item.contrastHint,
        orderIndex: 99
      })
      .onConflictDoNothing()
      .returning()
      .get()

    if (inserted) {
      created.push(inserted)
    }
  }

  return created
}

export function upsertPhonemeErrors(
  errors: Array<{ word: string; expectedSound: string; userIssue: string }>
): void {
  if (errors.length === 0) return

  const db = getDb()
  const now = new Date().toISOString()

  for (const item of errors) {
    db.insert(phonemeErrors)
      .values({
        word: item.word.toLowerCase(),
        expectedSound: item.expectedSound,
        userIssue: item.userIssue,
        occurrences: 1,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [phonemeErrors.word, phonemeErrors.expectedSound],
        set: {
          userIssue: item.userIssue,
          occurrences: sql`${phonemeErrors.occurrences} + 1`,
          updatedAt: now
        }
      })
      .run()
  }
}
