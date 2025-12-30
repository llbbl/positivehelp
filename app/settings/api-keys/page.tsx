import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import logger from "@/lib/logger";
import { ApiKeysManager } from "./_components/api-keys-manager";

// Force dynamic rendering - this page requires authentication
export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
	const user = await currentUser();

	if (!user) {
		logger.info("Unauthorized access attempt to API keys settings page");
		redirect("/");
	}

	return (
		<div className="min-h-screen bg-custom-solitude">
			<div className="container mx-auto py-10">
				<h1 className="text-2xl font-bold mb-8">API Keys</h1>
				<p className="text-gray-600 mb-6">
					Manage API keys for the desktop app. These keys allow the desktop
					application to authenticate with your account.
				</p>
				<ApiKeysManager />
			</div>
		</div>
	);
}
