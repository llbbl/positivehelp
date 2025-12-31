"use client";

import { useUser } from "@clerk/nextjs";
import { ChevronDown, Key, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function SettingsDropdown() {
	const { user } = useUser();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Check if user is admin using Clerk's client-side metadata
	const isAdmin =
		user?.publicMetadata?.isAdmin === "true" ||
		user?.publicMetadata?.isAdmin === true;

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Close dropdown when pressing Escape
	useEffect(() => {
		function handleEscape(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		}

		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("keydown", handleEscape);
		};
	}, []);

	return (
		<div className="relative" ref={dropdownRef}>
			<Button
				variant="ghost"
				className="text-green-800 hover:bg-green-50 flex items-center gap-1"
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
				aria-haspopup="true"
			>
				<Settings className="w-4 h-4" />
				<span>Settings</span>
				<ChevronDown
					className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
				/>
			</Button>

			{isOpen && (
				<div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
					{isAdmin && (
						<Link
							href="/admin"
							className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800"
							onClick={() => setIsOpen(false)}
						>
							<Shield className="w-4 h-4" />
							Admin Dashboard
						</Link>
					)}
					<Link
						href="/settings/api-keys"
						className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800"
						onClick={() => setIsOpen(false)}
					>
						<Key className="w-4 h-4" />
						API Keys
					</Link>
				</div>
			)}
		</div>
	);
}
