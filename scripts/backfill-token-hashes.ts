#!/usr/bin/env tsx
// Run with: pnpm exec tsx scripts/backfill-token-hashes.ts
//
// Data backfill for GH #251: hashes existing plaintext `ph_` tokens in the
// api_tokens.token column in place so they match the new at-rest format
// (SHA-256 hex digest). The schema migration is a no-op since the column
// type is unchanged (still `text`). Idempotent: rows whose token already
// starts with `ph_` are hashed; rows that are already hashes (no `ph_`
// prefix) are skipped, so running this twice is safe.

import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { apiTokens } from "../db/schema";
import { hashToken } from "../lib/tokens";

async function backfillTokenHashes(): Promise<void> {
	const rows = await db
		.select({ id: apiTokens.id, token: apiTokens.token })
		.from(apiTokens);

	const toBackfill = rows.filter((row) => row.token.startsWith("ph_"));

	if (toBackfill.length === 0) {
		console.log("✅ No plaintext tokens to backfill.");
		return;
	}

	console.log(`Found ${toBackfill.length} plaintext token(s) to hash...`);

	await db.transaction(async (tx) => {
		for (const row of toBackfill) {
			const tokenHash = hashToken(row.token);
			await tx
				.update(apiTokens)
				.set({ token: tokenHash })
				.where(eq(apiTokens.id, row.id));
		}
	});

	console.log(`✅ Hashed ${toBackfill.length} of ${rows.length} api_tokens row(s).`);
}

backfillTokenHashes()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("❌ Error backfilling token hashes:", error);
		process.exit(1);
	});