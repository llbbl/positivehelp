// next.config.ts
import type { NextConfig } from "next";

console.log("--- next.config.ts: Build-Time Logging ---");
console.log("process.env.VERCEL_ENV:", process.env.VERCEL_ENV);
console.log("process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL:", process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL);
console.log("process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL:", process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL);
console.log("process.env.NEXT_PUBLIC_APP_URL (before config):", process.env.NEXT_PUBLIC_APP_URL);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_URL:
      process.env.VERCEL_ENV === "preview" &&
      process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
        : process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000",
  },
  reactStrictMode: true,
};

console.log("process.env.NEXT_PUBLIC_APP_URL (after config):", process.env.NEXT_PUBLIC_APP_URL);
console.log("--- End of next.config.ts Logging ---");

export default nextConfig;