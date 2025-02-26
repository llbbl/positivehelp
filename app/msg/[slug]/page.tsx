// page component
import type { Message } from "@/app/api/messages/[slug]/route";
import MessageDisplay from './message-display';
import logger from '@/lib/logger';

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

  try {
    logger.info(`Page: Fetching message for slug: ${slug}`);

    // Construct the absolute URL using NEXT_PUBLIC_APP_URL
    const absoluteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/messages/${slug}`;

    const response = await fetch(absoluteUrl, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      logger.error('API request failed', {
        status: response.status,
        statusText: response.statusText,
        url: absoluteUrl
      });
      throw new Error(`Failed to fetch message: ${response.status} ${response.statusText}`);
    }

    const message = await response.json() as Message & {
      navigation: { prevSlug: string | null, nextSlug: string | null }
    };

    logger.info(`Page: Successfully fetched message`, { messageId: message.id });

    return (
      <>
        <MessageDisplay message={message} bgColor={bgColor} />
      </>
    );

  } catch (error) {
    logger.error('Page: Error fetching message', {
      error: error instanceof Error ? error.message : 'Unknown error',
      slug,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/messages/${slug}`
    });

    return (
      <div className={`min-h-screen ${bgColor}`}>
        <main className="container mx-auto p-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-red-600">Failed to load message. Please try again later.</p>
            {process.env.NODE_ENV !== 'production' && error instanceof Error && (
              <p className="text-sm text-gray-600 mt-2">{error.message}</p>
            )}
          </div>
        </main>
      </div>
    );
  }
}