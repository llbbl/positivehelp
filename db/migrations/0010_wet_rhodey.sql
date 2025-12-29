CREATE TABLE `api_tokens` (
	`id` integer PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`clerkUserId` text NOT NULL,
	`name` text DEFAULT 'Desktop App' NOT NULL,
	`createdAt` text NOT NULL,
	`expiresAt` text,
	`lastUsedAt` text,
	`revokedAt` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_tokens_token_unique` ON `api_tokens` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_api_tokens_token` ON `api_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `idx_api_tokens_clerk_user_id` ON `api_tokens` (`clerkUserId`);--> statement-breakpoint
CREATE TABLE `comparisons` (
	`id` integer PRIMARY KEY NOT NULL,
	`winnerId` integer NOT NULL,
	`loserId` integer NOT NULL,
	`clerkUserId` text NOT NULL,
	`timestamp` text NOT NULL,
	FOREIGN KEY (`winnerId`) REFERENCES `statements`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`loserId`) REFERENCES `statements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_comparisons_clerk_user_id` ON `comparisons` (`clerkUserId`);--> statement-breakpoint
CREATE TABLE `statements` (
	`id` integer PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`wins` integer DEFAULT 0,
	`losses` integer DEFAULT 0,
	`createdAt` text NOT NULL,
	`clerkUserId` text NOT NULL,
	`promotedAt` text,
	`promotedMessageId` integer,
	FOREIGN KEY (`promotedMessageId`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_statements_clerk_user_id` ON `statements` (`clerkUserId`);--> statement-breakpoint
CREATE INDEX `idx_statements_promoted_at` ON `statements` (`promotedAt`);