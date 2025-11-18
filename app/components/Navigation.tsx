"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Menu, PlusCircle, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AdminLink } from "@/components/admin-link";
import { Button } from "@/components/ui/button";

export function Navigation() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<nav className="flex items-center justify-between p-4 bg-green-300 relative">
			<Link href="/" className="text-xl font-semibold hover:text-green-800">
				positive.help
			</Link>

			<div className="flex items-center gap-2 md:gap-4">
				{/* Desktop Navigation */}
				<div className="hidden md:flex items-center gap-4">
					<SignedIn>
						<Button
							variant="ghost"
							className="text-green-800 hover:bg-green-50"
						>
							<Link href="/submissions">Submissions</Link>
						</Button>
					</SignedIn>

					<Button
						size="sm"
						className="bg-white text-green-800 hover:bg-green-50 px-2 md:px-4"
					>
						<PlusCircle className="w-4 h-4" />
						<Link href="/add" className="ml-0 md:ml-2">
							<span className="hidden md:inline">Add Positivity</span>
						</Link>
					</Button>

					<SignedIn>
						<AdminLink />
					</SignedIn>
					<SignedOut>
						<div className="flex justify-end">
							<SignInButton mode="modal" />
						</div>
					</SignedOut>
					<SignedIn>
						<div className="flex justify-end">
							<UserButton afterSignOutUrl="/" />
						</div>
					</SignedIn>
				</div>

				{/* Mobile Add Button */}
				<div className="md:hidden">
					<Button
						size="sm"
						className="bg-white text-green-800 hover:bg-green-50 px-2"
					>
						<PlusCircle className="w-4 h-4" />
						<Link href="/add" />
					</Button>
				</div>

				{/* Mobile Menu Button */}
				<button
					className="md:hidden p-1"
					onClick={() => setIsMenuOpen(!isMenuOpen)}
				>
					{isMenuOpen ? (
						<X className="h-6 w-6 text-green-800" />
					) : (
						<Menu className="h-6 w-6 text-green-800" />
					)}
				</button>

				{/* Mobile Navigation */}
				{isMenuOpen && (
					<div className="absolute top-full right-0 w-48 bg-green-300 p-4 md:hidden flex flex-col gap-2 shadow-lg z-50 rounded-bl-lg">
						<SignedIn>
							<Button
								variant="ghost"
								className="text-green-800 hover:bg-green-50 w-full justify-start"
							>
								<Link href="/submissions">Submissions</Link>
							</Button>
						</SignedIn>
						<SignedIn>
							<AdminLink />
						</SignedIn>
						<SignedOut>
							<div className="flex justify-end w-full">
								<SignInButton mode="modal" />
							</div>
						</SignedOut>
						<SignedIn>
							<div className="flex justify-end w-full">
								<UserButton afterSignOutUrl="/" />
							</div>
						</SignedIn>
					</div>
				)}
			</div>
		</nav>
	);
}
