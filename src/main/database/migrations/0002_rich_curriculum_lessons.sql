CREATE TABLE `lesson_activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lesson_id` integer NOT NULL,
	`step_order` integer NOT NULL,
	`activity_type` text NOT NULL,
	`payload_json` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`score` integer,
	`updated_at` text,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_activities_lesson_step_idx` ON `lesson_activities` (`lesson_id`,`step_order`);--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`track_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title_pt` text NOT NULL,
	`title_en` text NOT NULL,
	`xp_reward` integer DEFAULT 100 NOT NULL,
	`cheat_sheet_json` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`best_score` integer,
	`completed_at` text,
	FOREIGN KEY (`track_id`) REFERENCES `learning_tracks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lessons_slug_unique` ON `lessons` (`slug`);--> statement-breakpoint
ALTER TABLE `learning_tracks` ADD `category` text DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE `learning_tracks` ADD `source_type` text DEFAULT 'seed' NOT NULL;