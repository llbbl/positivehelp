import { sqliteTable, integer, text, numeric, primaryKey } from "drizzle-orm/sqlite-core"
import { relations } from 'drizzle-orm'; 

export const messages = sqliteTable("messages", {
	id: integer("id", { mode: "number" }).primaryKey(),
	msg: text('msg'),
	hash: text('hash'),
	slug: text('slug'),
	date: numeric('date'),
	clerkUserId: text('clerkUserId'),
	approvalClerkUserId: text('approvalClerkUserId'),
	approvalDate: numeric('approvalDate'),
});

export const submissions = sqliteTable("submissions", {
	id: integer("id", { mode: "number" }).primaryKey(),
	msg: text('msg'),
	hash: text('hash'),
	slug: text('slug'),
	date: numeric('date'),
	clerkUserId: text('clerkUserId'),
	positivityScore: numeric('positivityScore'),
});

export const authors = sqliteTable("authors", {
    id: integer("id", { mode: "number" }).primaryKey(),
    name: text('name')
});

export const message_authors = sqliteTable("message_authors", {
    messageId: integer('messageId', { mode: "number" }).notNull().references(() => messages.id),
    authorId: integer('authorId', { mode: "number" }).notNull().references(() => authors.id),
}, (table) => [ // Changed: Now returns an array
    primaryKey({ columns: [table.messageId, table.authorId] }), // Put the primaryKey inside the array
]);



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

export const messageAuthorsRelations = relations(message_authors, ({ one }) => ({
	message: one(messages, {
		fields: [message_authors.messageId],
		references: [messages.id],
	}),
	author: one(authors, {
		fields: [message_authors.authorId],
		references: [authors.id],
	}),
}));

