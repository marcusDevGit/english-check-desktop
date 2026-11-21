import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const studySessions = sqliteTable('study_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type', { enum: ['pronunciation', 'writing', 'pomodoro'] }).notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  score: integer('score'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
})

export const practiceItems = sqliteTable('practice_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sentence: text('sentence').notNull().unique(),
  ipa: text('ipa').notNull(),
  category: text('category').notNull(),
  attemptsCount: integer('attempts_count').notNull().default(0),
  lastScore: integer('last_score'),
  nextReviewAt: text('next_review_at')
})

export const phonemeErrors = sqliteTable(
  'phoneme_errors',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    word: text('word').notNull(),
    expectedSound: text('expected_sound').notNull(),
    userIssue: text('user_issue').notNull(),
    occurrences: integer('occurrences').notNull().default(1),
    updatedAt: text('updated_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString())
  },
  (table) => [
    uniqueIndex('phoneme_errors_word_sound_idx').on(table.word, table.expectedSound)
  ]
)
