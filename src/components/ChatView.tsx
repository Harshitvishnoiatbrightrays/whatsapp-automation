import { useEffect, useState, useRef } from 'react'
import { fetchMessages, fetchContact, markMessagesAsRead, Message, Contact } from '../services/supabaseService'
import MessageInput from './MessageInput'
import './ChatView.css'

interface ChatViewProps {
  contactId: string | null
  onMessagesRead?: () => void
}

const ChatView = ({ contactId, onMessagesRead }: ChatViewProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contactId) {
      loadContact()
      loadMessages()
      // Mark all inbound messages as read when contact is selected
      markMessagesAsRead(contactId)
        .then(() => {
          // Refresh contact list to update unread indicators
          if (onMessagesRead) {
            onMessagesRead()
          }
        })
        .catch((error) => {
          console.error('Failed to mark messages as read:', error)
        })
    } else {
      setMessages([])
      setContact(null)
    }
  }, [contactId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadContact = async () => {
    if (!contactId) return
    try {
      const data = await fetchContact(contactId)
      setContact(data)
    } catch (error) {
      console.error('Failed to load contact:', error)
    }
  }

  const loadMessages = async () => {
    if (!contactId) return
    try {
      setLoading(true)
      const data = await fetchMessages(contactId)
      console.log('Loaded messages:', data.length, {
        inbound: data.filter(m => m.direction === 'inbound').length,
        outbound: data.filter(m => m.direction === 'outbound').length,
      })
      setMessages(data)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getMessageTimestamp = (message: Message) => {
    return message.sent_at || message.created_at
  }

  const formatMessageTime = (message: Message) => {
    const timestamp = getMessageTimestamp(message)
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDateHeader = (message: Message) => {
    const timestamp = getMessageTimestamp(message)
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }
  }

  const handleNewMessage = (newMessage: Message) => {
    setMessages((prev) => [...prev, newMessage])
  }

  if (!contactId) {
    return (
      <div className="chat-view-empty">
        <div className="chat-view-empty-content">
          <img src="/logo.png" alt="Logo" className="chat-view-empty-logo" />
          <h2>Select a contact to start chatting</h2>
          <p>Choose a contact from the list to view and send messages</p>
        </div>
      </div>
    )
  }

  if (loading && messages.length === 0) {
    return (
      <div className="chat-view-loading">
        <div>Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="chat-view">
      <div className="chat-view-header">
        <div className="chat-view-header-info">
          <div className="chat-view-avatar">
            {contact
              ? contact.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || contact.phone.slice(-2)
              : '?'}
          </div>
          <div className="chat-view-header-text">
            <h3>{contact?.name || contact?.phone || 'Unknown'}</h3>
            <span className="chat-view-status">
              {contact?.phone || ''}
            </span>
          </div>
        </div>
        <div className="chat-view-header-actions">
        </div>
      </div>

      <div className="chat-view-messages">
        {messages.length === 0 && !loading ? (
          <div className="no-messages">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((message, index) => {
            const currentTimestamp = getMessageTimestamp(message)
            const prevTimestamp = index > 0 ? getMessageTimestamp(messages[index - 1]) : null
            
            const showDateHeader =
              index === 0 ||
              (prevTimestamp && new Date(currentTimestamp).toDateString() !== new Date(prevTimestamp).toDateString())

            // Get message content - use button_text for button messages, otherwise message_body
            const messageContent = message.message_type === 'button' && message.button_text
              ? message.button_text
              : message.message_body || ''

            const isOutbound = message.direction === 'outbound'

            return (
              <div key={message.id} className="message-wrapper">
                {showDateHeader && (
                  <div className="message-date-header">
                    {formatDateHeader(message)}
                  </div>
                )}
                <div
                  className={`message-bubble ${isOutbound ? 'outbound' : 'inbound'} ${
                    isOutbound && message.status === 'failed' ? 'failed' : ''
                  } ${message.media_url ? 'has-media' : ''}`}
                >
                  {message.media_url && (
                    <div className="message-media">
                      <img 
                        src={message.media_url} 
                        alt={messageContent || 'Media'} 
                        className="message-image"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {messageContent && (
                    <div className="message-content">
                      {messageContent}
                    </div>
                  )}
                  <div className="message-meta">
                    <span className="message-time">
                      {formatMessageTime(message)}
                    </span>
                    {isOutbound && (
                      <>
                        {message.status === 'failed' ? (
                          <span className="message-status failed-status">
                            Failed to send
                          </span>
                        ) : (
                          <span className={`message-status ${
                            message.status === 'read' ? 'read' : 
                            message.status === 'delivered' ? 'delivered' : 
                            'sent'
                          }`}>
                            {message.status === 'read' || message.status === 'delivered' ? (
                              <span className="double-check">✓✓</span>
                            ) : (
                              <span className="single-check">✓</span>
                            )}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        contactId={contactId}
        toNumber={contact?.phone || ''}
        onMessageSent={handleNewMessage}
      />
    </div>
  )
}

export default ChatView
