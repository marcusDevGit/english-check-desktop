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

export const learningTracks = sqliteTable('learning_tracks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  titlePt: text('title_pt').notNull(),
  titleEn: text('title_en').notNull(),
  descriptionPt: text('description_pt').notNull(),
  descriptionEn: text('description_en').notNull(),
  level: text('level', { enum: ['A2', 'B1', 'B2', 'C1'] }).notNull(),
  category: text('category').notNull().default('general'),
  sourceType: text('source_type', { enum: ['seed', 'custom_text'] })
    .notNull()
    .default('seed'),
  orderIndex: integer('order_index').notNull().default(0)
})

export const lessons = sqliteTable('lessons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  trackId: integer('track_id')
    .notNull()
    .references(() => learningTracks.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  titlePt: text('title_pt').notNull(),
  titleEn: text('title_en').notNull(),
  xpReward: integer('xp_reward').notNull().default(100),
  cheatSheetJson: text('cheat_sheet_json').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  bestScore: integer('best_score'),
  completedAt: text('completed_at')
})

export const lessonActivities = sqliteTable(
  'lesson_activities',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    lessonId: integer('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    stepOrder: integer('step_order').notNull(),
    activityType: text('activity_type', {
      enum: ['shadowing', 'listening_repeat', 'open_qa', 'micro_writing', 'roleplay']
    }).notNull(),
    payloadJson: text('payload_json').notNull(),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
    score: integer('score'),
    updatedAt: text('updated_at')
  },
  (table) => [
    uniqueIndex('lesson_activities_lesson_step_idx').on(
      table.lessonId,
      table.stepOrder
    )
  ]
)

export const practiceItems = sqliteTable('practice_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  trackId: integer('track_id').references(() => learningTracks.id),
  activityType: text('activity_type', {
    enum: ['pronunciation', 'minimal_pair', 'active_recall', 'shadowing']
  })
    .notNull()
    .default('pronunciation'),
  sentence: text('sentence').notNull().unique(),
  ipa: text('ipa').notNull(),
  category: text('category').notNull(),
  promptPt: text('prompt_pt'),
  contrastHint: text('contrast_hint'),
  orderIndex: integer('order_index').notNull().default(0),
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
