// components/RuntimeLogger.tsx
"use client"; // This is crucial: forces this to be a client component

import { useEffect } from 'react';

export default function RunTimeLogger() {
  useEffect(() => {
    console.log("--- RuntimeLogger: Client-Side Logging ---");
    console.log("process.env.NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);
    // You *could* log other environment variables here, but they shouldn't
    // be different from the build-time values in a properly configured setup.
    // The key is NEXT_PUBLIC_APP_URL.
  }, []); // Empty dependency array: runs only once on mount

  return null; // This component doesn't render anything
}