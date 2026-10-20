/** @vitest-environment node */

import { auth } from "@clerk/nextjs/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMessage } from "@/app/actions";
import { messageSchemas } from "@/lib/validation/schemas";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/app-origin", () => ({
	getAppUrl: () => "https://positive.help/api/messages",
}));
vi.mock("@/lib/logger", () => ({
	default: { error: vi.fn() },
}));

describe("createMessage", () => {
	beforeEach(() => {
		vi.mocked(auth).mockResolvedValue({
			getToken: vi.fn().mockResolvedValue("test-token"),
		} as unknown as Awaited<ReturnType<typeof auth>>);
		vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
			const result = messageSchemas.create.safeParse(
				JSON.parse(String(init?.body)),
			);
			return new Response(result.success ? "{}" : "Invalid message", {
				status: result.success ? 201 : 400,
			});
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it.each([undefined, "", "   "])(
		"submits an API-valid message without an author for %p",
		async (author) => {
			const formData = new FormData();
			formData.set("content", "Keep going!");
			formData.set("userId", "user_test");
			if (author !== undefined) formData.set("author", author);

			const result = await createMessage(formData);
			const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));

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
		const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));

		expect(body).toEqual({
			text: "Keep going!",
			author: "Maya Angelou",
			clerkUserId: "user_test",
		});
		expect(messageSchemas.create.safeParse(body).success).toBe(true);
		expect(result).toEqual({ success: true });
	});
});
