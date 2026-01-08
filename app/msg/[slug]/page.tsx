// page component

import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { Message } from "@/app/api/messages/[slug]/route";
import logger from "@/lib/logger";
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
		try {
			const absoluteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/messages/${slug}`;
			logger.info(`Fetching message for slug: ${slug}`);

			const response = await fetch(absoluteUrl, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				cache: "no-store",
			});

			if (!response.ok) {
				if (response.status === 404) {
					return null;
				}
				logger.error("API request failed", {
					status: response.status,
					statusText: response.statusText,
					url: absoluteUrl,
				});
				return null;
			}

			const message = (await response.json()) as MessageWithNavigation;
			logger.info(`Successfully fetched message`, { messageId: message.id });
			return message;
		} catch (error) {
			logger.error("Error fetching message:", { error, slug });
			return null;
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
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://positive.help";
	const messageUrl = `${baseUrl}/msg/${slug}`;
	const ogImageUrl = `${baseUrl}/og/${slug}`;

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
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://positive.help";
	const articleStructuredData = generateStructuredData("article", {
		title: cleanTextForMeta(message.text),
		description: generateMessageDescription(
			cleanTextForMeta(message.text),
			authorName,
		),
		url: `${baseUrl}/msg/${slug}`,
		image: `${baseUrl}/og/${slug}`,
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
