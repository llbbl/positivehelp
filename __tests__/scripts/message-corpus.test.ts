/** @vitest-environment node */

import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { loadEnvConfig } from "@next/env";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	CORPUS_QUERY,
	createSnapshot,
	fetchPublicCorpus,
	readDatabaseCorpus,
	runCli,
	validateMessages,
	writeSnapshot,
} from "../../scripts/message-corpus";

vi.mock("@libsql/client", () => ({ createClient: vi.fn() }));
vi.mock("@next/env", () => ({ loadEnvConfig: vi.fn() }));

const message = {
	id: 1,
	text: "A positive message.",
	url: "a-positive-message",
	date: "2026-10-18",
};
const response = (body: unknown, status = 200) =>
	vi
		.fn()
		.mockResolvedValue({ ok: status === 200, status, json: async () => body });

describe("public published corpus", () => {
	it("accepts a short collection and requests an uncached maximum page", async () => {
		const fetcher = response([message]);
		await expect(fetchPublicCorpus(fetcher)).resolves.toEqual([message]);
		const [url, options] = fetcher.mock.calls[0];
		expect(url.origin).toBe("https://positive.help");
		expect(url.searchParams.get("limit")).toBe("100");
		expect(url.searchParams.has("t")).toBe(true);
		expect(options.cache).toBe("no-store");
	});

	it("fails closed at the API cap", async () => {
		const rows = Array.from({ length: 100 }, (_, i) => ({
			...message,
			id: i + 1,
		}));
		await expect(fetchPublicCorpus(response(rows))).rejects.toThrow(
			"completeness is unknown",
		);
	});

	it.each([
		[],
		{},
		{ error: "unavailable" },
		[null],
		[{ ...message, text: " " }],
		[{ ...message, id: 1.5 }],
		[{ ...message, date: "2026-02-30" }],
		[message, message],
	])("rejects an invalid corpus: %j", async (body) => {
		await expect(fetchPublicCorpus(response(body))).rejects.toThrow();
	});

	it("rejects failed HTTP responses even when the body looks valid", async () => {
		await expect(fetchPublicCorpus(response([message], 503))).rejects.toThrow(
			"HTTP 503",
		);
	});

	it("rejects invalid JSON and transport errors", async () => {
		await expect(
			fetchPublicCorpus(
				vi.fn().mockResolvedValue({
					ok: true,
					json: async () => {
						throw new Error("invalid JSON");
					},
				}),
			),
		).rejects.toThrow();
		await expect(
			fetchPublicCorpus(vi.fn().mockRejectedValue(new Error("offline"))),
		).rejects.toThrow();
	});
});

describe("snapshot artifact", () => {
	it("cannot label a capped public response complete even when called directly", () => {
		const rows = Array.from({ length: 100 }, (_, i) => ({
			...message,
			id: i + 1,
		}));
		expect(() => createSnapshot(rows, "public")).toThrow(
			"Cannot mark a capped",
		);
		expect(createSnapshot(rows, "database").count).toBe(100);
	});
	it("records stable canonical content digest, count, source, timestamp and completeness", () => {
		const second = { ...message, id: 2 };
		const snapshot = createSnapshot(
			[second, message],
			"public",
			new Date("2026-10-18T10:00:00Z"),
		);
		expect(snapshot).toMatchObject({
			schemaVersion: 1,
			capturedAt: "2026-10-18T10:00:00.000Z",
			source: {
				mode: "public",
				endpoint: "https://positive.help/api/messages",
			},
			complete: true,
			count: 2,
			messages: [message, second],
		});
		expect(snapshot.digest).toBe(
			`sha256:${createHash("sha256")
				.update(JSON.stringify([message, second]))
				.digest("hex")}`,
		);
		expect(createSnapshot([message, second], "database").digest).toBe(
			snapshot.digest,
		);
		expect(
			validateMessages([{ ...message, privateField: "excluded" }]),
		).toEqual([message]);
	});

	it("creates a new artifact and refuses to overwrite it", async () => {
		const directory = await mkdtemp(join(tmpdir(), "positivehelp-corpus-"));
		const output = join(directory, "corpus.json");
		try {
			const snapshot = createSnapshot([message], "public");
			await writeSnapshot(output, snapshot);
			await expect(
				writeSnapshot(
					output,
					createSnapshot([{ ...message, id: 2 }], "public"),
				),
			).rejects.toMatchObject({ code: "EEXIST" });
			expect(JSON.parse(await readFile(output, "utf8"))).toEqual(snapshot);
		} finally {
			await rm(directory, { recursive: true, force: true });
		}
	});

	it.each([[], ["--output"], ["--unknown"], ["--database"]])(
		"requires an explicit valid output argument: %j",
		async (...args) => {
			await expect(runCli(args.flat())).rejects.toThrow();
		},
	);
});

describe("explicit read-only database export", () => {
	const previousUrl = process.env.TURSO_DATABASE_URL;
	const previousToken = process.env.TURSO_AUTH_TOKEN;
	afterEach(() => {
		if (previousUrl === undefined) delete process.env.TURSO_DATABASE_URL;
		else process.env.TURSO_DATABASE_URL = previousUrl;
		if (previousToken === undefined) delete process.env.TURSO_AUTH_TOKEN;
		else process.env.TURSO_AUTH_TOKEN = previousToken;
		vi.clearAllMocks();
	});

	it("only selects published fields in a read transaction and closes both handles", async () => {
		process.env.TURSO_DATABASE_URL = "libsql://example.invalid";
		process.env.TURSO_AUTH_TOKEN = "secret-not-for-artifacts";
		const transaction = {
			execute: vi.fn().mockResolvedValue({ rows: [message] }),
			rollback: vi.fn(),
			close: vi.fn(),
		};
		const client = {
			transaction: vi.fn().mockResolvedValue(transaction),
			close: vi.fn(),
		};
		vi.mocked(createClient).mockReturnValue(
			client as unknown as ReturnType<typeof createClient>,
		);
		await expect(readDatabaseCorpus()).resolves.toEqual([message]);
		expect(loadEnvConfig).toHaveBeenCalled();
		expect(client.transaction).toHaveBeenCalledWith("read");
		expect(transaction.execute).toHaveBeenCalledTimes(1);
		expect(transaction.execute).toHaveBeenCalledWith(CORPUS_QUERY);
		expect(transaction.rollback).toHaveBeenCalledTimes(1);
		expect(transaction.close).toHaveBeenCalledTimes(1);
		expect(client.close).toHaveBeenCalledTimes(1);
	});

	it("sanitizes driver errors and still closes the connection", async () => {
		process.env.TURSO_DATABASE_URL = "libsql://example.invalid";
		process.env.TURSO_AUTH_TOKEN = "secret-not-for-artifacts";
		const client = {
			transaction: vi
				.fn()
				.mockRejectedValue(new Error("secret-not-for-artifacts")),
			close: vi.fn(),
		};
		vi.mocked(createClient).mockReturnValue(
			client as unknown as ReturnType<typeof createClient>,
		);
		await expect(readDatabaseCorpus()).rejects.toThrow(
			"Read-only published database export failed; no snapshot written.",
		);
		expect(client.close).toHaveBeenCalledTimes(1);
	});

	it("requires credentials before opening a connection", async () => {
		delete process.env.TURSO_DATABASE_URL;
		delete process.env.TURSO_AUTH_TOKEN;
		await expect(readDatabaseCorpus()).rejects.toThrow(
			"requires existing Turso",
		);
		expect(createClient).not.toHaveBeenCalled();
	});
});
