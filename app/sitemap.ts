import type { MetadataRoute } from "next";
import client from "@/lib/db";
import logger from "@/lib/logger";
import { siteConfig } from "@/lib/seo";
import { resolveSitemapLastModified } from "@/lib/sitemap-date";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = siteConfig.url;

	// Static pages
	const staticPages: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 1,
		},
		{
			url: `${baseUrl}/add`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
	];

	try {
		// Fetch all published messages for dynamic pages
		const result = await client.execute({
			sql: `
        SELECT slug, date, approvalDate
        FROM messages
        WHERE slug IS NOT NULL
        ORDER BY id DESC
      `,
			args: [],
		});

		const messagePages: MetadataRoute.Sitemap = result.rows.map((row) => {
			const lastModified = resolveSitemapLastModified(
				row.approvalDate,
				row.date,
			);

			return {
				url: `${baseUrl}/msg/${row.slug}`,
				...(lastModified ? { lastModified } : {}),
				changeFrequency: "weekly" as const,
				priority: 0.9,
			};
		});

		return [...staticPages, ...messagePages];
	} catch (error) {
		logger.error("Error generating sitemap", {
			error: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
		});
		// Return static pages only if there's an error
		return staticPages;
	}
}
