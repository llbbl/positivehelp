import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Environment Variable Validation", () => {
	// Save original env
	const originalEnv = process.env;

	beforeEach(() => {
		// Clear the module cache to re-import env.ts with new env vars
		vi.resetModules();
		// Isolate validation from developer credentials and deployment settings.
		process.env = {
			NODE_ENV: "test",
			TURSO_DATABASE_URL: "https://db.turso.io",
			TURSO_AUTH_TOKEN: "test-token",
			NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
			CLERK_SECRET_KEY: "sk_test_123",
			NEXT_PUBLIC_APP_URL: "https://example.com",
		};
	});

	afterEach(() => {
		// Restore original env
		process.env = originalEnv;
	});

	it.each([
		"TURSO_DATABASE_URL",
		"TURSO_AUTH_TOKEN",
		"NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
		"CLERK_SECRET_KEY",
	])(
		"rejects a missing %s with all other variables valid",
		async (variable) => {
			delete process.env[variable];

			await expect(import("@/lib/env")).rejects.toMatchObject({
				issues: [{ path: [variable], code: "invalid_type" }],
			});
		},
	);

	it("validates URL format for TURSO_DATABASE_URL", async () => {
		process.env.TURSO_DATABASE_URL = "not-a-url";
		process.env.TURSO_AUTH_TOKEN = "test-token";
		process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";
		process.env.CLERK_SECRET_KEY = "sk_test_123";

		await expect(import("@/lib/env")).rejects.toThrow(
			/TURSO_DATABASE_URL must be a valid URL/,
		);
	});

	it("validates URL format for NEXT_PUBLIC_APP_URL if provided", async () => {
		process.env.TURSO_DATABASE_URL = "https://db.turso.io";
		process.env.TURSO_AUTH_TOKEN = "test-token";
		process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";
		process.env.CLERK_SECRET_KEY = "sk_test_123";
		process.env.NEXT_PUBLIC_APP_URL = "not-a-url";

		await expect(import("@/lib/env")).rejects.toThrow(
			/NEXT_PUBLIC_APP_URL must be a valid URL/,
		);
	});

	it("accepts valid environment variables", async () => {
		process.env.TURSO_DATABASE_URL = "https://db.turso.io";
		process.env.TURSO_AUTH_TOKEN = "test-token";
		process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";
		process.env.CLERK_SECRET_KEY = "sk_test_123";
		process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
		Object.defineProperty(process.env, "NODE_ENV", {
			value: "test",
			writable: true,
		});

		const { env } = await import("@/lib/env");
		expect(env.TURSO_DATABASE_URL).toBe("https://db.turso.io");
		expect(env.TURSO_AUTH_TOKEN).toBe("test-token");
		expect(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBe("pk_test_123");
		expect(env.CLERK_SECRET_KEY).toBe("sk_test_123");
		expect(env.NEXT_PUBLIC_APP_URL).toBe("https://example.com");
		expect(env.NODE_ENV).toBe("test");
	});

	it("resolves NEXT_PUBLIC_APP_URL when it is not configured", async () => {
		process.env.TURSO_DATABASE_URL = "https://db.turso.io";
		process.env.TURSO_AUTH_TOKEN = "test-token";
		process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";
		process.env.CLERK_SECRET_KEY = "sk_test_123";
		delete process.env.NEXT_PUBLIC_APP_URL;
		Object.defineProperty(process.env, "NODE_ENV", {
			value: "test",
			writable: true,
		});

		const { env } = await import("@/lib/env");
		expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
	});
});
