import type { NextConfig } from "next";
import { getAppOrigin } from "./lib/app-origin";

const appUrl = getAppOrigin();

const nextConfig: NextConfig = {
	env: {
		NEXT_PUBLIC_APP_URL: appUrl,
	},
	reactStrictMode: true,
	output: "standalone",
	// Include libsql native modules in standalone output.
	// Patterns must match files only: Turbopack's file tracer reads every match
	// as a file, so a bare `**` (which also matches directories such as
	// @libsql/core) makes `next build` fail with "Is a directory".
	outputFileTracingIncludes: {
		"/api/**": [
			"./node_modules/@libsql/**/*.*",
			"./node_modules/.pnpm/@libsql*/**/*.*",
			"./node_modules/.pnpm/libsql*/**/*.*",
		],
	},
};

export default nextConfig;
