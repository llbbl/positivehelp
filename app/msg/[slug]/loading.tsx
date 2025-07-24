import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-custom-blue">
      <main className="relative min-h-[calc(100vh-4rem)] p-6 flex items-center justify-center">
        <div className="max-w-[90%] w-full">
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-3/4 mx-auto" />
            <Skeleton className="h-16 w-1/2 mx-auto" />
          </div>
          <div className="mt-8 text-right">
            <Skeleton className="h-4 w-32 ml-auto" />
          </div>
        </div>
        
        <div className="absolute bottom-6 left-6">
          <Skeleton className="h-4 w-20" />
        </div>
        
        <div className="absolute bottom-6 right-6">
          <Skeleton className="h-4 w-40" />
        </div>
      </main>
    </div>
  )
}