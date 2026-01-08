import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Security headers for all responses.
 *
 * CSP is configured to allow:
 * - Clerk authentication scripts and styles
 * - Next.js inline scripts (required for hydration)
 * - Tailwind styles
 */
const securityHeaders = {
	// Prevent clickjacking attacks
	"X-Frame-Options": "DENY",

	// Prevent MIME type sniffing
	"X-Content-Type-Options": "nosniff",

	// Control referrer information sent with requests
	"Referrer-Policy": "strict-origin-when-cross-origin",

	// Content Security Policy
	// Allows Clerk, Next.js inline scripts, and self-hosted resources
	"Content-Security-Policy": [
		"default-src 'self'",
		// Scripts: self, inline (Next.js), eval (Next.js dev), Clerk domains (including custom proxy domain)
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.positive.help https://*.up.railway.app",
		// Styles: self, inline (Tailwind)
		"style-src 'self' 'unsafe-inline'",
		// Images: self, data URIs, Clerk images, Railway PR previews
		"img-src 'self' data: https://*.clerk.com https://img.clerk.com https://clerk.positive.help https://*.up.railway.app",
		// Fonts: self, data URIs
		"font-src 'self' data:",
		// API connections: self, Clerk (including custom proxy domain), Railway PR previews
		"connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.positive.help https://*.up.railway.app",
		// Iframes: self, Clerk (for OAuth flows)
		"frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://clerk.positive.help https://*.up.railway.app",
		// Web workers: self and blob URLs (used by Clerk)
		"worker-src 'self' blob:",
		// Form submissions
		"form-action 'self'",
		// Base URI restriction
		"base-uri 'self'",
	].join("; "),

	// Prevent browsers from exposing sensitive info via cross-origin requests
	"X-XSS-Protection": "1; mode=block",

	// Control browser features
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

/**
 * Add security headers to the response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
	for (const [key, value] of Object.entries(securityHeaders)) {
		response.headers.set(key, value);
	}
	return response;
}

/**
 * Custom middleware that wraps Clerk middleware and adds security headers
 */
export default clerkMiddleware(async (_auth, request: NextRequest) => {
	// Create response with security headers
	const response = NextResponse.next();
	return addSecurityHeaders(response);
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
