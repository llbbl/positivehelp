import client from "@/lib/db";

/**
 * Get or create an author by name
 * @param authorName The name of the author
 * @returns The author ID as a number, or null if no author name provided
 */
export async function getOrCreateAuthor(
	authorName: string | null | undefined,
): Promise<number | null> {
	if (!authorName) {
		return null;
	}

	const authorResult = await client.execute({
		sql: "SELECT id FROM authors WHERE name = ?",
		args: [authorName],
	});

	if (authorResult.rows.length > 0) {
		const authorId = authorResult.rows[0].id;
		if (typeof authorId === "bigint") {
			return Number(authorId);
		}
		if (typeof authorId === "number") {
			return authorId;
		}
		throw new Error("Invalid author id type");
	}

	// Author doesn't exist, create it
	const newAuthorResult = await client.execute({
		sql: "INSERT INTO authors (name) VALUES (?)",
		args: [authorName],
	});

	const rowId = newAuthorResult.lastInsertRowid;
	if (typeof rowId === "bigint") {
		return Number(rowId);
	}
	if (typeof rowId === "number") {
		return rowId;
	}
	throw new Error("Failed to insert author");
}
