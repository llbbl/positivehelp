type TimingPhase =
	| "rate_limit"
	| "lookup"
	| "navigation"
	| "message"
	| "fetch"
	| "parse";

/** Per-operation elapsed time, including time spent waiting on rejected work. */
export function createRequestTiming() {
	const started = performance.now();
	const phases: Partial<Record<TimingPhase, number>> = {};
	return {
		async measure<T>(phase: TimingPhase, work: () => Promise<T>): Promise<T> {
			const start = performance.now();
			try {
				return await work();
			} finally {
				phases[phase] = performance.now() - start;
			}
		},
		snapshot() {
			return { ...phases, total: performance.now() - started };
		},
	};
}

export function serverTimingHeader(timings: Record<string, number>): string {
	return Object.entries(timings)
		.map(([name, duration]) => `${name};dur=${duration.toFixed(1)}`)
		.join(", ");
}
