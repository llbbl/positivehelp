CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY NOT NULL,
	`msg` text,
	`hash` text,
	`slug` text,
	`date` numeric,
	`clerkUserId` text,
	`positivityScore` numeric
);
--> statement-breakpoint
ALTER TABLE `messages` ADD `approvalClerkUserId` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `approvalDate` numeric;