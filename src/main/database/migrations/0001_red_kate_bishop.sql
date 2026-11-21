CREATE TABLE `learning_tracks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title_pt` text NOT NULL,
	`title_en` text NOT NULL,
	`description_pt` text NOT NULL,
	`description_en` text NOT NULL,
	`level` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_tracks_slug_unique` ON `learning_tracks` (`slug`);--> statement-breakpoint
ALTER TABLE `practice_items` ADD `track_id` integer REFERENCES learning_tracks(id);--> statement-breakpoint
ALTER TABLE `practice_items` ADD `activity_type` text DEFAULT 'pronunciation' NOT NULL;--> statement-breakpoint
ALTER TABLE `practice_items` ADD `prompt_pt` text;--> statement-breakpoint
ALTER TABLE `practice_items` ADD `contrast_hint` text;--> statement-breakpoint
ALTER TABLE `practice_items` ADD `order_index` integer DEFAULT 0 NOT NULL;