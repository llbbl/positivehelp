import { getAppOrigin, getAppUrl } from "@/lib/app-origin";

describe("canonical application origin", () => {
	it("prefers and normalizes an explicitly configured origin", () => {
		expect(
			getAppOrigin({
				NEXT_PUBLIC_APP_URL: "https://preview.example.com/",
				VERCEL_ENV: "preview",
				NEXT_PUBLIC_VERCEL_BRANCH_URL: "ignored.vercel.app",
			}),
		).toBe("https://preview.example.com");
	});

	it("uses the Vercel branch URL for preview deployments", () => {
		expect(
			getAppOrigin({
				NODE_ENV: "production",
				VERCEL_ENV: "preview",
				NEXT_PUBLIC_VERCEL_BRANCH_URL: "feature-positivehelp.vercel.app",
			}),
		).toBe("https://feature-positivehelp.vercel.app");
	});

	it("uses the Vercel project URL for production deployments", () => {
		expect(
			getAppOrigin({
				NODE_ENV: "production",
				VERCEL_ENV: "production",
				NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: "positivehelp.vercel.app",
			}),
		).toBe("https://positivehelp.vercel.app");
	});

	it("uses the URL Coolify injects for the deployment", () => {
		expect(
			getAppOrigin({
				NODE_ENV: "production",
				COOLIFY_URL: "https://positivehelp-pr-269.preview.positive.help",
			}),
		).toBe("https://positivehelp-pr-269.preview.positive.help");
	});

	it("accepts a bare COOLIFY_FQDN when COOLIFY_URL is absent", () => {
		expect(
			getAppOrigin({
				NODE_ENV: "production",
				COOLIFY_FQDN: "positivehelp-pr-269.preview.positive.help",
			}),
		).toBe("https://positivehelp-pr-269.preview.positive.help");
	});

	it("takes the first domain when Coolify injects a comma-separated list", () => {
		expect(
			getAppOrigin({
				NODE_ENV: "production",
				COOLIFY_URL: "https://positive.help,https://www.positive.help:8080",
			}),
		).toBe("https://positive.help");
	});

	it("falls back to the production origin when Coolify injects a mangled value", () => {
		// coollabsio/coolify#10824 can emit an unparseable COOLIFY_URL. A bad
		// platform-injected value must not take the deployment down.
		expect(
			getAppOrigin({
				NODE_ENV: "production",
				COOLIFY_URL: "https://positive.help:https://www.positive.help",
			}),
		).toBe("https://positive.help");
	});

	it("falls through to COOLIFY_FQDN when COOLIFY_URL is set but empty", () => {
		expect(
			getAppOrigin({
				NODE_ENV: "production",
				COOLIFY_URL: "",
				COOLIFY_FQDN: "pr-269.preview.positive.help",
			}),
		).toBe("https://pr-269.preview.positive.help");
	});

	it("recovers via COOLIFY_FQDN when COOLIFY_URL is mangled", () => {
		// coollabsio/coolify#10824 corrupts COOLIFY_URL but leaves COOLIFY_FQDN
		// usable, so an unparseable URL must not stop the fallback being tried.
		expect(
			getAppOrigin({
				NODE_ENV: "production",
				COOLIFY_URL: "https://positive.help:https://www.positive.help",
				COOLIFY_FQDN: "pr-269.preview.positive.help",
			}),
		).toBe("https://pr-269.preview.positive.help");
	});

	it("ignores an empty Coolify value rather than treating it as configured", () => {
		expect(
			getAppOrigin({
				NODE_ENV: "production",
				COOLIFY_URL: "   ",
			}),
		).toBe("https://positive.help");
	});

	it.each(["development", "test", undefined] as const)(
		"uses localhost when NODE_ENV is %s",
		(nodeEnvironment) => {
			expect(getAppOrigin({ NODE_ENV: nodeEnvironment })).toBe(
				"http://localhost:3000",
			);
		},
	);

	it("uses the public domain as the production fallback", () => {
		expect(getAppOrigin({ NODE_ENV: "production" })).toBe(
			"https://positive.help",
		);
	});

	it("builds absolute application URLs from the resolved origin", () => {
		expect(
			getAppUrl("/api/messages/hello%20world", {
				NEXT_PUBLIC_APP_URL: "https://example.com/",
			}),
		).toBe("https://example.com/api/messages/hello%20world");
	});

	it.each([
		"not-a-url",
		"ftp://example.com",
		"https://user:secret@example.com",
		"https://example.com/app",
		"https://example.com?preview=true",
		"https://example.com/#section",
	])("rejects a non-origin NEXT_PUBLIC_APP_URL value: %s", (value) => {
		expect(() => getAppOrigin({ NEXT_PUBLIC_APP_URL: value })).toThrow();
	});
});
