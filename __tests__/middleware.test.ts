/**
 * @jest-environment node
 *
 * Runs on node rather than the project-default jsdom: `next/server` needs the
 * Web `Request`/`Response` globals, which jsdom does not provide.
 *
 * Guards the health-probe bypass added for Coolify.
 *
 * The container healthcheck must not depend on Clerk, but the bypass must also
 * not become a hole that skips security headers for the rest of the site — so
 * both halves are asserted here.
 */

// The handler is created inside the factory because jest hoists `jest.mock`
// above module-scope declarations, so a `const` defined here would still be in
// its temporal dead zone when the mocked module is first required.
jest.mock("@clerk/nextjs/server", () => {
	const handler = jest.fn();
	return {
		clerkMiddleware: jest.fn(() => handler),
		__handler: handler,
	};
});

import * as clerkServer from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import middleware, { HEALTH_PATH } from "@/middleware";

const clerkHandler = (clerkServer as unknown as { __handler: jest.Mock })
	.__handler;

function requestFor(pathname: string): NextRequest {
	return {
		nextUrl: { pathname },
	} as unknown as NextRequest;
}

const event = {} as NextFetchEvent;

describe("middleware health-probe bypass", () => {
	beforeEach(() => {
		clerkHandler.mockClear();
	});

	it("serves the health probe without invoking Clerk", () => {
		const response = middleware(requestFor(HEALTH_PATH), event);

		expect(clerkHandler).not.toHaveBeenCalled();
		expect(response).toBeDefined();
	});

	it("still applies security headers on the bypassed health probe", () => {
		const response = middleware(requestFor(HEALTH_PATH), event) as Response;

		expect(response.headers.get("Content-Security-Policy")).toContain(
			"default-src 'self'",
		);
		expect(response.headers.get("X-Frame-Options")).toBe("DENY");
		expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
	});

	it.each(["/", "/api/tokens", "/api/messages", "/admin"])(
		"delegates %s to Clerk",
		(pathname) => {
			middleware(requestFor(pathname), event);

			expect(clerkHandler).toHaveBeenCalledTimes(1);
		},
	);

	it("does not bypass paths that merely start with the health path", () => {
		middleware(requestFor(`${HEALTH_PATH}/../tokens`), event);

		expect(clerkHandler).toHaveBeenCalledTimes(1);
	});
});
