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
	(table) => [
		uniqueIndex("idx_messages_slug").on(table.slug),
		uniqueIndex("idx_messages_hash").on(table.hash),
		index("idx_messages_clerk_user_id").on(table.clerkUserId),
	],
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
	(table) => [
		index("idx_submissions_clerk_user_id").on(table.clerkUserId),
		index("idx_submissions_status").on(table.status),
	],
);

export const authors = sqliteTable(
	"authors",
	{
		id: integer("id", { mode: "number" }).primaryKey(),
		name: text("name"),
	},
	(table) => [
		uniqueIndex("idx_authors_name").on(table.name),
	],
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

// API Tokens for desktop app authentication
export const apiTokens = sqliteTable(
	"api_tokens",
	{
		id: integer("id", { mode: "number" }).primaryKey(),
		token: text("token").notNull().unique(),
		clerkUserId: text("clerkUserId").notNull(),
		name: text("name").notNull().default("Desktop App"),
		createdAt: text("createdAt").notNull(),
		expiresAt: text("expiresAt"),
		lastUsedAt: text("lastUsedAt"),
		revokedAt: text("revokedAt"),
	},
	(table) => [
		uniqueIndex("idx_api_tokens_token").on(table.token),
		index("idx_api_tokens_clerkUserId").on(table.clerkUserId),
	],
);

// Statements for user-submitted positive statements (pre-promotion)
export const statements = sqliteTable(
	"statements",
	{
		id: integer("id", { mode: "number" }).primaryKey(),
		text: text("text").notNull(),
		wins: integer("wins", { mode: "number" }).default(0),
		losses: integer("losses", { mode: "number" }).default(0),
		createdAt: text("createdAt").notNull(),
		clerkUserId: text("clerkUserId").notNull(),
		promotedAt: text("promotedAt"),
		promotedMessageId: integer("promotedMessageId", { mode: "number" }).references(
			() => messages.id,
		),
	},
	(table) => [
		index("idx_statements_clerkUserId").on(table.clerkUserId),
		index("idx_statements_promotedAt").on(table.promotedAt),
	],
);

// Comparisons track which statement won in a head-to-head comparison
export const comparisons = sqliteTable(
	"comparisons",
	{
		id: integer("id", { mode: "number" }).primaryKey(),
		winnerId: integer("winnerId", { mode: "number" })
			.notNull()
			.references(() => statements.id),
		loserId: integer("loserId", { mode: "number" })
			.notNull()
			.references(() => statements.id),
		clerkUserId: text("clerkUserId").notNull(),
		timestamp: text("timestamp").notNull(),
	},
	(table) => [
		index("idx_comparisons_clerkUserId").on(table.clerkUserId),
	],
);

// Relations for statements
export const statementsRelations = relations(statements, ({ one, many }) => ({
	promotedMessage: one(messages, {
		fields: [statements.promotedMessageId],
		references: [messages.id],
	}),
	winsAsWinner: many(comparisons, { relationName: "winner" }),
	lossesAsLoser: many(comparisons, { relationName: "loser" }),
}));

// Relations for comparisons
export const comparisonsRelations = relations(comparisons, ({ one }) => ({
	winner: one(statements, {
		fields: [comparisons.winnerId],
		references: [statements.id],
		relationName: "winner",
	}),
	loser: one(statements, {
		fields: [comparisons.loserId],
		references: [statements.id],
		relationName: "loser",
	}),
}));
