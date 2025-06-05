import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { getMessages } from "@/lib/messages"
import MessageList from "@/components/MessageList"

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
  )
}

