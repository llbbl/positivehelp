import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="min-h-screen bg-custom-solitude">
			<div className="container mx-auto py-10">
				<Skeleton className="h-8 w-32 mb-8" />
				<Skeleton className="h-4 w-96 mb-6" />
				<div className="space-y-6">
					{/* Create form skeleton */}
					<div className="rounded-lg border bg-white p-6 shadow-sm">
						<Skeleton className="h-6 w-48 mb-4" />
						<div className="flex gap-4">
							<Skeleton className="h-10 flex-1" />
							<Skeleton className="h-10 w-28" />
						</div>
					</div>
					{/* Token list skeleton */}
					<div className="rounded-lg border bg-white p-6 shadow-sm">
						<Skeleton className="h-6 w-36 mb-4" />
						<div className="space-y-4">
							<Skeleton className="h-20 w-full" />
							<Skeleton className="h-20 w-full" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
