import { z } from "zod";

/**
 * Environment variable schema validation
 * This ensures all required environment variables are present and properly formatted
 */
const envSchema = z.object({
	// Turso Database
	TURSO_DATABASE_URL: z
		.string()
		.min(1, "TURSO_DATABASE_URL is required")
		.url("TURSO_DATABASE_URL must be a valid URL"),
	TURSO_AUTH_TOKEN: z
		.string()
		.min(1, "TURSO_AUTH_TOKEN is required")
		.describe("Authentication token for Turso database"),

	// Clerk Authentication
	NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
		.string()
		.min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required")
		.describe("Clerk publishable key for client-side authentication"),
	CLERK_SECRET_KEY: z
		.string()
		.min(1, "CLERK_SECRET_KEY is required")
		.describe("Clerk secret key for server-side authentication"),

	// Application URL (optional, has default)
	NEXT_PUBLIC_APP_URL: z
		.string()
		.url("NEXT_PUBLIC_APP_URL must be a valid URL if provided")
		.optional()
		.describe("Public-facing URL of the application"),

	// Node Environment
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development")
		.describe("Node environment"),
});

/**
 * Validated environment variables
 * This will throw a clear error at startup if validation fails
 */
export const env = envSchema.parse({
	TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
	TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
	NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
		process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
	CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
	NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
	NODE_ENV: process.env.NODE_ENV,
});

/**
 * Type-safe environment variables
 */
export type Env = z.infer<typeof envSchema>;
