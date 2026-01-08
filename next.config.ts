import type { NextConfig } from "next";

let appUrl: string;

if (
	process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL &&
	process.env.VERCEL_ENV === "preview"
) {
	appUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`;
} else if (
	process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL &&
	process.env.VERCEL_ENV === "production"
) {
	appUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;
} else if (process.env.VERCEL_ENV === "development") {
	appUrl = "http://localhost:3000";
} else {
	appUrl = "https://positive.help";
}

const nextConfig: NextConfig = {
	env: {
		NEXT_PUBLIC_APP_URL: appUrl,
	},
	reactStrictMode: true,
	output: "standalone",
	// Include libsql native modules in standalone output
	outputFileTracingIncludes: {
		"/api/**": [
			"./node_modules/@libsql/**",
			"./node_modules/.pnpm/@libsql*/**",
			"./node_modules/.pnpm/libsql*/**",
		],
	},
};

export default nextConfig;
