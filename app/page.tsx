import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { GET } from "./api/messages/route"
import MessageList from "@/components/MessageList"
import type { Message } from "@/components/MessageList"

export default async function Home() {
  // Call GET without arguments for server-side rendering
  const response = await GET();
  const messages = await response.json() as Message[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-custom-blue via-custom-mint to-custom-green">
      <main className="container mx-auto p-6 space-y-4">
        <h2 className="text-3xl font-bold mb-6">Just Positive Vibes</h2>
        <MessageList initialMessages={messages} />
      </main>
    </div>
  )
}

