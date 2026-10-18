import { NextResponse } from "next/server";

/**
 * Liveness, not readiness: reports only that the process is serving and never
 * touches Turso. Failing on a database blip would make the orchestrator restart
 * a healthy container, turning a partial outage into a full one.
 */
export const dynamic = "force-dynamic";

export function GET() {
	return NextResponse.json(
		{ status: "ok" },
		{ headers: { "Cache-Control": "no-store" } },
	);
}
