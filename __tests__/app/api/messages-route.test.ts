/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/messages/route";
import { MESSAGE_PAGE_SIZE } from "@/lib/constants";
import { getMessages } from "@/lib/messages";
import { applyRateLimit } from "@/lib/rate-limit";

vi.mock("@clerk/nextjs/server", () => ({
	auth: vi.fn(),
	currentUser: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
	isUserAdmin: vi.fn(),
}));

vi.mock("@/lib/authors", () => ({
	getOrCreateAuthor: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	default: {
		execute: vi.fn(),
	},
}));

vi.mock("@/lib/messages", () => ({
	getMessages: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
	applyRateLimit: vi.fn(),
	RATE_LIMITS: {
		PUBLIC_READ: { windowMs: 1, maxRequests: 1 },
		AUTHENTICATED_WRITE: { windowMs: 1, maxRequests: 1 },
	},
}));

vi.mock("@/lib/logger", () => ({
	default: {
		error: vi.fn(),
	},
}));

type AsyncMock = {
	mockResolvedValue(value: unknown): void;
};

const getMessagesMock = getMessages as unknown as AsyncMock;
const applyRateLimitMock = applyRateLimit as unknown as AsyncMock;

describe("GET /api/messages", () => {
	beforeEach(() => {
		vi.clearAllMocks();
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
