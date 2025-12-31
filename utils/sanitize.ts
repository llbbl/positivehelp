export function sanitizeContent(text: string): string {
	return (
		text
			// Remove script tags and their contents first
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
			// Then remove other HTML tags
			.replace(/<[^>]*>/g, "")
			// Remove URLs (including FTP) but preserve "from"
			.replace(/\b(?:https?|ftp):\/\/\S+\b/gi, "")
			// Remove special characters but keep basic punctuation and apostrophes
			.replace(/[^\w\s.,!?'-]/g, "")
			// Remove SQL keywords (with word boundaries) - comprehensive list for injection prevention
			.replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|WHERE|FROM|JOIN|EXEC|EXECUTE|DECLARE|CAST|CONVERT)\b/gi, "")
			// Trim whitespace
			.trim()
			// Normalize whitespace (including newlines and tabs)
			.replace(/\s+/g, " ")
			// Clean up any double spaces that might have been created
			.replace(/\s{2,}/g, " ")
	);
}
