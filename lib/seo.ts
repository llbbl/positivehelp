import type { Metadata } from "next";

// Base configuration for the site
export const siteConfig = {
	name: "positive.help",
	title: "positive.help - Share Positive Messages and Vibes",
	description:
		"A platform for sharing positive messages, uplifting quotes, and spreading good vibes. Submit your own positive content to brighten someone's day.",
	url: process.env.NEXT_PUBLIC_APP_URL || "https://positive.help",
	author: "positive.help team",
	keywords: [
		"positive messages",
		"uplifting quotes",
		"motivation",
		"inspiration",
		"good vibes",
		"mental health",
		"wellness",
		"positivity",
	],
	social: {
		twitter: "@positivehelp",
		// Add other social media handles as needed
	},
};

export interface SEOProps {
	title?: string;
	description?: string;
	keywords?: string[];
	author?: string;
	image?: string;
	noIndex?: boolean;
	canonical?: string;
	type?: "website" | "article";
	publishedTime?: string;
	modifiedTime?: string;
}

/**
 * Generate metadata for pages
 */
export function generateSEOMetadata({
	title,
	description = siteConfig.description,
	keywords = siteConfig.keywords,
	author = siteConfig.author,
	image,
	noIndex = false,
	canonical,
	type = "website",
	publishedTime,
	modifiedTime,
}: SEOProps = {}): Metadata {
	const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title;
	const url = canonical || siteConfig.url;
	const imageUrl = image || `${siteConfig.url}/og-image.svg`; // Use default OG image

	const metadata: Metadata = {
		title: fullTitle,
		description,
		keywords: keywords.join(", "),
		authors: [{ name: author }],
		creator: author,
		publisher: siteConfig.name,
		robots: noIndex ? "noindex,nofollow" : "index,follow",
		alternates: {
			canonical: url,
		},
		openGraph: {
			type,
			locale: "en_US",
			url,
			title: fullTitle,
			description,
			siteName: siteConfig.name,
			images: [
				{
					url: imageUrl,
					width: 1200,
					height: 630,
					alt: title || siteConfig.title,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: fullTitle,
			description,
			images: [imageUrl],
			creator: siteConfig.social.twitter,
		},
		verification: {
			// Add verification codes here when available
			// google: 'google-site-verification-code',
			// yandex: 'yandex-verification-code',
		},
	};

	// Add article-specific metadata
	if (type === "article" && (publishedTime || modifiedTime)) {
		metadata.openGraph = {
			...metadata.openGraph,
			type: "article",
			publishedTime,
			modifiedTime,
			authors: [author],
		};
	}

	return metadata;
}

/**
 * Generate structured data (JSON-LD) for different page types
 */
export function generateStructuredData(
	type: "website" | "article" | "organization",
	data?: any,
) {
	const baseData = {
		"@context": "https://schema.org",
	};

	switch (type) {
		case "website":
			return {
				...baseData,
				"@type": "WebSite",
				name: siteConfig.name,
				description: siteConfig.description,
				url: siteConfig.url,
				inLanguage: "en-US",
			};

		case "organization":
			return {
				...baseData,
				"@type": "Organization",
				name: siteConfig.name,
				description: siteConfig.description,
				url: siteConfig.url,
				sameAs: [
					// Add social media URLs here
				],
			};

		case "article":
			if (!data) return null;
			return {
				...baseData,
				"@type": "Article",
				headline: data.title,
				description: data.description,
				image: data.image || `${siteConfig.url}/og-image.svg`,
				url: data.url,
				datePublished: data.publishedTime,
				dateModified: data.modifiedTime || data.publishedTime,
				author: {
					"@type": "Person",
					name: data.author || siteConfig.author,
				},
				publisher: {
					"@type": "Organization",
					name: siteConfig.name,
				},
				mainEntityOfPage: {
					"@type": "WebPage",
					"@id": data.url,
				},
			};

		default:
			return null;
	}
}

/**
 * Truncate text for meta descriptions
 */
export function truncateDescription(
	text: string,
	maxLength: number = 160,
): string {
	if (text.length <= maxLength) return text;

	// Find the last space before the limit to avoid cutting words
	const truncated = text.substring(0, maxLength);
	const lastSpace = truncated.lastIndexOf(" ");

	if (lastSpace > 0) {
		return `${truncated.substring(0, lastSpace)}...`;
	}

	return `${truncated}...`;
}

/**
 * Clean and prepare text for meta tags (remove HTML, normalize whitespace)
 */
export function cleanTextForMeta(text: string): string {
	return text
		.replace(/<[^>]*>/g, "") // Remove HTML tags
		.replace(/\s+/g, " ") // Normalize whitespace
		.trim();
}

/**
 * Generate meta description from message content
 */
export function generateMessageDescription(
	messageText: string,
	authorName?: string,
): string {
	const cleanText = cleanTextForMeta(messageText);
	const authorSuffix = authorName ? ` - ${authorName}` : "";
	const baseDescription = `${cleanText}${authorSuffix} | Positive message shared on positive.help`;

	return truncateDescription(baseDescription, 160);
}
