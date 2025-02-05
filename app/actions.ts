"use server"

export async function createMessage(formData: FormData) {
  const content = formData.get('content')
  
  if (!content || typeof content !== 'string') {
    return { error: 'Message content is required' }
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: content }),
    })

    if (!response.ok) {
      throw new Error('Failed to create message')
    }

    return { success: true }
  } catch (error) {
    return { error: 'Failed to create message' }
  }
}

