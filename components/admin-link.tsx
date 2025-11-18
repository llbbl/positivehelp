"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AdminLink() {
	const { user } = useUser();

	// Check if user is admin using Clerk's client-side metadata
	const isAdmin =
		user?.publicMetadata?.isAdmin === "true" ||
		user?.publicMetadata?.isAdmin === true;

	if (!isAdmin) return null;

	return (
		<Button variant="ghost" className="text-green-800 hover:bg-green-50">
			<Link href="/admin">Admin</Link>
		</Button>
	);
}
