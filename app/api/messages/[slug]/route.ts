import { NextResponse } from 'next/server';
import client from '@/lib/db';

const isString = (value: unknown): value is string => typeof value === 'string';

// Export the Message interface
export interface Message {
  id: number;
  text: string;
  date: string;
  url: string;
  authors: Array<{ id: number; name: string }>;
}

export async function GET( request: Request ) {
  try {
    const slug = request.url.split( '/' ).pop();
    if ( !slug ) {
      return NextResponse.json( { error: 'Invalid slug' }, { status: 400 } );
    }

    // First get the current message's ID
    const currentMessage = await client.execute( {
      sql: `SELECT id FROM messages WHERE slug = ?`,
      args: [ slug ]
    } );

    if ( !currentMessage.rows.length ) {
      return NextResponse.json( { error: 'Message not found' }, { status: 404 } );
    }

    const currentId = currentMessage.rows[0].id;

    // Get navigation info
    const navigationResult = await client.execute( {
      sql: `
        SELECT 
          (SELECT slug FROM messages WHERE id < ? ORDER BY id DESC LIMIT 1) as prevSlug,
          (SELECT slug FROM messages WHERE id > ? ORDER BY id ASC LIMIT 1) as nextSlug
      `,
      args: [ currentId, currentId ]
    } );

    const navigation = {
      prevSlug: navigationResult.rows[0].prevSlug,
      nextSlug: navigationResult.rows[0].nextSlug
    };

    // Get the message details as before
    const result = await client.execute( {
      sql: `
        SELECT 
          m.id, 
          m.msg as text, 
          m.slug as url, 
          m.date,
          CASE
            WHEN COUNT(a.id) = 0 THEN '[]'
            ELSE CONCAT('[',
                GROUP_CONCAT(
                  CASE
                    WHEN a.id IS NOT NULL THEN
                      json_object('id', a.id, 'name', a.name)
                    ELSE NULL
                  END
                )
              ,']')
            END as authors
        FROM messages m
        LEFT JOIN message_authors ma ON m.id = ma.messageId
        LEFT JOIN authors a ON ma.authorId = a.id
        WHERE m.slug = ?
        GROUP BY m.id, m.msg, m.slug, m.date
      `,
      args: [ slug ]
    } );

    if ( !result.rows.length ) {
      return NextResponse.json( { error: 'Message not found' }, { status: 404 } );
    }

    const row = result.rows[0];
    const authors = isString(row.authors) ? JSON.parse(row.authors as string) : [];

    const message = {
      id: row.id as number,
      text: row.text as string,
      date: row.date as string,
      url: row.url as string,
      authors,
      navigation
    };

    return NextResponse.json( message );
  } catch (error) {
    return NextResponse.json( { error: 'Failed to fetch message' }, { status: 500 } );
  }
}
