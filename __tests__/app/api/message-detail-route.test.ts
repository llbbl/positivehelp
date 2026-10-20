/** @vitest-environment node */
import type { ResultSet } from "@libsql/client";
import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/messages/[slug]/route";
import client from "@/lib/db";
import logger from "@/lib/logger";
import { applyRateLimit } from "@/lib/rate-limit";

vi.mock("@/lib/db", () => ({ default: { execute: vi.fn() } }));
vi.mock("@/lib/logger", () => ({
	default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@/lib/rate-limit", () => ({
	applyRateLimit: vi.fn(),
	RATE_LIMITS: { PUBLIC_READ: {} },
}));

let now: number;
const uuid =
	/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const result = (rows: unknown[]) => ({ rows }) as ResultSet;
const request = () =>
	new NextRequest(
		"https://positive.help/api/messages/example?private=not-for-timing",
		{ headers: { "X-Message-Request-Id": "untrusted-id" } },
	);
const run = (slug = "example") =>
	GET(request(), { params: Promise.resolve({ slug }) });
const detail = {
	id: 4,
	text: "Keep going",
	date: "2026-10-20",
	url: "example",
	authors: '[{"id":2,"name":"Anonymous"}]',
};

beforeEach(() => {
	vi.resetAllMocks();
	now = 100;
	vi.spyOn(performance, "now").mockImplementation(() => now);
	vi.mocked(applyRateLimit).mockImplementation(async () => {
		await Promise.resolve();
		now += 5;
		return null;
	});
	const fixtures = [
		[{ id: 4 }],
		[{ prevSlug: "before", nextSlug: null }],
		[detail],
	];
	for (const [i, rows] of fixtures.entries()) {
		vi.mocked(client.execute).mockImplementationOnce(async () => {
			await Promise.resolve();
			now += [11, 13, 17][i];
			return result(rows);
		});
	}
});
afterEach(() => vi.restoreAllMocks());

describe("message detail timing", () => {
	it("measures awaited reads, retains the response, and correlates with a generated ID", async () => {
		const response = await run();
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			...detail,
			authors: [{ id: 2, name: "Anonymous" }],
			navigation: { prevSlug: "before", nextSlug: null },
		});
		expect(response.headers.get("Server-Timing")).toBe(
			"rate_limit;dur=5.0, lookup;dur=11.0, navigation;dur=13.0, message;dur=17.0, total;dur=46.0",
		);
		const requestId = response.headers.get("X-Message-Request-Id");
		expect(requestId).toMatch(uuid);
		expect(logger.info).toHaveBeenCalledWith("message_api_timing", {
			requestId,
			status: 200,
			timings: {
				rate_limit: 5,
				lookup: 11,
				navigation: 13,
				message: 17,
				total: 46,
			},
		});
		expect(client.execute).toHaveBeenCalledTimes(3);
		for (const [i, args] of [["example"], [4, 4], ["example"]].entries()) {
			expect(client.execute).toHaveBeenNthCalledWith(
				i + 1,
				expect.objectContaining({ args }),
			);
		}
	});

	it("preserves rate-limit status, body, and retry headers without querying the DB", async () => {
		vi.mocked(applyRateLimit).mockImplementation(async () => {
			now += 7;
			return NextResponse.json(
				{ error: "Too many requests" },
				{
					status: 429,
					headers: { "Retry-After": "12", "X-RateLimit-Remaining": "0" },
				},
			);
		});
		const response = await run();
		expect(response.status).toBe(429);
		expect(await response.json()).toEqual({ error: "Too many requests" });
		expect(response.headers.get("Retry-After")).toBe("12");
		expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
		expect(response.headers.get("Server-Timing")).toBe(
			"rate_limit;dur=7.0, total;dur=7.0",
		);
		expect(client.execute).not.toHaveBeenCalled();
	});

	it("keeps timing and IDs isolated between requests, including a missing message", async () => {
		const first = await run();
		vi.mocked(client.execute).mockImplementationOnce(async () => {
			now += 19;
			return result([]);
		});
		const missing = await run("missing");
		expect(missing.status).toBe(404);
		expect(await missing.json()).toEqual({ error: "Message not found" });
		expect(missing.headers.get("Server-Timing")).toBe(
			"rate_limit;dur=5.0, lookup;dur=19.0, total;dur=24.0",
		);
		expect(missing.headers.get("X-Message-Request-Id")).toMatch(uuid);
		expect(missing.headers.get("X-Message-Request-Id")).not.toBe(
			first.headers.get("X-Message-Request-Id"),
		);
		expect(client.execute).toHaveBeenCalledTimes(4);
	});

	it.each([0, 1, 2])(
		"records the failed read's wait time without exposing its error (read %i)",
		async (failedIndex) => {
			vi.mocked(client.execute).mockReset();
			const rows = [[{ id: 4 }], [{ prevSlug: null, nextSlug: null }]];
			for (let i = 0; i < failedIndex; i++)
				vi.mocked(client.execute).mockResolvedValueOnce(result(rows[i]));
			vi.mocked(client.execute).mockImplementationOnce(async () => {
				await Promise.resolve();
				now += 23;
				throw new Error("private database error");
			});
			const response = await run();
			expect(response.status).toBe(500);
			expect(await response.json()).toEqual({ error: "Internal server error" });
			const phase = ["lookup", "navigation", "message"][failedIndex];
			expect(response.headers.get("Server-Timing")).toContain(
				`${phase};dur=23.0`,
			);
			expect(response.headers.get("Server-Timing")).toContain("total;dur=28.0");
			expect(response.headers.get("X-Message-Request-Id")).toMatch(uuid);
			expect(client.execute).toHaveBeenCalledTimes(failedIndex + 1);
			expect(logger.info).toHaveBeenCalledWith(
				"message_api_timing",
				expect.objectContaining({
					status: 500,
					timings: expect.objectContaining({ [phase]: 23 }),
				}),
			);
		},
	);
});
