// page component

import type { Metadata } from "next";
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

// Fetch message for metadata generation
async function fetchMessageForMetadata(slug: string): Promise<Message | null> {
	try {
		const absoluteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/messages/${slug}`;
		const response = await fetch(absoluteUrl, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			cache: "no-store",
		});

		if (!response.ok) {
			return null;
		}

		return (await response.json()) as Message;
	} catch (error) {
		logger.error("Error fetching message for metadata:", { error, slug });
		return null;
	}
}

// Generate dynamic metadata for each message page
export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const resolvedParams = await params;
	const { slug } = resolvedParams;

	const message = await fetchMessageForMetadata(slug);

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
	const messageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/msg/${slug}`;

	return generateSEOMetadata({
		title,
		description,
		canonical: messageUrl,
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

	try {
		logger.info(`Page: Fetching message for slug: ${slug}`);

		// Construct the absolute URL using NEXT_PUBLIC_APP_URL
		const absoluteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/messages/${slug}`;

		const response = await fetch(absoluteUrl, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			cache: "no-store",
		});

		if (!response.ok) {
			logger.error("API request failed", {
				status: response.status,
				statusText: response.statusText,
				url: absoluteUrl,
			});

			if (response.status === 404) {
				notFound();
			}

			throw new Error(
				`Failed to fetch message: ${response.status} ${response.statusText}`,
			);
		}

		const message = (await response.json()) as Message & {
			navigation: { prevSlug: string | null; nextSlug: string | null };
		};

		logger.info(`Page: Successfully fetched message`, {
			messageId: message.id,
		});

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
			url: `${process.env.NEXT_PUBLIC_APP_URL}/msg/${slug}`,
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
	} catch (error) {
		logger.error("Page: Error fetching message", {
			error: error instanceof Error ? error.message : "Unknown error",
			slug,
			url: `${process.env.NEXT_PUBLIC_APP_URL}/api/messages/${slug}`,
		});

		return (
			<div className={`min-h-screen ${bgColor}`}>
				<main className="container mx-auto p-6">
					<div className="bg-white rounded-lg p-6 shadow-sm">
						<p className="text-red-600">
							Failed to load message. Please try again later.
						</p>
						{process.env.NODE_ENV !== "production" &&
							error instanceof Error && (
								<p className="text-sm text-gray-600 mt-2">{error.message}</p>
							)}
					</div>
				</main>
			</div>
		);
	}
}
