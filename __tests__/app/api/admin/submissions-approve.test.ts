/** @jest-environment node */

import { currentUser } from "@clerk/nextjs/server";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/submissions/[id]/approve/route";
import { db } from "@/db/client";
import { isUserAdmin } from "@/lib/auth";
import { SUBMISSION_STATUS } from "@/lib/constants";
import { applyRateLimit } from "@/lib/rate-limit";

jest.mock("@clerk/nextjs/server", () => ({
	currentUser: jest.fn(),
}));

jest.mock("@/db/client", () => ({
	db: {
		transaction: jest.fn(),
	},
}));

jest.mock("@/lib/auth", () => ({
	isUserAdmin: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
	__esModule: true,
	default: {
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	},
}));

jest.mock("@/lib/rate-limit", () => ({
	applyRateLimit: jest.fn(),
	RATE_LIMITS: { ADMIN: { windowMs: 1, maxRequests: 1 } },
}));

type FakeTransaction = ReturnType<typeof createFakeTransaction>;

function createFakeTransaction() {
	const claimReturning = jest.fn<() => Promise<unknown[]>>();
	const claimWhere = jest.fn(() => ({ returning: claimReturning }));
	const claimSet = jest.fn(() => ({ where: claimWhere }));
	const update = jest.fn(() => ({ set: claimSet }));

	const statusWhere = jest.fn<() => Promise<Array<{ status: number }>>>();
	const selectFrom = jest.fn(() => ({ where: statusWhere }));
	const select = jest.fn(() => ({ from: selectFrom }));

	const messageReturning = jest.fn<() => Promise<Array<{ id: number }>>>();
	const insertValues = jest.fn(() => ({ returning: messageReturning }));
	const insert = jest.fn(() => ({ values: insertValues }));

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
		jest.clearAllMocks();
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
