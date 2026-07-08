"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Message } from "@/app/api/messages/[slug]/route";

interface MessageDisplayProps {
	message: Message & {
		navigation: {
			prevSlug: string | null;
			nextSlug: string | null;
		};
	};
	bgColor: string;
}

export default function MessageDisplay({
	message,
	bgColor,
}: MessageDisplayProps) {
	const router = useRouter();

	useEffect(() => {
		const handleKeyPress = (event: KeyboardEvent) => {
			// Per WCAG 2.1.4 (Character Key Shortcuts): don't hijack single keys when
			// a modifier is held (e.g. Cmd/Ctrl+N opens a new window) or when the user
			// is typing in a form field.
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			const target = event.target as HTMLElement | null;
			if (
				target &&
				(target.isContentEditable ||
					target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.tagName === "SELECT")
			) {
				return;
			}

			if (event.key.toLowerCase() === "b" && message.navigation.prevSlug) {
				router.push(`/msg/${message.navigation.prevSlug}`);
			} else if (
				event.key.toLowerCase() === "n" &&
				message.navigation.nextSlug
			) {
				router.push(`/msg/${message.navigation.nextSlug}`);
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, [router, message.navigation]);

	return (
		<div className={`min-h-screen ${bgColor}`}>
			<main className="relative min-h-[calc(100vh-4rem)] p-6 flex items-center justify-center">
				<div className="max-w-[90%]">
					<h1 className="text-[8vw] leading-tight font-medium text-center">
						{message.text}
					</h1>
					{message.authors?.length > 0 && (
						<p className="text-right mt-4 text-sm text-gray-700">
							— {message.authors.map((author) => author.name).join(", ")}
						</p>
					)}
				</div>

				<span className="absolute bottom-6 left-6 text-sm text-gray-600">
					{message.date}
				</span>
				<span className="absolute bottom-6 right-6 text-sm text-gray-600">
					{message.navigation.prevSlug && "Press B for previous • "}
					{message.navigation.nextSlug && "Press N for next"}
				</span>
			</main>
		</div>
	);
}
