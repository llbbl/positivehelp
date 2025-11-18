import { relations } from "drizzle-orm";
import {
	index,
	integer,
	numeric,
	primaryKey,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const messages = sqliteTable(
	"messages",
	{
		id: integer("id", { mode: "number" }).primaryKey(),
		msg: text("msg"),
		hash: text("hash"),
		slug: text("slug"),
		date: numeric("date"),
		clerkUserId: text("clerkUserId"),
		approvalClerkUserId: text("approvalClerkUserId"),
		approvalDate: numeric("approvalDate"),
	},
	(table) => ({
		slugIdx: uniqueIndex("idx_messages_slug").on(table.slug),
		hashIdx: uniqueIndex("idx_messages_hash").on(table.hash),
		clerkUserIdx: index("idx_messages_clerk_user_id").on(table.clerkUserId),
	}),
);

export const submissions = sqliteTable(
	"submissions",
	{
		id: integer("id", { mode: "number" }).primaryKey(),
		msg: text("msg"),
		hash: text("hash"),
		slug: text("slug"),
		date: numeric("date"),
		clerkUserId: text("clerkUserId"),
		positivityScore: numeric("positivityScore"),
		status: integer("status", { mode: "number" }).default(1).notNull(), // 1 = not reviewed, 0 = denied
		authorName: text("authorName"),
	},
	(table) => ({
		clerkUserIdx: index("idx_submissions_clerk_user_id").on(
			table.clerkUserId,
		),
		statusIdx: index("idx_submissions_status").on(table.status),
	}),
);

export const authors = sqliteTable(
	"authors",
	{
		id: integer("id", { mode: "number" }).primaryKey(),
		name: text("name"),
	},
	(table) => ({
		nameIdx: uniqueIndex("idx_authors_name").on(table.name),
	}),
);

export const message_authors = sqliteTable(
	"message_authors",
	{
		messageId: integer("messageId", { mode: "number" })
			.notNull()
			.references(() => messages.id),
		authorId: integer("authorId", { mode: "number" })
			.notNull()
			.references(() => authors.id),
	},
	(table) => [
		// Changed: Now returns an array
		primaryKey({ columns: [table.messageId, table.authorId] }), // Put the primaryKey inside the array
	],
);

// Relations

export const messagesRelations = relations(messages, ({ many }) => ({
	authors: many(message_authors),
}));

export const submissionsRelations = relations(submissions, ({ many }) => ({
	authors: many(message_authors),
}));

export const authorsRelations = relations(authors, ({ many }) => ({
	messages: many(message_authors),
}));

export const messageAuthorsRelations = relations(
	message_authors,
	({ one }) => ({
		message: one(messages, {
			fields: [message_authors.messageId],
			references: [messages.id],
		}),
		author: one(authors, {
			fields: [message_authors.authorId],
			references: [authors.id],
		}),
	}),
);
