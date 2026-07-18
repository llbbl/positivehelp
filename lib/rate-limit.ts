import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * In-memory rate limiter for single-instance deployments (e.g., Railway).
 *
 * This implementation uses a sliding window approach with automatic cleanup
 * of expired entries to prevent memory leaks.
 *
 * For multi-instance deployments, consider using Redis-based rate limiting
 * with @upstash/ratelimit instead.
 */

interface RateLimitRecord {
	count: number;
	windowStart: number;
}

interface RateLimitOptions {
	/** Stable name used to isolate counters for this policy */
	policy: string;
	/** Maximum number of requests allowed in the window */
	limit: number;
	/** Time window in milliseconds */
	windowMs: number;
}

// Store rate limit records per IP
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup interval (every 60 seconds)
const CLEANUP_INTERVAL_MS = 60 * 1000;
let lastCleanup = Date.now();

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(windowMs: number): void {
	const now = Date.now();

	// Only run cleanup periodically to avoid performance overhead
	if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
		return;
	}

	lastCleanup = now;

	for (const [key, record] of rateLimitStore.entries()) {
		if (now - record.windowStart > windowMs) {
			rateLimitStore.delete(key);
		}
	}
}

/**
 * Get the client IP address from request headers.
 *
 * Trust model: trusted reverse proxies append to the RIGHT of `x-forwarded-for`,
 * so the real client IP is the entry `TRUSTED_PROXY_HOPS` positions from the
 * right end. Railway adds one hop, so TRUSTED_PROXY_HOPS=1 (default) selects the
 * rightmost entry — the one Railway recorded — and ignores any client-supplied
 * entries to its left (which would otherwise allow a rate-limit bypass via a
 * forged XFF header). Set to 2 behind Cloudflare→Railway, or 0 for a
 * direct-to-origin deploy with no trusted proxy. With 0 trusted hops, both
 * forwarding headers are untrusted and the client identifier is "unknown";
 * Next's headers API does not expose the underlying socket address.
 */
export async function getClientIP(): Promise<string> {
	const parsed = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "1", 10);
	const trustedHops = Number.isFinite(parsed) ? Math.max(0, parsed) : 1;
	if (trustedHops === 0) {
		return "unknown";
	}

	const headersList = await headers();

	// x-forwarded-for is a comma-separated list; trusted proxies append on the
	// right, so the client IP is `trustedHops` entries from the right. Clamp into
	// range so short lists / oversized hop counts fall back to a defined entry.
	const forwarded = headersList.get("x-forwarded-for");
	if (forwarded) {
		const ips = forwarded.split(",").map((entry) => entry.trim());
		const index = Math.min(
			ips.length - 1,
			Math.max(0, ips.length - trustedHops),
		);
		return ips[index];
	}

	// Fallback headers
	const realIp = headersList.get("x-real-ip");
	if (realIp) {
		return realIp;
	}

	// Default fallback
	return "unknown";
}

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier for the client (usually IP address)
 * @param options - Rate limit configuration
 * @returns Object with allowed status and rate limit info
 */
export function checkRateLimit(
	identifier: string,
	options: RateLimitOptions,
): {
	allowed: boolean;
	remaining: number;
	resetAt: number;
} {
	const { policy, limit, windowMs } = options;
	const now = Date.now();
	const storeKey = `${policy}:${identifier}`;

	// Perform periodic cleanup
	cleanupExpiredEntries(windowMs);

	const record = rateLimitStore.get(storeKey);

	// No existing record or window has expired - create new window
	if (!record || now - record.windowStart > windowMs) {
		rateLimitStore.set(storeKey, { count: 1, windowStart: now });
		return {
			allowed: true,
			remaining: limit - 1,
			resetAt: now + windowMs,
		};
	}

	// Check if limit exceeded
	if (record.count >= limit) {
		return {
			allowed: false,
			remaining: 0,
			resetAt: record.windowStart + windowMs,
		};
	}

	// Increment counter
	record.count++;

	return {
		allowed: true,
		remaining: limit - record.count,
		resetAt: record.windowStart + windowMs,
	};
}

/**
 * Create a rate-limited response with appropriate headers
 */
export function createRateLimitedResponse(resetAt: number): NextResponse {
	const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);

	return NextResponse.json(
		{
			error: "Too many requests",
			code: "RATE_LIMIT_EXCEEDED",
			retryAfter,
		},
		{
			status: 429,
			headers: {
				"Retry-After": String(retryAfter),
				"X-RateLimit-Remaining": "0",
				"X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
			},
		},
	);
}

/**
 * Add rate limit headers to a successful response
 */
export function addRateLimitHeaders(
	response: NextResponse,
	remaining: number,
	resetAt: number,
	limit: number,
): NextResponse {
	response.headers.set("X-RateLimit-Limit", String(limit));
	response.headers.set("X-RateLimit-Remaining", String(remaining));
	response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
	return response;
}

// Default rate limit configurations for different route types
export const RATE_LIMITS = {
	// Public read endpoints - generous limits
	PUBLIC_READ: { policy: "public-read", limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute

	// Authenticated write endpoints - moderate limits
	AUTHENTICATED_WRITE: {
		policy: "authenticated-write",
		limit: 30,
		windowMs: 60 * 1000,
	}, // 30 requests per minute

	// Admin endpoints - still limited but higher
	ADMIN: { policy: "admin", limit: 60, windowMs: 60 * 1000 }, // 60 requests per minute

	// Sensitive endpoints (token creation) - stricter limits
	SENSITIVE: { policy: "sensitive", limit: 10, windowMs: 60 * 1000 }, // 10 requests per minute
} as const;

/**
 * Apply rate limiting to an API route handler
 *
 * @example
 * ```ts
 * export async function GET(request: Request) {
 *   const rateLimitResult = await applyRateLimit(RATE_LIMITS.PUBLIC_READ);
 *   if (rateLimitResult) return rateLimitResult;
 *
 *   // ... rest of handler
 * }
 * ```
 */
export async function applyRateLimit(
	options: RateLimitOptions,
): Promise<NextResponse | null> {
	const ip = await getClientIP();
	const { allowed, resetAt } = checkRateLimit(ip, options);

	if (!allowed) {
		return createRateLimitedResponse(resetAt);
	}

	// Return null to indicate request is allowed
	return null;
}

// Export store size for testing/monitoring purposes
export function getRateLimitStoreSize(): number {
	return rateLimitStore.size;
}

// Export for testing purposes only
export function clearRateLimitStore(): void {
	rateLimitStore.clear();
}
