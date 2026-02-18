import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react'
import { fetchMessages, fetchContact, markMessagesAsRead, Message, Contact } from '../services/supabaseService'
import MessageInput from './MessageInput'
import './ChatView.css'

interface ChatViewProps {
  contactId: string | null
  onMessagesRead?: () => void
  onContactUpdate?: (contactId: string, updates: Partial<Contact>) => void
}

const ChatView = ({ contactId, onMessagesRead, onContactUpdate }: ChatViewProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevContactIdRef = useRef<string | null>(null)
  const subscriptionRef = useRef<any>(null)

  // Load contact and messages when contactId changes
  useEffect(() => {
    if (contactId) {
      // Only reload if contactId actually changed
      if (prevContactIdRef.current !== contactId) {
        setError(null)
        loadContact()
        loadMessages()
        prevContactIdRef.current = contactId
        
        // Set up real-time subscription for new messages
        setupMessageSubscription(contactId)
        
        // Mark messages as read when contact changes
        markMessagesAsRead(contactId)
          .then(() => {
            // Update contact locally instead of triggering full refresh
            if (onContactUpdate) {
              onContactUpdate(contactId, { has_unread_inbound: false })
            }
            // Still call onMessagesRead for any other side effects, but debounced
            if (onMessagesRead) {
              // Use setTimeout to debounce the refresh
              setTimeout(() => {
                onMessagesRead()
              }, 500)
            }
          })
          .catch((error) => {
            console.error('Failed to mark messages as read:', error)
          })
      }
    } else {
      setMessages([])
      setContact(null)
      setError(null)
      setHasMoreMessages(false)
      prevContactIdRef.current = null
      // Clean up subscription
      if (subscriptionRef.current) {
        subscriptionRef.current()
        subscriptionRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    
    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current()
        subscriptionRef.current = null
      }
    }
  }, [contactId])

  // Scroll to bottom when messages are loaded or updated
  useEffect(() => {
    if (messages.length > 0) {
      // Always scroll to bottom when messages are first loaded or when new messages arrive
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
      }, 100)
    }
  }, [messages.length]) // Only trigger when message count changes

  // Scroll to bottom when contact changes (new chat opened)
  useEffect(() => {
    if (contactId && messages.length > 0) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
      }, 200)
    }
  }, [contactId])

  const loadContact = useCallback(async () => {
    if (!contactId) return
    try {
      const data = await fetchContact(contactId)
      setContact(data)
    } catch (error) {
      console.error('Failed to load contact:', error)
    }
  }, [contactId])

  const loadMessages = useCallback(async () => {
    if (!contactId) return
    try {
      setLoading(true)
      setError(null)
      const result = await fetchMessages(contactId, 1000) // Load up to 1000 messages
      setMessages(result.messages)
      setHasMoreMessages(result.hasMore)
      
      // Scroll to bottom after messages are loaded
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
      }, 300)
    } catch (error: any) {
      console.error('Failed to load messages:', error)
      setError(error.message || 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [contactId])

  // Set up real-time subscription for new messages
  const setupMessageSubscription = useCallback((contactId: string) => {
    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current()
    }

    // Import subscribeToMessages
    import('../services/supabaseService').then(({ subscribeToMessages }) => {
      subscriptionRef.current = subscribeToMessages(contactId, (newMessage) => {
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          if (prev.some(msg => msg.id === newMessage.id || msg.wamid === newMessage.wamid)) {
            return prev
          }
          // Add new message and sort
          const updated = [...prev, newMessage]
          return updated.sort((a, b) => {
            const timeA = a.sent_at ? new Date(a.sent_at).getTime() : new Date(a.created_at).getTime()
            const timeB = b.sent_at ? new Date(b.sent_at).getTime() : new Date(b.created_at).getTime()
            return timeA - timeB
          })
        })
        // Auto-scroll to bottom when new message arrives
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      })
    }).catch((error) => {
      console.error('Failed to set up message subscription:', error)
    })
  }, [])

  const getMessageTimestamp = useCallback((message: Message) => {
    return message.sent_at || message.created_at
  }, [])

  const formatMessageTime = useCallback((message: Message) => {
    const timestamp = getMessageTimestamp(message)
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }, [getMessageTimestamp])

  const formatDateHeader = useCallback((message: Message) => {
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
  }, [getMessageTimestamp])

  const handleNewMessage = useCallback((newMessage: Message) => {
    setMessages((prev) => [...prev, newMessage])
    // Scroll to bottom after new message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [])

  // Memoize message rendering to prevent unnecessary re-renders
  // MUST be called before any conditional returns to follow Rules of Hooks
  const messageElements = useMemo(() => {
    return messages.map((message, index) => {
      const currentTimestamp = getMessageTimestamp(message)
      const prevTimestamp = index > 0 ? getMessageTimestamp(messages[index - 1]) : null
      
      const showDateHeader =
        index === 0 ||
        (prevTimestamp && new Date(currentTimestamp).toDateString() !== new Date(prevTimestamp).toDateString())

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
                  loading="lazy"
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
  }, [messages, getMessageTimestamp, formatDateHeader, formatMessageTime])

  // Early returns AFTER all hooks
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
        <div className="loading-spinner"></div>
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
        {error && (
          <div className="chat-error">
            <span>⚠️ {error}</span>
            <button onClick={loadMessages} className="retry-button">Retry</button>
          </div>
        )}
        {messages.length === 0 && !loading ? (
          <div className="no-messages">No messages yet. Start the conversation!</div>
        ) : (
          <>
            {hasMoreMessages && (
              <div className="messages-info">
                Showing {messages.length} most recent messages
              </div>
            )}
            {messageElements}
          </>
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
