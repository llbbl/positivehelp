/** @vitest-environment node */

import { currentUser } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/admin/submissions/[id]/approve/route";
import { db } from "@/db/client";
import { isUserAdmin } from "@/lib/auth";
import { SUBMISSION_STATUS } from "@/lib/constants";
import { applyRateLimit } from "@/lib/rate-limit";

vi.mock("@clerk/nextjs/server", () => ({
	currentUser: vi.fn(),
}));

vi.mock("@/db/client", () => ({
	db: {
		transaction: vi.fn(),
	},
}));

vi.mock("@/lib/auth", () => ({
	isUserAdmin: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
	default: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("@/lib/rate-limit", () => ({
	applyRateLimit: vi.fn(),
	RATE_LIMITS: { ADMIN: { windowMs: 1, maxRequests: 1 } },
}));

type FakeTransaction = ReturnType<typeof createFakeTransaction>;

function createFakeTransaction() {
	const claimReturning = vi.fn<() => Promise<unknown[]>>();
	const claimWhere = vi.fn(() => ({ returning: claimReturning }));
	const claimSet = vi.fn(() => ({ where: claimWhere }));
	const update = vi.fn(() => ({ set: claimSet }));

	const statusWhere = vi.fn<() => Promise<Array<{ status: number }>>>();
	const selectFrom = vi.fn(() => ({ where: statusWhere }));
	const select = vi.fn(() => ({ from: selectFrom }));

	const messageReturning = vi.fn<() => Promise<Array<{ id: number }>>>();
	const insertValues = vi.fn(() => ({ returning: messageReturning }));
	const insert = vi.fn(() => ({ values: insertValues }));

	return {
		tx: { update, select, insert },
		claimReturning,
		statusWhere,
		messageReturning,
		insert,
	};
}

type AsyncMock = {
	mockResolvedValue(value: unknown): void;
};

const transactionMock = db.transaction as unknown as {
	mockImplementation(
		implementation: (callback: unknown) => Promise<unknown>,
	): void;
};
const currentUserMock = currentUser as unknown as AsyncMock;
const isUserAdminMock = isUserAdmin as unknown as AsyncMock;
const applyRateLimitMock = applyRateLimit as unknown as AsyncMock;

async function approveSubmission() {
	return POST({} as NextRequest, {
		params: Promise.resolve({ id: "123" }),
	});
}

function runTransactionWith(
	fake: FakeTransaction,
	onRollback?: () => void,
): void {
	transactionMock.mockImplementation(async (callback: unknown) => {
		try {
			return await (
				callback as (tx: FakeTransaction["tx"]) => Promise<unknown>
			)(fake.tx);
		} catch (error) {
			onRollback?.();
			throw error;
		}
	});
}

describe("submission approval transaction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		currentUserMock.mockResolvedValue({ id: "admin-user" });
		isUserAdminMock.mockResolvedValue(true);
		applyRateLimitMock.mockResolvedValue(null);
	});

	it("returns 409 without publishing a denied submission", async () => {
		const fake = createFakeTransaction();
		fake.claimReturning.mockResolvedValue([]);
		fake.statusWhere.mockResolvedValue([{ status: SUBMISSION_STATUS.DENIED }]);
		runTransactionWith(fake);

		const response = await approveSubmission();

		expect(response.status).toBe(409);
		await expect(response.json()).resolves.toMatchObject({
			code: "ALREADY_REJECTED",
		});
		expect(fake.insert).not.toHaveBeenCalled();
	});

	it("treats a lost race to another approval as idempotent", async () => {
		const fake = createFakeTransaction();
		fake.claimReturning.mockResolvedValue([]);
		fake.statusWhere.mockResolvedValue([
			{ status: SUBMISSION_STATUS.APPROVED },
		]);
		runTransactionWith(fake);

		const response = await approveSubmission();

		expect(response.status).toBe(200);
		await expect(response.text()).resolves.toBe("Approved");
		expect(fake.insert).not.toHaveBeenCalled();
	});

	it("returns 404 without publishing a nonexistent submission", async () => {
		const fake = createFakeTransaction();
		fake.claimReturning.mockResolvedValue([]);
		fake.statusWhere.mockResolvedValue([]);
		runTransactionWith(fake);

		const response = await approveSubmission();

		expect(response.status).toBe(404);
		expect(fake.insert).not.toHaveBeenCalled();
	});

	it("lets publication failures escape the callback so the claim rolls back", async () => {
		const fake = createFakeTransaction();
		fake.claimReturning.mockResolvedValue([
			{
				id: 123,
				msg: "A message",
				hash: "hash",
				slug: "a-message",
				date: "2026-07-18",
				clerkUserId: "submitter",
				status: SUBMISSION_STATUS.APPROVED,
				authorName: null,
			},
		]);
		fake.messageReturning.mockRejectedValue(new Error("message insert failed"));
		let rolledBack = false;
		runTransactionWith(fake, () => {
			rolledBack = true;
		});

		const response = await approveSubmission();

		expect(response.status).toBe(500);
		expect(rolledBack).toBe(true);
		expect(fake.claimReturning.mock.invocationCallOrder[0]).toBeLessThan(
			fake.insert.mock.invocationCallOrder[0],
		);
	});
});
