// next.config.ts
import type { NextConfig } from "next";

console.log("--- next.config.ts: Build-Time Logging ---");
console.log("process.env.VERCEL_ENV:", process.env.VERCEL_ENV);
console.log("process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL:", process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL);
console.log("process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL:", process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL);
console.log("process.env.NEXT_PUBLIC_APP_URL (before config):", process.env.NEXT_PUBLIC_APP_URL);

let appUrl: string;

if (process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL) {
  appUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`;
} else if (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) {
  appUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;
} else {
  appUrl = "http://localhost:3000";
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_URL: appUrl,
  },
  reactStrictMode: true,
};

console.log("process.env.NEXT_PUBLIC_APP_URL (after config):", process.env.NEXT_PUBLIC_APP_URL);
console.log("--- End of next.config.ts Logging ---");

export default nextConfig;