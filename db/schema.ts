import { sqliteTable, integer, text, numeric, primaryKey } from "drizzle-orm/sqlite-core"

export const messages = sqliteTable("messages", {
	id: integer().primaryKey(),
	msg: text('msg'),
	hash: text('hash'),
	slug: text('slug'),
	date: numeric('date'),
	clerkUserId: text('clerkUserId'),
});

export const authors = sqliteTable("authors", {
	id: integer().primaryKey(),
	name: text('name')
});

export const message_authors = sqliteTable("message_authors", {
	messageId: integer().notNull(),
	authorId: integer().notNull()
}, (table) => ({
	pk: primaryKey(table.messageId, table.authorId)
}));

