/**
 * Server-side authentication utilities
 * This file is SERVER-ONLY and should only be imported in server components,
 * API routes, and server actions.
 */

import type { User } from "@clerk/nextjs/server";
import logger from "@/lib/logger";

/**
 * Check if a user has admin privileges
 * @param user - Clerk user object or object with publicMetadata
 * @returns true if user is an admin, false otherwise
 */
export async function isUserAdmin(
	user: User | { publicMetadata: Record<string, unknown> },
): Promise<boolean> {
	try {
		const metadata = user.publicMetadata;
		return metadata?.isAdmin === "true" || metadata?.isAdmin === true;
	} catch (error) {
		logger.error("Error checking admin status", {
			error: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
		});
		return false;
	}
}
