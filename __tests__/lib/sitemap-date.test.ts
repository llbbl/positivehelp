import { describe, expect, it } from "@jest/globals";
import {
	parseSitemapDate,
	resolveSitemapLastModified,
} from "@/lib/sitemap-date";

describe("parseSitemapDate", () => {
	it("accepts Date and ISO/date strings", () => {
		const date = new Date("2026-07-18T12:34:56.000Z");
		expect(parseSitemapDate(date)).toEqual(date);
		expect(parseSitemapDate("2026-07-18T12:34:56.000Z")).toEqual(date);
		expect(parseSitemapDate("2026-07-18")).toEqual(
			new Date("2026-07-18T00:00:00.000Z"),
		);
	});

	it("accepts valid leap days", () => {
		expect(parseSitemapDate("2024-02-29")).toEqual(
			new Date("2024-02-29T00:00:00.000Z"),
		);
		expect(parseSitemapDate("2000-02-29T12:00:00.000Z")).toEqual(
			new Date("2000-02-29T12:00:00.000Z"),
		);
	});

	it.each([
		"2026-02-29",
		"2026-02-30",
		"2026-02-30T12:00:00.000Z",
		"2026-04-31",
		"2026-13-01",
	])("rejects impossible ISO calendar date %s", (value) => {
		expect(parseSitemapDate(value)).toBeUndefined();
	});

	it("accepts numeric epoch seconds and milliseconds", () => {
		const expected = new Date("2026-07-18T12:34:56.000Z");
		const seconds = expected.getTime() / 1000;
		const milliseconds = expected.getTime();

		expect(parseSitemapDate(seconds)).toEqual(expected);
		expect(parseSitemapDate(String(seconds))).toEqual(expected);
		expect(parseSitemapDate(milliseconds)).toEqual(expected);
		expect(parseSitemapDate(String(milliseconds))).toEqual(expected);
	});

	it("returns undefined for invalid or missing values", () => {
		expect(parseSitemapDate(undefined)).toBeUndefined();
		expect(parseSitemapDate(null)).toBeUndefined();
		expect(parseSitemapDate("")).toBeUndefined();
		expect(parseSitemapDate("not-a-date")).toBeUndefined();
		expect(parseSitemapDate("02/30/2026")).toBeUndefined();
		expect(parseSitemapDate(new Date(Number.NaN))).toBeUndefined();
	});
});

describe("resolveSitemapLastModified", () => {
	it("prefers approval date and falls back to the original date", () => {
		expect(resolveSitemapLastModified("2026-07-18", "2025-01-01")).toEqual(
			new Date("2026-07-18T00:00:00.000Z"),
		);
		expect(resolveSitemapLastModified("invalid", "2025-01-01")).toEqual(
			new Date("2025-01-01T00:00:00.000Z"),
		);
	});

	it("uses stable omission when neither date is valid", () => {
		expect(resolveSitemapLastModified(null, "invalid")).toBeUndefined();
	});
});
