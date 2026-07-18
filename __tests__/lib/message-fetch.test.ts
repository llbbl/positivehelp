import { describe, expect, it } from "@jest/globals";
import {
	classifyMessageResponse,
	MessageFetchError,
} from "@/lib/message-fetch";

describe("classifyMessageResponse", () => {
	it("classifies only 404 as missing content", () => {
		expect(
			classifyMessageResponse({
				ok: false,
				status: 404,
				statusText: "Not Found",
			}),
		).toBe("not-found");
	});

	it.each([429, 500, 503])("throws for non-404 error status %i", (status) => {
		expect(() =>
			classifyMessageResponse({ ok: false, status, statusText: "Failure" }),
		).toThrow(MessageFetchError);
	});

	it("classifies successful responses as found", () => {
		expect(
			classifyMessageResponse({ ok: true, status: 200, statusText: "OK" }),
		).toBe("found");
	});
});
