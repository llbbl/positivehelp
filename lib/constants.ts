/**
 * Application-wide constants
 */

/**
 * Polling interval for fetching new messages (in milliseconds)
 */
export const MESSAGE_POLL_INTERVAL_MS = 30000;

/**
 * Cache max age for API responses (in seconds)
 */
export const CACHE_MAX_AGE_SECONDS = 300;

/**
 * Submission status codes
 */
export const SUBMISSION_STATUS = {
	PENDING: 1,
	DENIED: 0,
	APPROVED: 2,
} as const;

