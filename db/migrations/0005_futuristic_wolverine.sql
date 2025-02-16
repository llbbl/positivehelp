CREATE TABLE `authors` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text
);
--> statement-breakpoint
CREATE TABLE `message_authors` (
	`messageId` integer NOT NULL,
	`authorId` integer NOT NULL,
	PRIMARY KEY(`messageId`, `authorId`),
	FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`authorId`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `messages` ADD `clerkUserId` text;