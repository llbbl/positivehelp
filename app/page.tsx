import MessageList from "@/components/MessageList";
import { getMessages } from "@/lib/messages";
import { generateSEOMetadata } from "@/lib/seo";

// Generate specific metadata for the homepage
export const metadata = generateSEOMetadata({
	title: "Share Positive Messages and Spread Good Vibes",
	description:
		"Discover uplifting messages, motivational quotes, and positive content shared by our community. Add your own positive message to brighten someone's day.",
	keywords: [
		"positive messages",
		"uplifting quotes",
		"motivation",
		"inspiration",
		"good vibes",
		"community",
		"mental health",
		"wellness",
	],
	type: "website",
});

export default async function Home() {
	// Use the getMessages function for server-side rendering
	const messages = await getMessages();

	return (
		<div className="min-h-screen bg-linear-to-b from-custom-blue via-custom-mint to-custom-green">
			<main className="container mx-auto p-6 space-y-4">
				<h2 className="text-3xl font-bold mb-6">Just Positive Vibes</h2>
				<MessageList initialMessages={messages} />
			</main>
		</div>
	);
}
