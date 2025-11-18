import type { User } from "@clerk/nextjs/server";

export async function isUserAdmin(
	user: User | { publicMetadata: Record<string, unknown> },
) {
	try {
		const metadata = user.publicMetadata;
		return metadata?.isAdmin === "true" || metadata?.isAdmin === true;
	} catch (error) {
		console.error("Error checking admin status:", error);
		return false;
	}
}
