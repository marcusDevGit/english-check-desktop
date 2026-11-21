CREATE TABLE `phoneme_errors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`word` text NOT NULL,
	`expected_sound` text NOT NULL,
	`user_issue` text NOT NULL,
	`occurrences` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `phoneme_errors_word_sound_idx` ON `phoneme_errors` (`word`,`expected_sound`);--> statement-breakpoint
CREATE TABLE `practice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sentence` text NOT NULL,
	`ipa` text NOT NULL,
	`category` text NOT NULL,
	`attempts_count` integer DEFAULT 0 NOT NULL,
	`last_score` integer,
	`next_review_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `practice_items_sentence_unique` ON `practice_items` (`sentence`);--> statement-breakpoint
CREATE TABLE `study_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`duration_seconds` integer NOT NULL,
	`score` integer,
	`created_at` text NOT NULL
);
