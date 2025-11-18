import { z } from "zod";

describe("Environment Variable Validation", () => {
	// Save original env
	const originalEnv = process.env;

	beforeEach(() => {
		// Clear the module cache to re-import env.ts with new env vars
		jest.resetModules();
		// Create a fresh copy of env for each test
		process.env = { ...originalEnv };
	});

	afterAll(() => {
		// Restore original env
		process.env = originalEnv;
	});

	it("validates required environment variables", () => {
		// Remove required vars
		delete process.env.TURSO_DATABASE_URL;
		delete process.env.TURSO_AUTH_TOKEN;

		// Should throw validation error when importing
		expect(() => {
			jest.isolateModules(() => {
				require("@/lib/env");
			});
		}).toThrow();
	});

	it("validates URL format for TURSO_DATABASE_URL", () => {
		process.env.TURSO_DATABASE_URL = "not-a-url";
		process.env.TURSO_AUTH_TOKEN = "test-token";
		process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";
		process.env.CLERK_SECRET_KEY = "sk_test_123";

		expect(() => {
			jest.isolateModules(() => {
				require("@/lib/env");
			});
		}).toThrow(/must be a valid URL/);
	});

	it("validates URL format for NEXT_PUBLIC_APP_URL if provided", () => {
		process.env.TURSO_DATABASE_URL = "https://db.turso.io";
		process.env.TURSO_AUTH_TOKEN = "test-token";
		process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";
		process.env.CLERK_SECRET_KEY = "sk_test_123";
		process.env.NEXT_PUBLIC_APP_URL = "not-a-url";

		expect(() => {
			jest.isolateModules(() => {
				require("@/lib/env");
			});
		}).toThrow(/must be a valid URL/);
	});

	it("accepts valid environment variables", () => {
		process.env.TURSO_DATABASE_URL = "https://db.turso.io";
		process.env.TURSO_AUTH_TOKEN = "test-token";
		process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";
		process.env.CLERK_SECRET_KEY = "sk_test_123";
		process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
		process.env.NODE_ENV = "test";

		expect(() => {
			jest.isolateModules(() => {
				const { env } = require("@/lib/env");
				expect(env.TURSO_DATABASE_URL).toBe("https://db.turso.io");
				expect(env.TURSO_AUTH_TOKEN).toBe("test-token");
				expect(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBe("pk_test_123");
				expect(env.CLERK_SECRET_KEY).toBe("sk_test_123");
				expect(env.NEXT_PUBLIC_APP_URL).toBe("https://example.com");
				expect(env.NODE_ENV).toBe("test");
			});
		}).not.toThrow();
	});

	it("allows NEXT_PUBLIC_APP_URL to be optional", () => {
		process.env.TURSO_DATABASE_URL = "https://db.turso.io";
		process.env.TURSO_AUTH_TOKEN = "test-token";
		process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";
		process.env.CLERK_SECRET_KEY = "sk_test_123";
		delete process.env.NEXT_PUBLIC_APP_URL;
		process.env.NODE_ENV = "test";

		expect(() => {
			jest.isolateModules(() => {
				const { env } = require("@/lib/env");
				expect(env.NEXT_PUBLIC_APP_URL).toBeUndefined();
			});
		}).not.toThrow();
	});
});
