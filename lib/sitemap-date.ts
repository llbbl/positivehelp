const MILLISECONDS_EPOCH_THRESHOLD = 100_000_000_000;
const ISO_DATE_PATTERN =
	/^(\d{4})-(\d{2})-(\d{2})(?:[Tt](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(?:[Zz]|[+-](\d{2}):?(\d{2}))?)?$/;

function validDate(value: string | number | Date): Date | undefined {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseISODate(value: string): Date | undefined {
	const match = ISO_DATE_PATTERN.exec(value);
	if (!match) {
		return undefined;
	}

	const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
		match;
	const year = Number(yearText);
	const month = Number(monthText);
	const day = Number(dayText);
	const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
	const daysInMonth = [
		31,
		isLeapYear ? 29 : 28,
		31,
		30,
		31,
		30,
		31,
		31,
		30,
		31,
		30,
		31,
	];

	if (month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) {
		return undefined;
	}
	if (
		(hourText !== undefined && Number(hourText) > 23) ||
		(minuteText !== undefined && Number(minuteText) > 59) ||
		(secondText !== undefined && Number(secondText) > 59)
	) {
		return undefined;
	}

	const date = validDate(value);
	if (!date) {
		return undefined;
	}
	if (!hourText && date.toISOString().slice(0, 10) !== value) {
		return undefined;
	}
	return date;
}

export function parseSitemapDate(value: unknown): Date | undefined {
	if (value instanceof Date) {
		return validDate(value);
	}

	if (typeof value === "number" || typeof value === "bigint") {
		const timestamp = Number(value);
		if (!Number.isFinite(timestamp)) {
			return undefined;
		}
		const milliseconds =
			Math.abs(timestamp) < MILLISECONDS_EPOCH_THRESHOLD
				? timestamp * 1000
				: timestamp;
		return validDate(milliseconds);
	}

	if (typeof value !== "string" || value.trim() === "") {
		return undefined;
	}

	const normalized = value.trim();
	if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) {
		return parseSitemapDate(Number(normalized));
	}
	if (/^\d{4}-\d{2}-\d{2}/.test(normalized)) {
		return parseISODate(normalized);
	}
	return undefined;
}

export function resolveSitemapLastModified(
	approvalDate: unknown,
	originalDate: unknown,
): Date | undefined {
	return parseSitemapDate(approvalDate) ?? parseSitemapDate(originalDate);
}
