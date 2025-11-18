import type { User } from "@clerk/nextjs/server";
import logger from "@/lib/logger";

export async function isUserAdmin(
	user: User | { publicMetadata: Record<string, unknown> },
) {
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
