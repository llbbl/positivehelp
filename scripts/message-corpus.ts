#!/usr/bin/env tsx
/** Read-only published-message export. Never imports application startup or migrations. */
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { createClient } from "@libsql/client";
import { loadEnvConfig } from "@next/env";

export const PUBLIC_ENDPOINT = "https://positive.help/api/messages";
export const PUBLIC_LIMIT = 100;
export const CORPUS_QUERY =
	"SELECT id, msg AS text, slug AS url, date FROM messages ORDER BY id";

export interface PublishedMessage {
	id: number;
	text: string;
	url: string;
	date: string;
}

export function validateMessages(value: unknown): PublishedMessage[] {
	if (!Array.isArray(value) || value.length === 0) {
		throw new Error("Published corpus must be a nonempty array.");
	}
	const ids = new Set<number>();
	const messages = value.map((row: unknown) => {
		if (typeof row !== "object" || row === null) {
			throw new Error("Malformed published message.");
		}
		const { id, text, url, date } = row as Record<string, unknown>;
		if (
			typeof id !== "number" ||
			!Number.isSafeInteger(id) ||
			id <= 0 ||
			typeof text !== "string" ||
			!text.trim() ||
			typeof url !== "string" ||
			!url.trim() ||
			typeof date !== "string" ||
			!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
			!Number.isFinite(Date.parse(date)) ||
			new Date(date).toISOString().slice(0, 10) !== date
		) {
			throw new Error("Malformed published message fields.");
		}
		if (ids.has(id)) throw new Error("Duplicate published message ID.");
		ids.add(id);
		return { id, text, url, date };
	});
	return messages.sort((a, b) => a.id - b.id);
}

export async function fetchPublicCorpus(
	fetcher: typeof fetch = fetch,
): Promise<PublishedMessage[]> {
	const endpoint = new URL(PUBLIC_ENDPOINT);
	endpoint.searchParams.set("limit", String(PUBLIC_LIMIT));
	endpoint.searchParams.set("t", String(Date.now()));
	const response = await fetcher(endpoint, {
		cache: "no-store",
		signal: AbortSignal.timeout(30_000),
	});
	if (!response.ok) {
		throw new Error(`Published API request failed (HTTP ${response.status}).`);
	}
	const messages = validateMessages(await response.json());
	if (messages.length >= PUBLIC_LIMIT) {
		throw new Error(
			"Public API reached its 100-message cap; completeness is unknown. Use explicit --database mode for a full read-only export.",
		);
	}
	return messages;
}

export async function readDatabaseCorpus(): Promise<PublishedMessage[]> {
	loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
	const url = process.env.TURSO_DATABASE_URL;
	const authToken = process.env.TURSO_AUTH_TOKEN;
	if (!url || !authToken) {
		throw new Error(
			"Database mode requires existing Turso environment credentials.",
		);
	}
	// Credentials and driver errors must never be included in a review artifact.
	try {
		const client = createClient({ url, authToken });
		try {
			const transaction = await client.transaction("read");
			try {
				const result = await transaction.execute(CORPUS_QUERY);
				return validateMessages(result.rows);
			} finally {
				await transaction.rollback();
				transaction.close();
			}
		} finally {
			client.close();
		}
	} catch {
		throw new Error(
			"Read-only published database export failed; no snapshot written.",
		);
	}
}

export function createSnapshot(
	rows: unknown,
	mode: "public" | "database",
	now = new Date(),
) {
	const messages = validateMessages(rows);
	if (mode === "public" && messages.length >= PUBLIC_LIMIT) {
		throw new Error("Cannot mark a capped public response as complete.");
	}
	return {
		schemaVersion: 1,
		capturedAt: now.toISOString(),
		source:
			mode === "public"
				? { mode, endpoint: PUBLIC_ENDPOINT }
				: { mode, table: "messages" },
		complete: true,
		completenessBasis:
			mode === "public"
				? "Unfiltered newest-message response below the API cap of 100."
				: "All published messages selected in a read transaction without a limit.",
		count: messages.length,
		digest: `sha256:${createHash("sha256").update(JSON.stringify(messages)).digest("hex")}`,
		messages,
	};
}

export async function writeSnapshot(
	output: string,
	snapshot: ReturnType<typeof createSnapshot>,
) {
	// Exclusive creation prevents destroying an earlier research run or unrelated file.
	await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`, {
		flag: "wx",
		mode: 0o600,
	});
}

export async function runCli(args = process.argv.slice(2)) {
	let output: string | undefined;
	let database = false;
	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--database" && !database) database = true;
		else if (
			args[i] === "--output" &&
			!output &&
			args[i + 1] &&
			!args[i + 1].startsWith("--")
		)
			output = args[++i];
		else
			throw new Error(
				"Usage: pnpm exec tsx scripts/message-corpus.ts --output <new-file.json> [--database]",
			);
	}
	if (!output) throw new Error("--output <new-file.json> is required.");
	const messages = database
		? await readDatabaseCorpus()
		: await fetchPublicCorpus();
	const snapshot = createSnapshot(messages, database ? "database" : "public");
	await writeSnapshot(output, snapshot);
	console.log(`Saved ${snapshot.count} published messages to ${output}.`);
}

if (require.main === module) {
	runCli().catch(() => {
		// Avoid dumping driver/network error objects, URLs, or environment values.
		console.error(
			"Corpus export failed. Check the output path or database configuration. A public response of 100 messages requires explicit --database mode for completeness. No existing file was overwritten.",
		);
		process.exitCode = 1;
	});
}
