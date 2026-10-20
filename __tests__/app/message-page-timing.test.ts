/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateMetadata } from "@/app/msg/[slug]/page";
import logger from "@/lib/logger";
import { MessageFetchError } from "@/lib/message-fetch";

vi.mock("@/lib/logger", () => ({ default: { info: vi.fn(), error: vi.fn() } }));
vi.mock("@/app/msg/[slug]/message-display", () => ({ default: () => null }));
const requestId = "a9864b72-7a66-4d9c-9d70-1b5815a42fce";
let now: number;
const fetchMock = vi.fn<typeof fetch>();
const load = () =>
	generateMetadata({ params: Promise.resolve({ slug: "sample" }) });

beforeEach(() => {
	vi.resetAllMocks();
	now = 100;
	vi.spyOn(performance, "now").mockImplementation(() => now);
	vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

function responseWithTiming(status: number, id = requestId) {
	const response = new Response(null, {
		status,
		headers: { "X-Message-Request-Id": id },
	});
	vi.spyOn(response, "json").mockImplementation(async () => {
		await Promise.resolve();
		now += 8;
		return {
			id: 1,
			text: "Keep going",
			authors: [{ id: 2, name: "Anonymous" }],
			date: "2026-10-20",
		};
	});
	fetchMock.mockImplementation(async () => {
		await Promise.resolve();
		now += 40;
		return response;
	});
	return response;
}

describe("message page fetch timing", () => {
	it("correlates API and page work, measures body parsing separately, and retains no-store fetch", async () => {
		responseWithTiming(200);
		const metadata = await load();
		expect(metadata.title).toBe("Keep going | positive.help");
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringMatching(/\/api\/messages\/sample$/),
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
				cache: "no-store",
			},
		);
		expect(logger.info).toHaveBeenCalledWith("message_page_fetch_timing", {
			requestId,
			status: 200,
			outcome: "found",
			timings: { fetch: 40, parse: 8, total: 48 },
		});
	});

	it("retains missing-message metadata and records no parsing for a 404", async () => {
		const response = responseWithTiming(404);
		expect((await load()).robots).toBe("noindex,nofollow");
		expect(response.json).not.toHaveBeenCalled();
		expect(logger.info).toHaveBeenCalledWith("message_page_fetch_timing", {
			requestId,
			status: 404,
			outcome: "not-found",
			timings: { fetch: 40, total: 40 },
		});
	});

	it.each([429, 500, 503])(
		"records HTTP %i without treating it as missing content",
		async (status) => {
			const response = responseWithTiming(status);
			await expect(load()).rejects.toBeInstanceOf(MessageFetchError);
			expect(response.json).not.toHaveBeenCalled();
			expect(logger.info).toHaveBeenCalledWith("message_page_fetch_timing", {
				requestId,
				status,
				outcome: "error",
				timings: { fetch: 40, total: 40 },
			});
		},
	);

	it("records failed network waits and preserves the original failure", async () => {
		const error = new Error("connection failed");
		fetchMock.mockImplementation(async () => {
			await Promise.resolve();
			now += 51;
			throw error;
		});
		await expect(load()).rejects.toBe(error);
		expect(logger.info).toHaveBeenCalledWith("message_page_fetch_timing", {
			requestId: undefined,
			status: undefined,
			outcome: "error",
			timings: { fetch: 51, total: 51 },
		});
	});

	it("records body failures and rejects arbitrary correlation header text", async () => {
		const response = responseWithTiming(200, "not-a-uuid-sensitive-value");
		const error = new SyntaxError("invalid JSON");
		vi.mocked(response.json).mockImplementation(async () => {
			now += 9;
			throw error;
		});
		await expect(load()).rejects.toBe(error);
		expect(logger.info).toHaveBeenCalledWith("message_page_fetch_timing", {
			requestId: undefined,
			status: 200,
			outcome: "error",
			timings: { fetch: 40, parse: 9, total: 49 },
		});
	});
});
