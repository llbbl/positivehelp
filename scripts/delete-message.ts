#!/usr/bin/env tsx
/**
 * Script to delete a message and all related records
 * 
 * Usage:
 *   pnpm tsx scripts/delete-message.ts <message-id>
 *   pnpm tsx scripts/delete-message.ts <message-slug>
 */

import { rawClient } from "../db/client";

async function deleteMessage(identifier: string | number) {
	try {
		// First, find the message by ID or slug
		let messageId: number | null = null;
		
		if (typeof identifier === "number" || !isNaN(Number(identifier))) {
			// If it's a number, treat as ID
			messageId = Number(identifier);
		} else {
			// Otherwise, treat as slug and look it up
			const slugResult = await rawClient.execute({
				sql: "SELECT id FROM messages WHERE slug = ?",
				args: [identifier],
			});
			
			if (slugResult.rows.length === 0) {
				console.error(`❌ Message not found with slug: ${identifier}`);
				process.exit(1);
			}
			
			messageId = slugResult.rows[0].id as number;
		}
		
		// Verify message exists
		const messageResult = await rawClient.execute({
			sql: "SELECT id, msg, slug FROM messages WHERE id = ?",
			args: [messageId],
		});
		
		if (messageResult.rows.length === 0) {
			console.error(`❌ Message not found with ID: ${messageId}`);
			process.exit(1);
		}
		
		const message = messageResult.rows[0];
		console.log(`📝 Found message:`);
		console.log(`   ID: ${message.id}`);
		console.log(`   Slug: ${message.slug}`);
		console.log(`   Preview: ${(message.msg as string).substring(0, 50)}...`);
		
		// Check for related records
		const authorCountResult = await rawClient.execute({
			sql: "SELECT COUNT(*) as count FROM message_authors WHERE messageId = ?",
			args: [messageId],
		});
		const authorCount = authorCountResult.rows[0].count as number;
		
		const statementCountResult = await rawClient.execute({
			sql: "SELECT COUNT(*) as count FROM statements WHERE promotedMessageId = ?",
			args: [messageId],
		});
		const statementCount = statementCountResult.rows[0].count as number;
		
		console.log(`\n📊 Related records:`);
		console.log(`   message_authors: ${authorCount}`);
		console.log(`   statements (promoted): ${statementCount}`);
		
		// Delete related records first
		console.log(`\n🗑️  Deleting related records...`);
		
		if (authorCount > 0) {
			await rawClient.execute({
				sql: "DELETE FROM message_authors WHERE messageId = ?",
				args: [messageId],
			});
			console.log(`   ✓ Deleted ${authorCount} author relationship(s)`);
		}
		
		if (statementCount > 0) {
			// Set promotedMessageId to NULL instead of deleting statements
			await rawClient.execute({
				sql: "UPDATE statements SET promotedMessageId = NULL WHERE promotedMessageId = ?",
				args: [messageId],
			});
			console.log(`   ✓ Cleared promotedMessageId from ${statementCount} statement(s)`);
		}
		
		// Finally, delete the message
		console.log(`\n🗑️  Deleting message...`);
		await rawClient.execute({
			sql: "DELETE FROM messages WHERE id = ?",
			args: [messageId],
		});
		
		console.log(`\n✅ Successfully deleted message ID ${messageId} (slug: ${message.slug})`);
		
	} catch (error) {
		console.error("❌ Error deleting message:", error);
		process.exit(1);
	}
}

// Get message identifier from command line args
const identifier = process.argv[2];

if (!identifier) {
	console.error("❌ Please provide a message ID or slug");
	console.error("Usage: pnpm tsx scripts/delete-message.ts <message-id-or-slug>");
	process.exit(1);
}

deleteMessage(identifier).then(() => {
	process.exit(0);
});

