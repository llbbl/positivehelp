import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

// Background colors matching the page (from tailwind.config.js)
const bgColors = [
	"#c1f3cc", // custom-green
	"#C1F3E7", // custom-mint
	"#a7def8", // custom-blue
	"#cfa7f8", // custom-purple
	"#F8A7F6", // custom-pink
	"#f8f8c7", // custom-yellow
	"#f8d7c7", // custom-orange
	"#f8c7c7", // custom-red
] as const;

// Simple hash function to get deterministic color from slug
function hashCode(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return Math.abs(hash);
}

function getColorFromSlug(slug: string): string {
	const index = hashCode(slug) % bgColors.length;
	return bgColors[index];
}

// Truncate text for display
function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.substring(0, maxLength).trim()}...`;
}

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params;

	try {
		// Fetch message data from the API
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
		const response = await fetch(`${baseUrl}/api/messages/${slug}`, {
			cache: "no-store",
		});

		if (!response.ok) {
			// Return a fallback image for not found
			return new ImageResponse(
				<div
					style={{
						width: "100%",
						height: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						backgroundColor: "#c1f3cc",
						fontFamily: "system-ui, sans-serif",
					}}
				>
					<div
						style={{
							fontSize: 64,
							fontWeight: 600,
							color: "#166534",
						}}
					>
						positive.help
					</div>
				</div>,
				{ width: 1200, height: 630 },
			);
		}

		const message = await response.json();
		const bgColor = getColorFromSlug(slug);
		const messageText = truncateText(message.text, 200);
		const authorName =
			message.authors?.length > 0
				? message.authors.map((a: { name: string }) => a.name).join(", ")
				: null;

		return new ImageResponse(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					backgroundColor: bgColor,
					fontFamily: "system-ui, sans-serif",
					padding: 48,
				}}
			>
				{/* Header - branding */}
				<div
					style={{
						display: "flex",
						justifyContent: "flex-start",
						marginBottom: 24,
					}}
				>
					<span
						style={{
							fontSize: 28,
							fontWeight: 600,
							color: "#166534",
						}}
					>
						positive.help
					</span>
				</div>

				{/* Main content - centered message */}
				<div
					style={{
						display: "flex",
						flex: 1,
						alignItems: "center",
						justifyContent: "center",
						padding: "0 24px",
					}}
				>
					<div
						style={{
							fontSize: messageText.length > 100 ? 48 : messageText.length > 50 ? 56 : 72,
							fontWeight: 500,
							textAlign: "center",
							lineHeight: 1.2,
							color: "#1a1a1a",
							maxWidth: "100%",
						}}
					>
						{messageText}
					</div>
				</div>

				{/* Footer - author and date */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-end",
						marginTop: 24,
					}}
				>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: 4,
						}}
					>
						{authorName && (
							<span
								style={{
									fontSize: 24,
									color: "#374151",
								}}
							>
								— {authorName}
							</span>
						)}
						<span
							style={{
								fontSize: 18,
								color: "#6b7280",
							}}
						>
							{message.date}
						</span>
					</div>
				</div>
			</div>,
			{
				width: 1200,
				height: 630,
				headers: {
					"Cache-Control": "public, max-age=31536000, immutable",
				},
			},
		);
	} catch (error) {
		console.error("Error generating OG image:", error);

		// Return fallback image on error
		return new ImageResponse(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#c1f3cc",
					fontFamily: "system-ui, sans-serif",
				}}
			>
				<div
					style={{
						fontSize: 64,
						fontWeight: 600,
						color: "#166534",
					}}
				>
					positive.help
				</div>
			</div>,
			{ width: 1200, height: 630 },
		);
	}
}
