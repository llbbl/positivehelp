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
    };

    return NextResponse.json( message );
  } catch (error) {
    return NextResponse.json( { error: 'Failed to fetch message' }, { status: 500 } );
  }
}
