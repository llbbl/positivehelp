CREATE UNIQUE INDEX `idx_authors_name` ON `authors` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_messages_slug` ON `messages` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_messages_hash` ON `messages` (`hash`);--> statement-breakpoint
CREATE INDEX `idx_messages_clerk_user_id` ON `messages` (`clerkUserId`);--> statement-breakpoint
CREATE INDEX `idx_submissions_clerk_user_id` ON `submissions` (`clerkUserId`);--> statement-breakpoint
CREATE INDEX `idx_submissions_status` ON `submissions` (`status`);