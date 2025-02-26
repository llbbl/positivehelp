import React from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Geist, Geist_Mono } from "next/font/google"
import { Navigation } from '@/components/Navigation'

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
          <Navigation />
          <main>
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}
