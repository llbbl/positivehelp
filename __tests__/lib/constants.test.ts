import { describe, expect, it } from "@jest/globals";
import {
	getApprovalResult,
	getRejectionResult,
	getRejectionTransition,
	SUBMISSION_STATUS,
} from "@/lib/constants";

describe("getApprovalResult", () => {
	it("reports a successful atomic claim", () => {
		expect(getApprovalResult(true)).toBe("approved");
	});

	it("distinguishes missing, idempotent, denied, and lost-race outcomes", () => {
		expect(getApprovalResult(false)).toBe("not-found");
		expect(getApprovalResult(false, SUBMISSION_STATUS.APPROVED)).toBe(
			"already-approved",
		);
		expect(getApprovalResult(false, SUBMISSION_STATUS.DENIED)).toBe(
			"already-rejected",
		);
		expect(getApprovalResult(false, SUBMISSION_STATUS.PENDING)).toBe(
			"conflict",
		);
	});
});

describe("getRejectionTransition", () => {
	it("allows pending submissions to be rejected", () => {
		expect(getRejectionTransition(SUBMISSION_STATUS.PENDING)).toBe("reject");
	});

	it("treats already-rejected submissions as idempotent", () => {
		expect(getRejectionTransition(SUBMISSION_STATUS.DENIED)).toBe(
			"already-rejected",
		);
	});

	it("rejects approved and unknown status transitions", () => {
		expect(getRejectionTransition(SUBMISSION_STATUS.APPROVED)).toBe("conflict");
		expect(getRejectionTransition(999)).toBe("conflict");
	});
});

describe("getRejectionResult", () => {
	it("reports a successful conditional update", () => {
		expect(getRejectionResult(true)).toBe("rejected");
	});

	it("distinguishes missing, idempotent, and conflicting outcomes", () => {
		expect(getRejectionResult(false)).toBe("not-found");
		expect(getRejectionResult(false, SUBMISSION_STATUS.DENIED)).toBe(
			"already-rejected",
		);
		expect(getRejectionResult(false, SUBMISSION_STATUS.APPROVED)).toBe(
			"conflict",
		);
		expect(getRejectionResult(false, SUBMISSION_STATUS.PENDING)).toBe(
			"conflict",
		);
	});
});
