"use server"


export async function createMessage(formData: FormData) {
  const content = formData.get('content')
  
  if (!content || typeof content !== 'string') {
    return { error: 'Message content is required' }
  }

  // Sanitize the content
  const sanitizedContent = sanitizeContent(content);
  
  // Check if content is too short after sanitization
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

function sanitizeContent(text: string): string {
  return text
    // Convert to plain text, remove HTML
    .replace(/<[^>]*>/g, '')
    // Remove URLs
    .replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove special characters but keep basic punctuation
    .replace(/[^\w\s.,!?-]/g, '')
    // Remove SQL keywords
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|WHERE|FROM)\b/gi, '')
    // Trim whitespace
    .trim()
    // Normalize whitespace
    .replace(/\s+/g, ' ');
}