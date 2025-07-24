import { NextResponse } from 'next/server';
import client from '@/lib/db';
import { Row } from '@libsql/client';
import { generateMD5, generateSlug } from '@/utils/text';
import { isUserAdmin } from '@/lib/auth';
import { auth, currentUser } from "@clerk/nextjs/server";
import logger from '@/lib/logger';
import { getOrCreateAuthor } from '@/lib/authors';
import { getMessages } from '@/lib/messages';

// This is the API route handler for client-side requests
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    
    // Safely parse the t parameter as an integer
    let bypassCache = false;
    if (url.searchParams.has('t')) {
      const tParam = url.searchParams.get('t');
      // Only consider it valid if it can be parsed as a number
      const tValue = tParam ? parseInt(tParam, 10) : NaN;
      bypassCache = !isNaN(tValue);
    }
    
    // Safely parse the lastId parameter as an integer
    let lastId: number | undefined = undefined;
    if (url.searchParams.has('lastId')) {
      const lastIdParam = url.searchParams.get('lastId');
      const lastIdValue = lastIdParam ? parseInt(lastIdParam, 10) : NaN;
      // Only set lastId if it's a valid number
      if (!isNaN(lastIdValue) && lastIdValue > 0) {
        lastId = lastIdValue;
      }
    }
    
    const messages = await getMessages(lastId);

    // Set appropriate cache control headers based on the request
    const headers = new Headers();
    
    if (bypassCache || lastId !== undefined) {
      // For requests with timestamp parameter or lastId, disable caching
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
    } else {
      // For normal requests, allow caching for a short period (5 minutes)
      headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    }

    return NextResponse.json(messages, { headers });
  } catch (error) {
    logger.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { text, author, clerkUserId } = body;

    // Validate required fields
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    if (!clerkUserId || typeof clerkUserId !== 'string') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate text length
    if (text.trim().length < 3) {
      return NextResponse.json({ error: 'Message is too short' }, { status: 400 });
    }

    if (text.length > 1000) {
      return NextResponse.json({ error: 'Message is too long' }, { status: 400 });
    }

    // Validate author if provided
    if (author && (typeof author !== 'string' || author.length > 100)) {
      return NextResponse.json({ error: 'Invalid author name' }, { status: 400 });
    }

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
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      if (session.userId !== clerkUserId) {
        return NextResponse.json({ error: 'User authentication mismatch' }, { status: 403 });
      }

      // Get the full user object for admin check
      const user = await currentUser();
      if (!user) {
        return NextResponse.json({ error: 'Failed to get user details' }, { status: 401 });
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
