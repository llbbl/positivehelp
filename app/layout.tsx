import React from 'react'
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import './globals.css'
import { Geist, Geist_Mono } from "next/font/google"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { AdminLink } from '@/components/admin-link'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <nav className="flex items-center justify-between p-4 bg-green-300">
            <Link href="/" className="text-xl font-semibold hover:text-green-800">
              positive.help
            </Link>

            <div className="flex items-center gap-4">
              <SignedIn>
                <Button variant="ghost" className="text-green-800 hover:bg-green-50">
                  <Link href="/submissions">
                    Submissions
                  </Link>
                </Button>
              </SignedIn>
              <Button className="bg-white text-green-800 hover:bg-green-50">
                <PlusCircle className="w-4 h-4 mr-2" />
                <Link href="/add">
                  Add Positivity
                </Link>
              </Button>
              <SignedIn>
                <AdminLink />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal" />
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </nav>
          <main>
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}
