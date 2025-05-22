import client from '@/lib/db';

export async function getOrCreateAuthor(authorName: string | null | undefined): Promise<number | bigint | null> {
  if (!authorName) {
    return null;
  }

  let authorResult = await client.execute({
    sql: 'SELECT id FROM authors WHERE name = ?',
    args: [authorName],
  });

  if (authorResult.rows.length > 0) {
    const authorId = authorResult.rows[0].id;
    if (typeof authorId !== 'bigint' && typeof authorId !== 'number') {
      throw new Error("author id invalid")
    }
    return authorId;
  } else {
    const newAuthorResult = await client.execute({
      sql: 'INSERT INTO authors (name) VALUES (?)',
      args: [authorName],
    });
    if (typeof newAuthorResult.lastInsertRowid !== 'bigint' && typeof newAuthorResult.lastInsertRowid !== 'number') {
      throw new Error("Failed to insert author")
    }
    return newAuthorResult.lastInsertRowid;
  }
} 