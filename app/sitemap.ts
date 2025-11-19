import type { MetadataRoute } from "next";
import client from "@/lib/db";
import { siteConfig } from "@/lib/seo";
import logger from "@/lib/logger";

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
			// Use approval date if available, otherwise use original date
			let lastModified: Date;

			try {
				if (row.approvalDate && Number(row.approvalDate) > 0) {
					lastModified = new Date(Number(row.approvalDate) * 1000);
				} else if (row.date && Number(row.date) > 0) {
					lastModified = new Date(Number(row.date) * 1000);
				} else {
					// Fallback to current date if dates are invalid
					lastModified = new Date();
				}

				// Validate the date
				if (Number.isNaN(lastModified.getTime())) {
					lastModified = new Date();
				}
			} catch (_error) {
				// Fallback to current date if there's any error
				lastModified = new Date();
			}

			return {
				url: `${baseUrl}/msg/${row.slug}`,
				lastModified,
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
