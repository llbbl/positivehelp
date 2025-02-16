import { NextResponse } from 'next/server';
import client from '@/lib/db';
import { Row } from '@libsql/client';
import { generateMD5, generateSlug } from '@/utils/text';

export interface Message {
  id: number;
  text: string;
  date: string;
  url: string;
  author?: string;
}

export async function GET() {
  try {
    const result = await client.execute(`
      SELECT m.id, m.msg as text, m.slug as url, m.date, a.name as author 
      FROM messages m 
      LEFT JOIN message_authors ma ON m.id = ma.messageId 
      LEFT JOIN authors a ON ma.authorId = a.id 
      ORDER BY m.id DESC
    `);

    const messages = result.rows.map((row: Row) => ({
      id: row.id as number,
      text: row.text as string,
      date: row.date as string,
      url: row.url as string,
      author: row.author as string | undefined
    }));

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { text, author, clerkUserId } = await request.json();
    const currentDate = new Date().toISOString().split('T')[0];

    const hash = generateMD5(text);
    const slug = generateSlug(text, hash);

    const existing = await client.execute({
      sql: 'SELECT slug FROM messages WHERE hash = ?',
      args: [hash],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'This message already exists', slug: existing.rows[0].slug },
        { status: 409 }
      );
    }

    // Insert the message
    const messageResult = await client.execute({
      sql: 'INSERT INTO messages (msg, date, slug, hash, clerkUserId) VALUES (?, ?, ?, ?, ?)',
      args: [text, currentDate, slug, hash, clerkUserId],
    });

    if (typeof messageResult.lastInsertRowid !== 'bigint' && typeof messageResult.lastInsertRowid !== 'number') {
      throw new Error('Failed to get inserted message ID');
    }
    const messageId = messageResult.lastInsertRowid;


    // Check if author exists
    let authorResult = await client.execute({
      sql: 'SELECT id FROM authors WHERE name = ?',
      args: [author],
    });

    let authorId;
    if (authorResult.rows.length === 0) {
      // Insert new author
      const newAuthorResult = await client.execute({
        sql: 'INSERT INTO authors (name) VALUES (?)',
        args: [author],
      });
        if (typeof newAuthorResult.lastInsertRowid !== 'bigint' && typeof newAuthorResult.lastInsertRowid !== 'number') {
            throw new Error("Failed to get author id")
        }
      authorId = newAuthorResult.lastInsertRowid;
    } else {
      authorId = authorResult.rows[0].id;
      if (typeof authorId !== 'bigint' && typeof authorId !== 'number'){
        throw new Error("Failed to get author id")
      }
    }

    // Create message-author relationship
    await client.execute({
      sql: 'INSERT INTO message_authors (messageId, authorId) VALUES (?, ?)',
      args: [messageId, authorId],
    });

    return NextResponse.json({ success: true, slug });

  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}