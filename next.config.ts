import type { NextConfig } from "next";
import { getAppOrigin } from "./lib/app-origin";

const appUrl = getAppOrigin();

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
