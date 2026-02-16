import { supabase } from '../lib/supabase'

export interface Contact {
  id: string
  phone: string
  name: string | null
  source: string
  tags: string[] | null
  notes: string | null
  last_message_at: string | null
  last_message_preview: string | null
  total_messages_in: number
  total_messages_out: number
  is_active: boolean
  created_at: string
  updated_at: string
  has_unread_inbound?: boolean // Custom field to indicate unread inbound message
}

export interface Message {
  id: string
  wamid: string | null
  from_number: string
  to_number: string
  direction: 'inbound' | 'outbound'
  message_type: string
  message_body: string | null
  media_url: string | null
  media_mime_type: string | null
  template_name: string | null
  is_reply: boolean
  reply_to_wamid: string | null
  button_text: string | null
  status: string
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  failed_at: string | null
  failure_reason: string | null
  contact_id: string | null
  created_at: string
  updated_at: string
}

// Fetch all contacts with their actual last message
export const fetchContacts = async (): Promise<Contact[]> => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching contacts:', error)
    throw error
  }

  if (!data || data.length === 0) {
    return []
  }

  // For each contact, get the actual last message (inbound or outbound)
  const contactsWithLastMessage = await Promise.all(
    data.map(async (contact) => {
      // Get messages by contact_id
      const { data: messagesByContactId, error: errorByContactId } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', contact.id)

      // Get messages by phone number (in case contact_id is not set)
      const { data: messagesByPhone, error: errorByPhone } = await supabase
        .from('messages')
        .select('*')
        .or(`from_number.eq.${contact.phone},to_number.eq.${contact.phone}`)

      if (errorByContactId || errorByPhone) {
        console.error(`Error fetching messages for contact ${contact.id}:`, errorByContactId || errorByPhone)
        return contact
      }

      // Combine and deduplicate messages
      const allMessages = [...(messagesByContactId || []), ...(messagesByPhone || [])]
      const uniqueMessages = Array.from(
        new Map(allMessages.map(msg => [msg.id, msg])).values()
      )

      if (uniqueMessages.length > 0) {
        // Sort by timestamp to get the latest message
        const sortedMessages = uniqueMessages.sort((a, b) => {
          const timeA = a.sent_at ? new Date(a.sent_at).getTime() : new Date(a.created_at).getTime()
          const timeB = b.sent_at ? new Date(b.sent_at).getTime() : new Date(b.created_at).getTime()
          return timeB - timeA // Descending order (newest first)
        })

        const lastMessage = sortedMessages[0]
        const messageTimestamp = lastMessage.sent_at || lastMessage.created_at
        
        // Get message preview text
        let preview = ''
        if (lastMessage.message_type === 'button' && lastMessage.button_text) {
          preview = lastMessage.button_text
        } else if (lastMessage.message_body) {
          preview = lastMessage.message_body
        } else if (lastMessage.media_url) {
          preview = '[Image]'
        } else {
          preview = '[Media]'
        }

        // Truncate preview if too long
        if (preview.length > 50) {
          preview = preview.substring(0, 50) + '...'
        }

        // Check if last message is inbound and unread
        // A message is unread if it's inbound and read_at is null
        const hasUnreadInbound = lastMessage.direction === 'inbound' && 
                                 !lastMessage.read_at

        console.log(`Contact ${contact.name || contact.phone}: Last message at ${messageTimestamp}, preview: ${preview}, unread: ${hasUnreadInbound}`)
        
        return {
          ...contact,
          last_message_at: messageTimestamp,
          last_message_preview: preview,
          has_unread_inbound: hasUnreadInbound,
        }
      }

      return contact
    })
  )

  // Sort by last_message_at (most recent first)
  contactsWithLastMessage.sort((a, b) => {
    if (!a.last_message_at && !b.last_message_at) return 0
    if (!a.last_message_at) return 1
    if (!b.last_message_at) return -1
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  })

  console.log('Contacts sorted by last message:', contactsWithLastMessage.map(c => ({
    name: c.name || c.phone,
    last_message_at: c.last_message_at,
    preview: c.last_message_preview
  })))

  return contactsWithLastMessage
}

// Fetch messages for a specific contact
export const fetchMessages = async (contactId: string): Promise<Message[]> => {
  // First, get the contact to get the phone number
  const contact = await fetchContact(contactId)
  if (!contact) {
    console.error('Contact not found')
    return []
  }

  // Fetch messages by contact_id
  const { data: dataByContactId, error: errorByContactId } = await supabase
    .from('messages')
    .select('*')
    .eq('contact_id', contactId)

  // Also fetch messages by phone number (in case contact_id is not set on some messages)
  const { data: dataByPhone, error: errorByPhone } = await supabase
    .from('messages')
    .select('*')
    .or(`from_number.eq.${contact.phone},to_number.eq.${contact.phone}`)

  if (errorByContactId || errorByPhone) {
    console.error('Error fetching messages:', errorByContactId || errorByPhone)
    throw errorByContactId || errorByPhone
  }

  // Combine and deduplicate messages
  const allMessages = [...(dataByContactId || []), ...(dataByPhone || [])]
  const uniqueMessages = Array.from(
    new Map(allMessages.map(msg => [msg.id, msg])).values()
  )

  // Sort messages by the most appropriate timestamp
  // Use sent_at if available, otherwise use created_at
  const sortedMessages = uniqueMessages.sort((a, b) => {
    const timeA = a.sent_at ? new Date(a.sent_at).getTime() : new Date(a.created_at).getTime()
    const timeB = b.sent_at ? new Date(b.sent_at).getTime() : new Date(b.created_at).getTime()
    return timeA - timeB
  })

  console.log(`Fetched ${sortedMessages.length} messages for contact ${contactId} (${contact.phone}):`, {
    inbound: sortedMessages.filter(m => m.direction === 'inbound').length,
    outbound: sortedMessages.filter(m => m.direction === 'outbound').length,
    messages: sortedMessages.map(m => ({
      id: m.id,
      direction: m.direction,
      body: m.message_body?.substring(0, 30) || m.button_text,
    })),
  })

  return sortedMessages
}

// Fetch a single contact by ID
export const fetchContact = async (contactId: string): Promise<Contact | null> => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single()

  if (error) {
    console.error('Error fetching contact:', error)
    return null
  }

  return data
}

// Subscribe to new messages for a contact
export const subscribeToMessages = (
  contactId: string,
  callback: (message: Message) => void
) => {
  const channel = supabase
    .channel(`messages:${contactId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `contact_id=eq.${contactId}`,
      },
      (payload) => {
        callback(payload.new as Message)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// Subscribe to contact updates
export const subscribeToContacts = (callback: (contact: Contact) => void) => {
  const channel = supabase
    .channel('contacts')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'contacts',
      },
      (payload) => {
        callback(payload.new as Contact)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// Create a new message in Supabase
export const createMessage = async (
  contactId: string,
  toNumber: string,
  fromNumber: string,
  messageBody: string,
  messageType: string = 'text'
): Promise<Message | null> => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      contact_id: contactId,
      from_number: fromNumber,
      to_number: toNumber,
      direction: 'outbound',
      message_type: messageType,
      message_body: messageBody,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating message:', error)
    throw error
  }

  return data
}

// Get the from_number (business WhatsApp number) from environment or use a default
export const getFromNumber = (): string => {
  return import.meta.env.VITE_WHATSAPP_FROM_NUMBER || '917011219741' // Default fallback
}

// Update message status (useful for updating after webhook response)
export const updateMessageStatus = async (
  messageId: string,
  status: string,
  failureReason?: string
): Promise<Message | null> => {
  const updateData: any = {
    status: status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'delivered') {
    updateData.delivered_at = new Date().toISOString()
  } else if (status === 'read') {
    updateData.read_at = new Date().toISOString()
  } else if (status === 'failed') {
    updateData.failed_at = new Date().toISOString()
    if (failureReason) {
      updateData.failure_reason = failureReason
    }
  }

  const { data, error } = await supabase
    .from('messages')
    .update(updateData)
    .eq('id', messageId)
    .select()
    .single()

  if (error) {
    console.error('Error updating message status:', error)
    throw error
  }

  return data
}

// Mark all unread inbound messages for a contact as read
export const markMessagesAsRead = async (contactId: string): Promise<void> => {
  const contact = await fetchContact(contactId)
  if (!contact) {
    console.error('Contact not found')
    return
  }

  const now = new Date().toISOString()

  // First, get all unread inbound messages for this contact
  const { data: unreadMessages, error: fetchError } = await supabase
    .from('messages')
    .select('id')
    .eq('contact_id', contactId)
    .eq('direction', 'inbound')
    .is('read_at', null)

  if (fetchError) {
    console.error('Error fetching unread messages:', fetchError)
    throw fetchError
  }

  if (!unreadMessages || unreadMessages.length === 0) {
    console.log(`No unread inbound messages for contact ${contactId}`)
    return
  }

  // Update all unread inbound messages
  const messageIds = unreadMessages.map(msg => msg.id)
  const { error } = await supabase
    .from('messages')
    .update({
      status: 'read',
      read_at: now,
      updated_at: now,
    })
    .in('id', messageIds)

  if (error) {
    console.error('Error marking messages as read:', error)
    throw error
  }

  console.log(`Marked ${messageIds.length} inbound messages as read for contact ${contactId}`)
}
