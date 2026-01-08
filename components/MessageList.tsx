"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageListSkeleton } from "./MessageSkeleton";
import clientLogger from "@/lib/client-logger";
import { MESSAGE_POLL_INTERVAL_MS } from "@/lib/constants";

export interface Message {
	id: number;
	text: string;
	date: string;
	url: string;
	author?: string;
}

interface MessageListProps {
	initialMessages: Message[];
}

export default function MessageList({ initialMessages }: MessageListProps) {
	const [messages, setMessages] = useState<Message[]>(initialMessages);
	const [isLoading, setIsLoading] = useState(false);
	const [isInitialLoad, setIsInitialLoad] = useState(
		initialMessages.length === 0,
	);

	// Use ref to track the highest message ID to avoid dependency on messages array
	const messagesRef = useRef<Message[]>(initialMessages);

	// Keep ref in sync with state
	useEffect(() => {
		messagesRef.current = messages;
	}, [messages]);

	// Use useCallback to memoize the fetch function
	const fetchLatestMessages = useCallback(async () => {
		try {
			setIsLoading(true);

			// Get the highest message ID from the ref (avoids stale closure issue)
			const currentMessages = messagesRef.current;
			const highestId =
				currentMessages.length > 0
					? Math.max(...currentMessages.map((msg) => msg.id))
					: 0;

			// Add cache-busting and lastId parameters to only fetch new messages
			const response = await fetch(
				`/api/messages?t=${Date.now()}&lastId=${highestId}`,
				{
					cache: "no-store",
					headers: {
						"Cache-Control": "no-cache",
						Pragma: "no-cache",
					},
				},
			);

			if (!response.ok) {
				throw new Error("Failed to fetch latest messages");
			}

			const newMessages = (await response.json()) as Message[];

			// Only update state if we have new messages
			if (newMessages.length > 0) {
				// Combine new messages with existing ones and sort by ID descending
				setMessages((prevMessages) => {
					const combined = [...newMessages, ...prevMessages];
					// Remove any duplicates (by ID) and sort
					const uniqueMessages = Array.from(
						new Map(combined.map((msg) => [msg.id, msg])).values(),
					).sort((a, b) => b.id - a.id);

					return uniqueMessages;
				});
			}
		} catch (error) {
			clientLogger.error("Error fetching latest messages", {
				error: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsLoading(false);
			setIsInitialLoad(false);
		}
	}, []); // No dependencies needed - uses ref for current messages

	useEffect(() => {
		// Fetch latest messages after component mounts
		fetchLatestMessages();

		// Set up polling for new messages every 30 seconds
		const intervalId = setInterval(fetchLatestMessages, MESSAGE_POLL_INTERVAL_MS);

		// Clean up interval on component unmount
		return () => clearInterval(intervalId);
	}, [fetchLatestMessages]); // Only depend on the memoized callback

	// Show skeleton loading state for initial load
	if (isInitialLoad && messages.length === 0) {
		return <MessageListSkeleton count={6} />;
	}

	return (
		<div className="space-y-3 relative">
			{isLoading && !isInitialLoad && (
				<div className="absolute top-0 right-0 text-xs text-gray-500 animate-pulse bg-white/80 px-2 py-1 rounded-md">
					Checking for new messages...
				</div>
			)}
			{messages.length === 0 ? (
				<div className="text-center py-8 text-gray-500">
					<p>No messages yet. Be the first to share something positive!</p>
				</div>
			) : (
				messages.map((message: Message) => (
					<Link
						href={`/msg/${message.url}`}
						key={message.id}
						className="block p-1 rounded-lg text-gray-800 hover:bg-gray-100/60 transition-all"
					>
						<p>{message.text}</p>
						<span className="text-sm text-gray-600">({message.date})</span>
					</Link>
				))
			)}
		</div>
	);
}
