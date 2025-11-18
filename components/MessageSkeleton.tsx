import { Skeleton } from "@/components/ui/skeleton";

export function MessageSkeleton() {
	return (
		<div className="block p-1 rounded-lg space-y-2">
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-3/4" />
			<Skeleton className="h-3 w-20" />
		</div>
	);
}

export function MessageListSkeleton({ count = 5 }: { count?: number }) {
	return (
		<div className="space-y-3">
			{Array.from({ length: count }).map((_, i) => (
				<MessageSkeleton key={i} />
			))}
		</div>
	);
}
