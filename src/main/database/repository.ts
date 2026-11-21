import { asc, desc, eq, sql } from 'drizzle-orm'
import type {
  LearningTrackProgress,
  PhonemeError,
  PracticeItem,
  SaveSessionRequest,
  StudySession,
  StudyStats,
  UpdatePracticeReviewRequest
} from '../../shared/ipc-contracts'
import { getDb } from './index'
import { learningTracks, phonemeErrors, practiceItems, studySessions } from './schema'

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

  return tracks.map((track) => {
    const trackItems = items.filter((item) => item.trackId === track.id)
    const completedItems = trackItems.filter(
      (item) => item.lastScore !== null && item.lastScore >= MASTERY_THRESHOLD_SCORE
    ).length
    const nextPending = trackItems.find(
      (item) => item.lastScore === null || item.lastScore < MASTERY_THRESHOLD_SCORE
    )

    return {
      id: track.id,
      slug: track.slug,
      titlePt: track.titlePt,
      titleEn: track.titleEn,
      descriptionPt: track.descriptionPt,
      descriptionEn: track.descriptionEn,
      level: track.level,
      orderIndex: track.orderIndex,
      totalItems: trackItems.length,
      completedItems,
      nextItemId: nextPending?.id ?? trackItems[0]?.id ?? null
    }
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
