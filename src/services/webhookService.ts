// Send message via n8n webhook
export const sendMessage = async (
  toNumber: string,
  messageBody: string,
  contactId?: string
): Promise<{ success: boolean; error?: string }> => {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL

  if (!webhookUrl) {
    return { success: false, error: 'Webhook URL not configured' }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: toNumber,
        message: messageBody,
        contactId: contactId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.statusText}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error sending message:', error)
    return { success: false, error: error.message || 'Failed to send message' }
  }
}
