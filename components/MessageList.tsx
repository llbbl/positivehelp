"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export interface Message {
  id: number;
  text: string;
  date: string;
  url: string;
  author?: string;
}

interface MessageListProps {
  initialMessages: Message[];
}

export default function MessageList({ initialMessages }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLatestMessages = async () => {
      try {
        setIsLoading(true);
        // Add a cache-busting query parameter to force a fresh fetch
        const response = await fetch(`/api/messages?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch latest messages');
        }
        
        const latestMessages = await response.json() as Message[];
        setMessages(latestMessages);
      } catch (error) {
        console.error('Error fetching latest messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch latest messages after component mounts
    fetchLatestMessages();

    // Optional: Set up polling for new messages every 30 seconds
    const intervalId = setInterval(fetchLatestMessages, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="space-y-3 relative">
      {isLoading && (
        <div className="absolute top-0 right-0 text-xs text-gray-500 animate-pulse">
          Refreshing...
        </div>
      )}
      {messages.map((message: Message) => (
        <Link
          href={`/msg/${message.url}`}
          key={message.id}
          className="block p-1 rounded-lg text-gray-800 hover:bg-gray-100/60 transition-all"
        >
          <p>{message.text}</p>
          <span className="text-sm text-gray-600">({message.date})</span>
        </Link>
      ))}
    </div>
  );
} 