import { NextResponse } from "next/server";

/**
 * Liveness probe for container orchestration (Coolify's healthcheck, the
 * Dockerfile HEALTHCHECK, and docker-compose all point here).
 *
 * Deliberately a *liveness* check, not a readiness check: it reports only that
 * the Node process is up and serving, and does not touch Turso. A health route
 * that fails when the database is unreachable would make Coolify tear down and
 * restart an otherwise-healthy container during a transient database blip,
 * turning a partial outage into a full one.
 */
export const dynamic = "force-dynamic";

export function GET() {
	return NextResponse.json(
		{ status: "ok" },
		{ headers: { "Cache-Control": "no-store" } },
	);
}
