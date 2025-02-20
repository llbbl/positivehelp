// app/api/messages/[slug]/route.ts
import { NextResponse } from 'next/server';
import client from '@/lib/db';
import logger from '@/lib/logger'; // Import your logger

const isString = (value: unknown): value is string => typeof value === 'string';

// Export the Message interface
export interface Message {
  id: number;
  text: string;
  date: string;
  url: string;
  authors: Array<{ id: number; name: string }>;
}

export async function GET(
  request: Request,
  context: { params: { slug: string } }
) {
  const { slug } = context.params;
  try {
    logger.info('API Route: /api/messages/[slug] - Entry', { slug });


    if ( !slug ) {
      logger.warn('API Route: Invalid slug (empty)', { slug });
      return NextResponse.json( { error: 'Invalid slug' }, { status: 400 } );
    }

    // First get the current message's ID
        logger.info('API Route: Before currentMessage query', { slug });
    const currentMessage = await client.execute( {
      sql: `SELECT id FROM messages WHERE slug = ?`,
      args: [ slug ]
    } );
        logger.info('API Route: After currentMessage query', { currentMessage });


    if ( !currentMessage.rows.length ) {
        logger.warn('API Route: Message not found (currentMessage)', { slug });
      return NextResponse.json( { error: 'Message not found' }, { status: 404 } );
    }

    const currentId = currentMessage.rows[0].id as number;
        logger.info('API Route: Current message ID', { currentId });


    // Get navigation info
        logger.info('API Route: Before navigation query', { currentId });
    const navigationResult = await client.execute( {
      sql: `
        SELECT 
          (SELECT slug FROM messages WHERE id < ? ORDER BY id DESC LIMIT 1) as prevSlug,
          (SELECT slug FROM messages WHERE id > ? ORDER BY id ASC LIMIT 1) as nextSlug
      `,
      args: [ currentId, currentId ]
    } );
    logger.info('API Route: After navigation query', { navigationResult });


    const navigation = {
      prevSlug: navigationResult.rows[0].prevSlug as string | null,
      nextSlug: navigationResult.rows[0].nextSlug as string | null,
    };

    // Get the message details as before
    logger.info('API Route: Before message details query', { slug });
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
    logger.info('API Route: After message details query', { result });


    if ( !result.rows.length ) {
      logger.warn('API Route: Message not found (result)', { slug });
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

    logger.info('API Route: Returning message', { messageId: message.id });
    return NextResponse.json( message );

  } catch (error) {
    logger.error('API Route: Error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined, // Log the stack trace
      slug,
    });
    return NextResponse.json( { error: 'Failed to fetch message' }, { status: 500 } );
  }
}