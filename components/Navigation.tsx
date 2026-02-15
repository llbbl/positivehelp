"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Menu, PlusCircle, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SettingsDropdown } from "@/components/settings-dropdown";
import { Button } from "@/components/ui/button";

export function Navigation() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<nav className="flex items-center justify-between p-4 bg-green-300 relative">
			<Link href="/" className="text-xl font-semibold hover:text-green-800">
				positive.help
			</Link>

			<div className="flex items-center gap-2 md:gap-4">
				<Button
					asChild
					size="sm"
					className="md:hidden bg-white text-green-800 hover:bg-green-50 px-4 leading-none"
				>
					<Link href="/add" aria-label="Add Positivity">
						<PlusCircle className="w-4 h-4" />
					</Link>
				</Button>

				{/* Mobile Menu Button */}
				<button
					className="md:hidden p-1"
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					aria-expanded={isMenuOpen}
					aria-controls="mobile-menu"
					aria-label={isMenuOpen ? "Close menu" : "Open menu"}
				>
					{isMenuOpen ? (
						<X className="h-6 w-6 text-green-800" />
					) : (
						<Menu className="h-6 w-6 text-green-800" />
					)}
				</button>

				{/* Desktop Navigation */}
				<div className="hidden md:flex items-center gap-4">
					<SignedIn>
						<Button
							asChild
							variant="ghost"
							className="text-green-800 hover:bg-green-50"
						>
							<Link href="/submissions">Submissions</Link>
						</Button>
					</SignedIn>
					<Button
						asChild
						size="sm"
						className="bg-white text-green-800 hover:bg-green-50 px-4 md:px-6 leading-none"
					>
						<Link href="/add" className="flex items-center">
							<PlusCircle className="w-4 h-4 mr-2" />
							<span>Add Positivity</span>
						</Link>
					</Button>
					<SignedIn>
						<SettingsDropdown />
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

				{/* Mobile Navigation */}
				{isMenuOpen && (
					<div
						id="mobile-menu"
						role="menu"
						className="absolute top-full right-0 w-30 bg-green-300 p-4 md:hidden flex flex-col gap-2 shadow-lg z-50 rounded-bl-lg"
					>
						<SignedIn>
							<Button
								asChild
								variant="ghost"
								className="text-green-800 hover:bg-green-50 w-full justify-end"
							>
								<Link href="/submissions" role="menuitem">
									Submissions
								</Link>
							</Button>
						</SignedIn>
						<SignedIn>
							<SettingsDropdown />
						</SignedIn>
						<SignedOut>
							<div className="flex justify-end w-full" role="menuitem" tabIndex={0}>
								<SignInButton mode="modal" />
							</div>
						</SignedOut>
						<SignedIn>
							<div className="flex justify-end w-full" role="menuitem" tabIndex={0}>
								<UserButton afterSignOutUrl="/" />
							</div>
						</SignedIn>
					</div>
				)}
			</div>
		</nav>
	);
}
