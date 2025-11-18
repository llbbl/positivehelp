"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { isUserAdmin } from "@/lib/auth";

export function AdminLink() {
	const { user } = useUser();
	const [isAdmin, setIsAdmin] = React.useState(false);

	React.useEffect(() => {
		const checkAdmin = async () => {
			if (user) {
				const admin = await isUserAdmin(user);
				setIsAdmin(admin);
			}
		};
		checkAdmin();
	}, [user]);

	if (!isAdmin) return null;

	return (
		<Button variant="ghost" className="text-green-800 hover:bg-green-50">
			<Link href="/admin">Admin</Link>
		</Button>
	);
}
