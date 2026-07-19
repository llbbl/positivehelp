/** @jest-environment node */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { GET } from "@/app/api/messages/route";
import { MESSAGE_PAGE_SIZE } from "@/lib/constants";
import { getMessages } from "@/lib/messages";
import { applyRateLimit } from "@/lib/rate-limit";

jest.mock("@clerk/nextjs/server", () => ({
	auth: jest.fn(),
	currentUser: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
	isUserAdmin: jest.fn(),
}));

jest.mock("@/lib/authors", () => ({
	getOrCreateAuthor: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
	__esModule: true,
	default: {
		execute: jest.fn(),
	},
}));

jest.mock("@/lib/messages", () => ({
	getMessages: jest.fn(),
}));

jest.mock("@/lib/rate-limit", () => ({
	applyRateLimit: jest.fn(),
	RATE_LIMITS: {
		PUBLIC_READ: { windowMs: 1, maxRequests: 1 },
		AUTHENTICATED_WRITE: { windowMs: 1, maxRequests: 1 },
	},
}));

jest.mock("@/lib/logger", () => ({
	__esModule: true,
	default: {
		error: jest.fn(),
	},
}));

type AsyncMock = {
	mockResolvedValue(value: unknown): void;
};

const getMessagesMock = getMessages as unknown as AsyncMock;
const applyRateLimitMock = applyRateLimit as unknown as AsyncMock;

describe("GET /api/messages", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		applyRateLimitMock.mockResolvedValue(null);
		getMessagesMock.mockResolvedValue([]);
	});

	it("uses the default bounded page size", async () => {
		const response = await GET(
			new Request("https://positive.help/api/messages"),
		);

		expect(getMessages).toHaveBeenCalledWith(undefined, MESSAGE_PAGE_SIZE);
		expect(response.status).toBe(200);
		expect(response.headers.get("Cache-Control")).toContain("public");
	});

	it("passes validated cursor and limit parameters to message retrieval", async () => {
		const response = await GET(
			new Request(
				"https://positive.help/api/messages?lastId=10&limit=25&t=123",
			),
		);

		expect(getMessages).toHaveBeenCalledWith(10, 25);
		expect(response.status).toBe(200);
		expect(response.headers.get("Cache-Control")).toContain("no-store");
	});
});
