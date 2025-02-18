import type { Message } from "@/app/api/messages/[slug]/route";
import MessageDisplay from './message-display';
import RunTimeLogger from "@/components/RunTimelogger";

// Define your custom colors
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

// Function to get random color
function getRandomColor() {
  const randomIndex = Math.floor(Math.random() * bgColors.length);
  return bgColors[randomIndex];
}

export default async function MessagePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const bgColor = getRandomColor();

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/messages/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const message = await response.json() as Message & { 
      navigation: { prevSlug: string | null, nextSlug: string | null } 
    };

    return (
      <>
        <RunTimeLogger /> 
        <MessageDisplay message={message} bgColor={bgColor} />
      </>
    );

  } catch (error) {
    return (
      <div className={`min-h-screen ${bgColor}`}>
        <main className="container mx-auto p-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-red-600">Failed to load message. Please try again later.</p>
          </div>
        </main>
      </div>
    );
  }
}