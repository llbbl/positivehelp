/**
 * Application-wide constants
 */

/**
 * Polling interval for fetching new messages (in milliseconds)
 */
export const MESSAGE_POLL_INTERVAL_MS = 30000;

/**
 * Default and maximum number of messages returned by the collection endpoint.
 */
export const MESSAGE_PAGE_SIZE = 50;
export const MESSAGE_MAX_PAGE_SIZE = 100;

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

export type ApprovalResult =
	| "approved"
	| "already-approved"
	| "already-rejected"
	| "conflict"
	| "not-found";

export function getApprovalResult(
	wasClaimed: boolean,
	currentStatus?: number,
): ApprovalResult {
	if (wasClaimed) {
		return "approved";
	}
	if (currentStatus === undefined) {
		return "not-found";
	}
	if (currentStatus === SUBMISSION_STATUS.APPROVED) {
		return "already-approved";
	}
	return currentStatus === SUBMISSION_STATUS.DENIED
		? "already-rejected"
		: "conflict";
}

export type RejectionTransition = "reject" | "already-rejected" | "conflict";
export type RejectionResult =
	| "rejected"
	| "already-rejected"
	| "conflict"
	| "not-found";

export function getRejectionTransition(status: number): RejectionTransition {
	switch (status) {
		case SUBMISSION_STATUS.PENDING:
			return "reject";
		case SUBMISSION_STATUS.DENIED:
			return "already-rejected";
		default:
			return "conflict";
	}
}

export function getRejectionResult(
	wasUpdated: boolean,
	currentStatus?: number,
): RejectionResult {
	if (wasUpdated) {
		return "rejected";
	}
	if (currentStatus === undefined) {
		return "not-found";
	}
	return getRejectionTransition(currentStatus) === "already-rejected"
		? "already-rejected"
		: "conflict";
}
