// page component

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Message } from "@/app/api/messages/[slug]/route";
import { getAppUrl } from "@/lib/app-origin";
import logger from "@/lib/logger";
import { classifyMessageResponse } from "@/lib/message-fetch";
import { createRequestTiming } from "@/lib/request-timing";
import {
	cleanTextForMeta,
	generateMessageDescription,
	generateSEOMetadata,
	generateStructuredData,
} from "@/lib/seo";
import MessageDisplay from "./message-display";

const bgColors = [
	"bg-custom-green",
	"bg-custom-mint",
	"bg-custom-blue",
	"bg-custom-purple",
	"bg-custom-pink",
	"bg-custom-yellow",
	"bg-custom-orange",
	"bg-custom-red",
] as const;

function getRandomColor() {
	const randomIndex = Math.floor(Math.random() * bgColors.length);
	return bgColors[randomIndex];
}

// Extended message type with navigation info
type MessageWithNavigation = Message & {
	navigation: { prevSlug: string | null; nextSlug: string | null };
};

// Cached fetch function to deduplicate requests between generateMetadata and page component
const fetchMessage = cache(
	async (slug: string): Promise<MessageWithNavigation | null> => {
		const absoluteUrl = getAppUrl(`/api/messages/${encodeURIComponent(slug)}`);
		const timing = createRequestTiming();
		let response: Response | undefined;
		let outcome: "found" | "not-found" | "error" = "error";
		try {
			try {
				response = await timing.measure("fetch", () =>
					fetch(absoluteUrl, {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
						cache: "no-store",
					}),
				);
			} catch (error) {
				logger.error("Error fetching message:", { error, slug });
				throw error;
			}

			if (!response.ok && response.status !== 404) {
				logger.error("API request failed", {
					status: response.status,
					statusText: response.statusText,
					url: absoluteUrl,
				});
			}
			if (classifyMessageResponse(response) === "not-found") {
				outcome = "not-found";
				return null;
			}

			const fetchedResponse = response;
			let message: MessageWithNavigation;
			try {
				message = (await timing.measure("parse", () =>
					fetchedResponse.json(),
				)) as MessageWithNavigation;
			} catch (error) {
				logger.error("Error parsing message response", { slug });
				throw error;
			}
			outcome = "found";
			return message;
		} finally {
			const id = response?.headers.get("X-Message-Request-Id");
			// Accept only the server-generated UUID shape; never log arbitrary header text.
			const requestId =
				id &&
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
					id,
				)
					? id
					: undefined;
			logger.info("message_page_fetch_timing", {
				requestId,
				status: response?.status,
				outcome,
				timings: timing.snapshot(),
			});
		}
	},
);

// Generate dynamic metadata for each message page
export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const resolvedParams = await params;
	const { slug } = resolvedParams;

	const message = await fetchMessage(slug);

	if (!message) {
		return generateSEOMetadata({
			title: "Message Not Found",
			description:
				"The requested positive message could not be found. Discover other uplifting content on positive.help",
			noIndex: true,
		});
	}

	const cleanMessage = cleanTextForMeta(message.text);
	const authorName =
		message.authors && message.authors.length > 0
			? message.authors[0].name
			: undefined;
	const description = generateMessageDescription(cleanMessage, authorName);
	const title =
		cleanMessage.length > 50
			? `${cleanMessage.substring(0, 50)}...`
			: cleanMessage;
	const messageUrl = getAppUrl(`/msg/${encodeURIComponent(slug)}`);
	const ogImageUrl = getAppUrl(`/og/${encodeURIComponent(slug)}`);

	return generateSEOMetadata({
		title,
		description,
		canonical: messageUrl,
		image: ogImageUrl,
		type: "article",
		publishedTime: message.date,
		author: authorName || "Anonymous",
		keywords: [
			"positive message",
			"inspiration",
			"motivation",
			"uplifting quote",
			"good vibes",
		],
	});
}

export default async function MessagePage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const resolvedParams = await params;
	const { slug } = resolvedParams;
	const bgColor = getRandomColor();

	// Use cached fetch function (same call as generateMetadata, will be deduplicated)
	const message = await fetchMessage(slug);

	if (!message) {
		notFound();
	}

	// Generate structured data for the article
	const authorName =
		message.authors && message.authors.length > 0
			? message.authors[0].name
			: undefined;
	const articleStructuredData = generateStructuredData("article", {
		title: cleanTextForMeta(message.text),
		description: generateMessageDescription(
			cleanTextForMeta(message.text),
			authorName,
		),
		url: getAppUrl(`/msg/${encodeURIComponent(slug)}`),
		image: getAppUrl(`/og/${encodeURIComponent(slug)}`),
		publishedTime: message.date,
		author: authorName || "Anonymous",
	});

	return (
		<>
			{/* Structured Data for the specific message */}
			{articleStructuredData && (
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(articleStructuredData),
					}}
				/>
			)}
			<MessageDisplay message={message} bgColor={bgColor} />
		</>
	);
}
