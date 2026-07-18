const LOCAL_APP_ORIGIN = "http://localhost:3000";
const PRODUCTION_APP_ORIGIN = "https://positive.help";

type AppOriginEnvironment = Partial<
	Pick<
		NodeJS.ProcessEnv,
		| "NEXT_PUBLIC_APP_URL"
		| "NEXT_PUBLIC_VERCEL_BRANCH_URL"
		| "NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL"
		| "RAILWAY_PUBLIC_DOMAIN"
		| "VERCEL_ENV"
		| "NODE_ENV"
	>
>;

function normalizeOrigin(value: string, source: string): string {
	let url: URL;

	try {
		url = new URL(value);
	} catch {
		throw new Error(`${source} must be a valid URL origin`);
	}

	if (url.protocol !== "http:" && url.protocol !== "https:") {
		throw new Error(`${source} must use http or https`);
	}

	if (
		url.username ||
		url.password ||
		url.pathname !== "/" ||
		url.search ||
		url.hash
	) {
		throw new Error(
			`${source} must be an origin without credentials, a path, query, or hash`,
		);
	}

	return url.origin;
}

function deploymentDomainOrigin(value: string): string {
	return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/**
 * Resolve the one canonical application origin used by server-side fetches and
 * metadata. Explicit configuration wins, followed by deployment-provided URLs,
 * localhost outside production, and the public production domain.
 */
export function getAppOrigin(
	environment: AppOriginEnvironment = process.env,
): string {
	const configuredOrigin = environment.NEXT_PUBLIC_APP_URL?.trim();
	if (configuredOrigin) {
		return normalizeOrigin(configuredOrigin, "NEXT_PUBLIC_APP_URL");
	}

	const vercelEnvironment = environment.VERCEL_ENV;
	const vercelBranchUrl = environment.NEXT_PUBLIC_VERCEL_BRANCH_URL?.trim();
	if (vercelEnvironment === "preview" && vercelBranchUrl) {
		return normalizeOrigin(
			deploymentDomainOrigin(vercelBranchUrl),
			"NEXT_PUBLIC_VERCEL_BRANCH_URL",
		);
	}

	const vercelProductionUrl =
		environment.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim();
	if (vercelEnvironment === "production" && vercelProductionUrl) {
		return normalizeOrigin(
			deploymentDomainOrigin(vercelProductionUrl),
			"NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL",
		);
	}

	const railwayPublicDomain = environment.RAILWAY_PUBLIC_DOMAIN?.trim();
	if (railwayPublicDomain) {
		return normalizeOrigin(
			deploymentDomainOrigin(railwayPublicDomain),
			"RAILWAY_PUBLIC_DOMAIN",
		);
	}

	if (
		environment.NODE_ENV !== "production" ||
		vercelEnvironment === "development"
	) {
		return LOCAL_APP_ORIGIN;
	}

	return PRODUCTION_APP_ORIGIN;
}

export function getAppUrl(
	pathname: string,
	environment: AppOriginEnvironment = process.env,
): string {
	return new URL(pathname, `${getAppOrigin(environment)}/`).toString();
}
