"use server"

export async function createMessage(formData: FormData) {
  const content = formData.get('content')
  
  if (!content || typeof content !== 'string') {
    return { error: 'Message content is required' }
  }
    
//   console.log(content);

  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/messages`;
    console.log('Attempting to post to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: content }),
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

