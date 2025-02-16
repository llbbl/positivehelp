import type { Message } from "@/app/api/messages/[slug]/route";


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
  const randomIndex = Math.floor( Math.random() * bgColors.length );
  return bgColors[randomIndex];
}

export default async function MessagePage( { params }: { params: Promise<{ slug: string }> } ) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  // Get a random background color
  const bgColor = getRandomColor();

  try {
    const response = await fetch( `${ process.env.NEXT_PUBLIC_APP_URL }/api/messages/${ slug }`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    } );

    if ( !response.ok ) {
      throw new Error( `Error: ${ response.status }` );
    }

    const message = await response.json() as Message;

    return (
      <div className={ `min-h-screen ${ bgColor }` }>
        <main className="relative min-h-[calc(100vh-4rem)] p-6 flex items-center justify-center">
          <div className="max-w-[90%]">
            <h1 className="text-[8vw] leading-tight font-medium text-center">{ message.text }</h1>
          </div>
          <span className="absolute bottom-6 left-6 text-sm text-gray-600">{ message.date }</span>
        </main>
      </div>
    );
  } catch (error) {
    return (
      <div className={ `min-h-screen ${ bgColor }` }>
        <main className="container mx-auto p-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-red-600">Failed to load message. Please try again later.</p>
          </div>
        </main>
      </div>
    );
  }
}