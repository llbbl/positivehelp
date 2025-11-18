import { ClerkProvider } from "@clerk/nextjs";
import type React from "react";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { Navigation } from "@/components/Navigation";
import { generateSEOMetadata, generateStructuredData } from "@/lib/seo";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

// Generate base metadata for the site
export const metadata = generateSEOMetadata({
	// Uses defaults from siteConfig
});

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Generate structured data for the website
	const websiteStructuredData = generateStructuredData("website");
	const organizationStructuredData = generateStructuredData("organization");

	return (
		<ClerkProvider>
			<html lang="en">
				<head>
					{/* Structured Data */}
					{websiteStructuredData && (
						<script
							type="application/ld+json"
							dangerouslySetInnerHTML={{
								__html: JSON.stringify(websiteStructuredData),
							}}
						/>
					)}
					{organizationStructuredData && (
						<script
							type="application/ld+json"
							dangerouslySetInnerHTML={{
								__html: JSON.stringify(organizationStructuredData),
							}}
						/>
					)}
				</head>
				<body
					className={`${geistSans.variable} ${geistMono.variable} antialiased`}
				>
					<Navigation />
					<main>{children}</main>
				</body>
			</html>
		</ClerkProvider>
	);
}
