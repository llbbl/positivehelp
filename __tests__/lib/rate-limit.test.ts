import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

// Mock Next.js modules before importing rate-limit
jest.mock("next/headers", () => ({
	headers: jest.fn(),
}));

jest.mock("next/server", () => ({
	NextResponse: {
		json: jest.fn(
			(body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
				body,
				status: init?.status || 200,
				headers: {
					set: jest.fn(),
					get: jest.fn(),
				},
			}),
		),
		next: jest.fn(() => ({
			headers: {
				set: jest.fn(),
				get: jest.fn(),
			},
		})),
	},
}));

// Import after mocking
import { headers } from "next/headers";
import {
	checkRateLimit,
	clearRateLimitStore,
	getClientIP,
	getRateLimitStoreSize,
	RATE_LIMITS,
} from "@/lib/rate-limit";

describe("rate-limit", () => {
	beforeEach(() => {
		// Clear the rate limit store before each test
		clearRateLimitStore();
	});

	describe("getClientIP", () => {
		const originalTrustedHops = process.env.TRUSTED_PROXY_HOPS;

		beforeEach(() => {
			delete process.env.TRUSTED_PROXY_HOPS;
		});

		afterEach(() => {
			if (originalTrustedHops === undefined) {
				delete process.env.TRUSTED_PROXY_HOPS;
			} else {
				process.env.TRUSTED_PROXY_HOPS = originalTrustedHops;
			}
			jest.mocked(headers).mockReset();
		});

		it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
			jest.mocked(headers).mockResolvedValue(
				new Map([["x-real-ip", "203.0.113.7"]]) as unknown as Awaited<
					ReturnType<typeof headers>
				>,
			);
			const ip = await getClientIP();
			expect(ip).toBe("203.0.113.7");
		});

		it("returns 'unknown' when no headers are present", async () => {
			jest.mocked(headers).mockResolvedValue(
				new Map() as unknown as Awaited<ReturnType<typeof headers>>,
			);
			const ip = await getClientIP();
			expect(ip).toBe("unknown");
		});

		it("underflows to leftmost for a single XFF entry with TRUSTED_PROXY_HOPS=1", async () => {
			process.env.TRUSTED_PROXY_HOPS = "1";
			jest.mocked(headers).mockResolvedValue(
				new Map([["x-forwarded-for", "1.2.3.4"]]) as unknown as Awaited<
					ReturnType<typeof headers>
				>,
			);
			const ip = await getClientIP();
			expect(ip).toBe("1.2.3.4");
		});

		it("returns the single entry with TRUSTED_PROXY_HOPS=0", async () => {
			process.env.TRUSTED_PROXY_HOPS = "0";
			jest.mocked(headers).mockResolvedValue(
				new Map([["x-forwarded-for", "1.2.3.4"]]) as unknown as Awaited<
					ReturnType<typeof headers>
				>,
			);
			const ip = await getClientIP();
			expect(ip).toBe("1.2.3.4");
		});

		it("returns the rightmost (Railway-recorded) entry for two XFF entries with TRUSTED_PROXY_HOPS=1", async () => {
			process.env.TRUSTED_PROXY_HOPS = "1";
			jest.mocked(headers).mockResolvedValue(
				new Map([["x-forwarded-for", "1.2.3.4, 5.6.7.8"]]) as unknown as Awaited<
					ReturnType<typeof headers>
				>,
			);
			const ip = await getClientIP();
			expect(ip).toBe("5.6.7.8");
		});

		it("ignores a client-spoofed leading XFF entry (rate-limit anti-bypass)", async () => {
			// Attacker sends "9.9.9.9"; Railway appends the real socket IP on the
			// right. With one trusted hop we must key on the real IP, not the spoof.
			jest.mocked(headers).mockResolvedValue(
				new Map([
					["x-forwarded-for", "9.9.9.9, 203.0.113.5"],
				]) as unknown as Awaited<ReturnType<typeof headers>>,
			);
			const ip = await getClientIP();
			expect(ip).toBe("203.0.113.5");
		});

		it("selects the client entry behind two trusted hops (Cloudflare→Railway)", async () => {
			process.env.TRUSTED_PROXY_HOPS = "2";
			// spoof, real client (added by CF), CF ip (added by Railway)
			jest.mocked(headers).mockResolvedValue(
				new Map([
					["x-forwarded-for", "9.9.9.9, 203.0.113.5, 10.0.0.1"],
				]) as unknown as Awaited<ReturnType<typeof headers>>,
			);
			const ip = await getClientIP();
			expect(ip).toBe("203.0.113.5");
		});

		it("returns the leftmost entry for two XFF entries with TRUSTED_PROXY_HOPS=2", async () => {
			process.env.TRUSTED_PROXY_HOPS = "2";
			jest.mocked(headers).mockResolvedValue(
				new Map([["x-forwarded-for", "1.2.3.4, 5.6.7.8"]]) as unknown as Awaited<
					ReturnType<typeof headers>
				>,
			);
			const ip = await getClientIP();
			expect(ip).toBe("1.2.3.4");
		});

		it("trims extra whitespace in malformed XFF entries", async () => {
			process.env.TRUSTED_PROXY_HOPS = "1";
			jest.mocked(headers).mockResolvedValue(
				new Map([["x-forwarded-for", " 1.2.3.4 , 5.6.7.8 "]]) as unknown as Awaited<
					ReturnType<typeof headers>
				>,
			);
			const ip = await getClientIP();
			expect(ip).toBe("5.6.7.8");
		});

		it("defaults to 1 hop when TRUSTED_PROXY_HOPS is not set", async () => {
			jest.mocked(headers).mockResolvedValue(
				new Map([["x-forwarded-for", "1.2.3.4, 5.6.7.8"]]) as unknown as Awaited<
					ReturnType<typeof headers>
				>,
			);
			const ip = await getClientIP();
			expect(ip).toBe("5.6.7.8");
		});

		it("uses 0 when TRUSTED_PROXY_HOPS=0 (critical case)", async () => {
			process.env.TRUSTED_PROXY_HOPS = "0";
			jest.mocked(headers).mockResolvedValue(
				new Map([["x-forwarded-for", "1.2.3.4, 5.6.7.8"]]) as unknown as Awaited<
					ReturnType<typeof headers>
				>,
			);
			const ip = await getClientIP();
			expect(ip).toBe("5.6.7.8");
		});

		it("falls back to 1 when TRUSTED_PROXY_HOPS is invalid", async () => {
			process.env.TRUSTED_PROXY_HOPS = "invalid";
			jest.mocked(headers).mockResolvedValue(
				new Map([["x-forwarded-for", "1.2.3.4, 5.6.7.8"]]) as unknown as Awaited<
					ReturnType<typeof headers>
				>,
			);
			const ip = await getClientIP();
			expect(ip).toBe("5.6.7.8");
		});
	});

	describe("checkRateLimit", () => {
		it("should allow requests within the limit", () => {
			const options = { limit: 5, windowMs: 60000 };

			// First 5 requests should be allowed
			for (let i = 0; i < 5; i++) {
				const result = checkRateLimit("test-ip", options);
				expect(result.allowed).toBe(true);
				expect(result.remaining).toBe(4 - i);
			}
		});

		it("should block requests exceeding the limit", () => {
			const options = { limit: 3, windowMs: 60000 };

			// Use up the limit
			for (let i = 0; i < 3; i++) {
				checkRateLimit("test-ip-2", options);
			}

			// 4th request should be blocked
			const result = checkRateLimit("test-ip-2", options);
			expect(result.allowed).toBe(false);
			expect(result.remaining).toBe(0);
		});

		it("should track different IPs separately", () => {
			const options = { limit: 2, windowMs: 60000 };

			// Use up limit for IP 1
			checkRateLimit("ip-1", options);
			checkRateLimit("ip-1", options);
			const result1 = checkRateLimit("ip-1", options);
			expect(result1.allowed).toBe(false);

			// IP 2 should still have requests available
			const result2 = checkRateLimit("ip-2", options);
			expect(result2.allowed).toBe(true);
			expect(result2.remaining).toBe(1);
		});

		it("should provide correct resetAt timestamp", () => {
			const options = { limit: 5, windowMs: 60000 };
			const beforeTime = Date.now();

			const result = checkRateLimit("test-ip-reset", options);

			expect(result.resetAt).toBeGreaterThanOrEqual(beforeTime + options.windowMs);
			expect(result.resetAt).toBeLessThanOrEqual(Date.now() + options.windowMs + 10);
		});

		it("should correctly calculate remaining requests", () => {
			const options = { limit: 10, windowMs: 60000 };

			const result1 = checkRateLimit("test-ip-remaining", options);
			expect(result1.remaining).toBe(9);

			const result2 = checkRateLimit("test-ip-remaining", options);
			expect(result2.remaining).toBe(8);

			const result3 = checkRateLimit("test-ip-remaining", options);
			expect(result3.remaining).toBe(7);
		});
	});

	describe("RATE_LIMITS configuration", () => {
		it("should have PUBLIC_READ with generous limits", () => {
			expect(RATE_LIMITS.PUBLIC_READ.limit).toBe(100);
			expect(RATE_LIMITS.PUBLIC_READ.windowMs).toBe(60000);
		});

		it("should have AUTHENTICATED_WRITE with moderate limits", () => {
			expect(RATE_LIMITS.AUTHENTICATED_WRITE.limit).toBe(30);
			expect(RATE_LIMITS.AUTHENTICATED_WRITE.windowMs).toBe(60000);
		});

		it("should have ADMIN with higher limits", () => {
			expect(RATE_LIMITS.ADMIN.limit).toBe(60);
			expect(RATE_LIMITS.ADMIN.windowMs).toBe(60000);
		});

		it("should have SENSITIVE with strict limits", () => {
			expect(RATE_LIMITS.SENSITIVE.limit).toBe(10);
			expect(RATE_LIMITS.SENSITIVE.windowMs).toBe(60000);
		});
	});

	describe("clearRateLimitStore", () => {
		it("should clear all entries from the store", () => {
			const options = { limit: 10, windowMs: 60000 };

			// Add some entries
			checkRateLimit("ip-a", options);
			checkRateLimit("ip-b", options);
			checkRateLimit("ip-c", options);

			expect(getRateLimitStoreSize()).toBe(3);

			clearRateLimitStore();

			expect(getRateLimitStoreSize()).toBe(0);
		});
	});

	describe("getRateLimitStoreSize", () => {
		it("should return correct count of entries", () => {
			const options = { limit: 10, windowMs: 60000 };

			expect(getRateLimitStoreSize()).toBe(0);

			checkRateLimit("ip-1", options);
			expect(getRateLimitStoreSize()).toBe(1);

			checkRateLimit("ip-2", options);
			expect(getRateLimitStoreSize()).toBe(2);

			// Same IP shouldn't increase count
			checkRateLimit("ip-1", options);
			expect(getRateLimitStoreSize()).toBe(2);
		});
	});
});
