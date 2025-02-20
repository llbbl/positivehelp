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

export default async function MessagePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const bgColor = getRandomColor();

  try {
    logger.info(`Page: Fetching message for slug: ${slug}`);

    const apiUrl = `/api/messages/${slug}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      logger.error('API request failed', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl
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
      slug
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