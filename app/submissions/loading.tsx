import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="min-h-screen bg-custom-solitude">
			<div className="container mx-auto py-10">
				<Skeleton className="h-8 w-48 mb-8" />
				<div className="space-y-8">
					<div>
						<Skeleton className="h-6 w-36 mb-4" />
						<div className="space-y-2">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					</div>
					<div>
						<Skeleton className="h-6 w-28 mb-4" />
						<div className="space-y-2">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					</div>
					<div>
						<Skeleton className="h-6 w-32 mb-4" />
						<div className="space-y-2">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
