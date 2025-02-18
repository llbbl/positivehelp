// app/messages/[slug]/page.tsx (or .jsx, wherever this component lives)
import type { Message } from "@/app/api/messages/[slug]/route";
import MessageDisplay from './message-display';

const bgColors = [
  'bg-custom-green',
  'bg-custom-mint',
  'bg-custom-blue',
  'bg-custom-purple',
  'bg-custom-pink',
  'bg-custom-yellow',
  'bg-custom-orange',
  'bg-custom-red',
] as const;

function getRandomColor() {
  const randomIndex = Math.floor(Math.random() * bgColors.length);
  return bgColors[randomIndex];
}

export default async function MessagePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const bgColor = getRandomColor();

      // --- LOGGING: Environment Variables ---
    console.log("--- MessagePage: Server-Side Logging ---");
    console.log("process.env.NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);
    console.log("process.env.VERCEL_ENV:", process.env.VERCEL_ENV);
    console.log("process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL:", process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL);
    console.log("process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL:", process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL);


  try {

    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/messages/${slug}`;
    // --- LOGGING: Constructed URL ---
    console.log("API URL:", apiUrl);


    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // --- LOGGING: Response Status ---
    console.log("Response Status:", response.status);
    console.log("Response Headers", response.headers);

    if (!response.ok) {
      // Log the response body as text, even if it's not JSON.  This is *crucial* for debugging.
      const responseText = await response.text();
      console.error("Response Body (Error):", responseText);
      throw new Error(`Error: ${response.status} - ${responseText}`); // Include responseText in the error
    }

    const message = await response.json() as Message & {
      navigation: { prevSlug: string | null, nextSlug: string | null }
    };

    return <MessageDisplay message={message} bgColor={bgColor} />;

  } catch (error) {
    // --- LOGGING: Errors ---
    console.error("Error in MessagePage:", error);
    return (
      <div className={`min-h-screen ${bgColor}`}>
        <main className="container mx-auto p-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-red-600">Failed to load message. Please try again later.</p>
            {/* Optionally display the error message (for debugging, not production): */}
            <p className="text-red-600">Error: {error instanceof Error ? error.message : String(error)}</p>
          </div>
        </main>
      </div>
    );
  }
}