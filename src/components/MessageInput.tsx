import { useState } from 'react'
import { sendMessage } from '../services/webhookService'
import { Message } from '../services/supabaseService'
import './MessageInput.css'

interface MessageInputProps {
  contactId: string
  toNumber: string
  onMessageSent: (message: Message) => void
}

const MessageInput = ({ contactId, toNumber, onMessageSent }: MessageInputProps) => {
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!messageText.trim() || sending) return

    const text = messageText.trim()
    setMessageText('')
    setSending(true)

    try {
      // Send to n8n webhook - n8n will create the message in Supabase
      const result = await sendMessage(toNumber, text, contactId)

      if (result.success) {
        // Create a temporary message object to show immediately
        // The actual message will be created by n8n workflow in Supabase
        const tempMessage: Message = {
          id: `temp-${Date.now()}`,
          wamid: null,
          from_number: '',
          to_number: toNumber,
          direction: 'outbound',
          message_type: 'text',
          message_body: text,
          media_url: null,
          media_mime_type: null,
          template_name: null,
          is_reply: false,
          reply_to_wamid: null,
          button_text: null,
          status: 'sent',
          sent_at: new Date().toISOString(),
          delivered_at: null,
          read_at: null,
          failed_at: null,
          failure_reason: null,
          contact_id: contactId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        onMessageSent(tempMessage)
      } else {
        alert(`Failed to send message: ${result.error}`)
        setMessageText(text) // Restore the message text
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      alert(`Error: ${error.message || 'Failed to send message'}`)
      setMessageText(text) // Restore the message text
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="message-input-container">
      <div className="message-input-wrapper">
        <textarea
          className="message-input"
          placeholder="Type a message"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={1}
          disabled={sending}
        />
      </div>
      {messageText.trim() ? (
        <button
          className="message-input-send"
          onClick={handleSend}
          disabled={sending}
          title="Send"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  )
}

export default MessageInput
