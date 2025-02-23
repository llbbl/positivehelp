import { NextResponse } from 'next/server';
import client from '@/lib/db';
import { Row } from '@libsql/client';
import { generateMD5, generateSlug } from '@/utils/text';
import { isUserAdmin } from '@/lib/auth';
import { auth, currentUser } from "@clerk/nextjs/server";
import logger from '@/lib/logger';

export interface Message {
  id: number;
  text: string;
  date: string;
  url: string;
  author?: string;
}

export async function GET() {
  try {
    const result = await client.execute( `
        SELECT id, msg as text, slug as url, date
        FROM messages
        ORDER BY id DESC
    ` );

    const messages = result.rows.map( ( row: Row ) => ({
      id: row.id as number,
      text: row.text as string,
      date: row.date as string,
      url: row.url as string,
    }) );

    return NextResponse.json( messages );
  } catch (error) {
    return NextResponse.json( { error: 'Failed to fetch messages' }, { status: 500 } );
  }
}


// --- Helper Function: getOrCreateAuthor ---
async function getOrCreateAuthor( authorName: string | null | undefined ): Promise<number | bigint | null> {
  if ( !authorName ) {
    return null;
  }

  let authorResult = await client.execute( {
    sql: 'SELECT id FROM authors WHERE name = ?',
    args: [ authorName ],
  } );

  if ( authorResult.rows.length > 0 ) {
    const authorId = authorResult.rows[0].id;
    if ( typeof authorId !== 'bigint' && typeof authorId !== 'number' ) {
      throw new Error( "author id invalid" )
    }
    return authorId;
  } else {
    const newAuthorResult = await client.execute( {
      sql: 'INSERT INTO authors (name) VALUES (?)',
      args: [ authorName ],
    } );
    if ( typeof newAuthorResult.lastInsertRowid !== 'bigint' && typeof newAuthorResult.lastInsertRowid !== 'number' ) {
      throw new Error( "Failed to insert author" )
    }
    return newAuthorResult.lastInsertRowid;
  }
}

export async function POST(request: Request) {
  try {
    const { text, author, clerkUserId } = await request.json();
    const currentDate = new Date().toISOString().split('T')[0];

    const hash = generateMD5(text);
    const slug = generateSlug(text, hash);

    // Check if message already exists
    const existing = await client.execute({
      sql: 'SELECT id, slug FROM messages WHERE hash = ?',
      args: [hash],
    });

    if (existing.rows.length > 0) {
      // --- Message Exists ---
      const existingMessageId = existing.rows[0].id;
      const existingSlug = existing.rows[0].slug;
      if (typeof existingMessageId !== 'bigint' && typeof existingMessageId !== 'number') {
        throw new Error("Invalid message id")
      }

      if (author) {
        const authorId = await getOrCreateAuthor(author);
        if (authorId !== null) {
          const attributionExists = await client.execute({
            sql: 'SELECT 1 FROM message_authors WHERE messageId = ? AND authorId = ?',
            args: [existingMessageId, authorId],
          });

          if (attributionExists.rows.length === 0) {
            await client.execute({
              sql: 'INSERT INTO message_authors (messageId, authorId) VALUES (?, ?)',
              args: [existingMessageId, authorId],
            });
          }
        }
      }

      return NextResponse.json({ success: true, slug: existingSlug });
    } else {
      // --- Message Doesn't Exist ---
      // Get the auth session
      const session = await auth();
      if (!session || !session.userId) {
        throw new Error('No authenticated user');
      }

      if (session.userId !== clerkUserId) {
        throw new Error('User ID mismatch');
      }

      // Get the full user object for admin check
      const user = await currentUser();
      if (!user) {
        throw new Error('Failed to get user details');
      }

      // console.log('Debug - Admin check:', {
      //   userId: user.id,
      //   metadata: user.publicMetadata,
      //   isAdmin: await isUserAdmin(user)
      // });

      const isAdmin = await isUserAdmin(user);
      
      if (isAdmin) {
        // Direct insert into messages for admins
        const messageResult = await client.execute({
          sql: 'INSERT INTO messages (msg, date, slug, hash, clerkUserId, approvalClerkUserId, approvalDate) VALUES (?, ?, ?, ?, ?, ?, ?)',
          args: [text, currentDate, slug, hash, clerkUserId, clerkUserId, currentDate],
        });

        if (typeof messageResult.lastInsertRowid !== 'bigint' && typeof messageResult.lastInsertRowid !== 'number') {
          throw new Error('Failed to get inserted message ID');
        }
        const messageId = messageResult.lastInsertRowid;

        if (author) {
          const authorId = await getOrCreateAuthor(author);
          if (authorId !== null) {
            await client.execute({
              sql: 'INSERT INTO message_authors (messageId, authorId) VALUES (?, ?)',
              args: [messageId, authorId],
            });
          }
        }
      } else {
        // Insert into submissions for non-admins
        const submissionResult = await client.execute({
          sql: 'INSERT INTO submissions (msg, date, slug, hash, clerkUserId, authorName) VALUES (?, ?, ?, ?, ?, ?)',
          args: [text, currentDate, slug, hash, clerkUserId, author],
        });

        if (typeof submissionResult.lastInsertRowid !== 'bigint' && typeof submissionResult.lastInsertRowid !== 'number') {
          throw new Error('Failed to get inserted submission ID');
        }
      }

      return NextResponse.json({ success: true, slug });
    }
  } catch (error) {
    logger.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
