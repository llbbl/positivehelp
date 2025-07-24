'use client'

import { useEffect } from 'react'
import logger from '@/lib/client-logger'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Global error boundary triggered', {
      error: error.message,
      digest: error.digest,
      stack: error.stack
    })
  }, [error])

  return (
    <div className="min-h-screen bg-custom-blue">
      <main className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg p-8 shadow-sm text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong!</h1>
          <p className="text-gray-600 mb-6">
            We encountered an unexpected error. This has been logged and we'll look into it.
          </p>
          {process.env.NODE_ENV !== 'production' && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                Error Details (Development)
              </summary>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
          <div className="space-x-4">
            <button
              onClick={reset}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
            <a 
              href="/" 
              className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}