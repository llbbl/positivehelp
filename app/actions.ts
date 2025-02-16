"use server"

import { sanitizeContent } from '@/utils/sanitize';

export async function createMessage(formData: FormData) {
  const content = formData.get('content')
  
  if (!content || typeof content !== 'string') {
    return { error: 'Message content is required' }
  }

  const sanitizedContent = sanitizeContent(content);
  
  if (sanitizedContent.length < 3) {
    return { error: 'Message is too short' }
  }

  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/messages`;
    console.log('Attempting to post to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: sanitizedContent }),
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`Failed to create message: ${response.status} ${errorText}`);
    }

    return { success: true }
  } catch (error) {
    console.error('Error details:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create message' }
  }
}