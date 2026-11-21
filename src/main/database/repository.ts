import { asc, desc, eq, sql } from 'drizzle-orm'
import type {
  PhonemeError,
  PracticeItem,
  SaveSessionRequest,
  StudySession,
  StudyStats,
  UpdatePracticeReviewRequest
} from '../../shared/ipc-contracts'
import { getDb } from './index'
import { phonemeErrors, practiceItems, studySessions } from './schema'

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
  const inserted = db
    .insert(studySessions)
    .values({
      type: input.type,
      durationSeconds: input.durationSeconds,
      score: input.score
    })
    .returning()
    .get()

  return inserted
}

export function getPracticeItems(): PracticeItem[] {
  const db = getDb()
  return db
    .select()
    .from(practiceItems)
    .orderBy(sql`${practiceItems.nextReviewAt} IS NOT NULL`, asc(practiceItems.nextReviewAt), asc(practiceItems.id))
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
