import { NextResponse } from 'next/server';
import client from '@/lib/db';
import { Row } from '@libsql/client';
import { createHash } from 'crypto';

export interface Message {
  id: number;
  text: string;
  date: string;
  url: string;
}

export async function GET() {
  try {
    const result = await client.execute('SELECT id, msg as text, slug as url, date FROM messages ORDER BY id DESC');
    const messages = result.rows.map((row: Row) => ({
      id: row.id as number,
      text: row.text as string,
      date: row.date as string,
      url: row.url as string
    }));
    
    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
} 

function generateMD5(content: string): string {
  return createHash('md5')
    .update(content)
    .digest('hex');
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Generate hash first to check for duplicates
    const hash = generateMD5(text);

    // Check if message with this hash already exists
    const existing = await client.execute({
      sql: 'SELECT slug FROM messages WHERE hash = ?',
      args: [hash]
    });

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'This message already exists', slug: existing.rows[0].slug }, 
        { status: 409 }  // 409 Conflict is appropriate for duplicate resources
      );
    }
    
    // Create URL-friendly slug from the text
    const slug = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);

    const result = await client.execute({
      sql: 'INSERT INTO messages (msg, date, slug, hash) VALUES (?, ?, ?, ?)',
      args: [text, currentDate, slug, hash]
    });

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}