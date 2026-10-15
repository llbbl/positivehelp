/** @jest-environment node */

import { auth } from "@clerk/nextjs/server";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { createMessage } from "@/app/actions";
import { messageSchemas } from "@/lib/validation/schemas";

jest.mock("@clerk/nextjs/server", () => ({ auth: jest.fn() }));
jest.mock("@/lib/app-origin", () => ({
	getAppUrl: () => "https://positive.help/api/messages",
}));
jest.mock("@/lib/logger", () => ({
	__esModule: true,
	default: { error: jest.fn() },
}));

describe("createMessage", () => {
	beforeEach(() => {
		jest.mocked(auth).mockResolvedValue({
			getToken: jest.fn().mockResolvedValue("test-token"),
		} as unknown as Awaited<ReturnType<typeof auth>>);
		jest.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
			const result = messageSchemas.create.safeParse(
				JSON.parse(String(init?.body)),
			);
			return new Response(result.success ? "{}" : "Invalid message", {
				status: result.success ? 201 : 400,
			});
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it.each([undefined, "", "   "])(
		"submits an API-valid message without an author for %p",
		async (author) => {
			const formData = new FormData();
			formData.set("content", "Keep going!");
			formData.set("userId", "user_test");
			if (author !== undefined) formData.set("author", author);

			const result = await createMessage(formData);
			const body = JSON.parse(
				String(jest.mocked(fetch).mock.calls[0][1]?.body),
			);

			expect(body).toEqual({ text: "Keep going!", clerkUserId: "user_test" });
			expect(messageSchemas.create.safeParse(body).success).toBe(true);
			expect(result).toEqual({ success: true });
		},
	);

	it("preserves supplied attribution in an API-valid message", async () => {
		const formData = new FormData();
		formData.set("content", "Keep going!");
		formData.set("userId", "user_test");
		formData.set("author", "  Maya Angelou  ");

		const result = await createMessage(formData);
		const body = JSON.parse(String(jest.mocked(fetch).mock.calls[0][1]?.body));

		expect(body).toEqual({
			text: "Keep going!",
			author: "Maya Angelou",
			clerkUserId: "user_test",
		});
		expect(messageSchemas.create.safeParse(body).success).toBe(true);
		expect(result).toEqual({ success: true });
	});
});
