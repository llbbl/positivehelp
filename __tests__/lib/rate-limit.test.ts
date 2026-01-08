import { describe, it, expect, beforeEach, jest } from "@jest/globals";

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
import {
	checkRateLimit,
	clearRateLimitStore,
	getRateLimitStoreSize,
	RATE_LIMITS,
} from "@/lib/rate-limit";

describe("rate-limit", () => {
	beforeEach(() => {
		// Clear the rate limit store before each test
		clearRateLimitStore();
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
