"use server"

import { sanitizeContent } from '@/utils/sanitize';
import { auth } from '@clerk/nextjs/server';

export async function createMessage( formData: FormData ) {
  const content = formData.get( 'content' )
  const author = formData.get( 'author' )
  const userId = formData.get( 'userId' )

  // console.log('Debug - Server action:', {
  //   receivedUserId: userId
  // });

  if ( !content || typeof content !== 'string' ) {
    return { error: 'Message content is required' }
  }

  // Author is now OPTIONAL, so we remove the check.

  if ( !userId || typeof userId !== 'string' ) {
    return { error: 'You must be logged in to add a message' }
  }

  const sanitizedContent = sanitizeContent( content );

  if ( sanitizedContent.length < 3 ) {
    return { error: 'Message is too short' }
  }

  try {
    const apiUrl = `${ process.env.NEXT_PUBLIC_APP_URL }/api/messages`;
    // console.log( 'Attempting to post to:', apiUrl );

    // Get the auth token
    const session = await auth();
    const token = await session.getToken();

    const response = await fetch( apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify( {
        text: sanitizedContent,
        author: author && typeof author === 'string' ? author : null,
        clerkUserId: userId
      } ),
    } )

    if ( !response.ok ) {
      const errorText = await response.text();
      console.error( 'API Error:', response.status, errorText );
      throw new Error( `Failed to create message: ${ response.status } ${ errorText }` );
    }

    return { success: true }
  } catch (error) {
    console.error( 'Error details:', error );
    return { error: error instanceof Error ? error.message : 'Failed to create message' }
  }
}