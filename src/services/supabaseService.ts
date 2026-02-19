import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'

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

// Fetch contact IDs and phone numbers that have at least one failed outbound message
export const fetchContactIdsWithFailedMessages = async (): Promise<{
  contactIds: Set<string>
  phoneNumbers: Set<string>
}> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('contact_id, to_number')
      .eq('direction', 'outbound')
      .eq('status', 'failed')

    if (error) {
      logger.error('Error fetching failed message contacts:', error)
      throw error
    }

    const contactIds = new Set<string>()
    const phoneNumbers = new Set<string>()

    ;(data || []).forEach((row: { contact_id: string | null; to_number: string }) => {
      if (row.contact_id) contactIds.add(row.contact_id)
      if (row.to_number) phoneNumbers.add(row.to_number)
    })

    return { contactIds, phoneNumbers }
  } catch (error) {
    logger.error('Error in fetchContactIdsWithFailedMessages:', error)
    throw error
  }
}

async function fetchContactIdsByOutboundStatus(
  status: string
): Promise<{ contactIds: Set<string>; phoneNumbers: Set<string> }> {
  const { data, error } = await supabase
    .from('messages')
    .select('contact_id, to_number')
    .eq('direction', 'outbound')
    .eq('status', status)

  if (error) {
    logger.error(`Error fetching contacts with ${status} messages:`, error)
    throw error
  }

  const contactIds = new Set<string>()
  const phoneNumbers = new Set<string>()
  ;(data || []).forEach((row: { contact_id: string | null; to_number: string }) => {
    if (row.contact_id) contactIds.add(row.contact_id)
    if (row.to_number) phoneNumbers.add(row.to_number)
  })
  return { contactIds, phoneNumbers }
}

// Fetch contact IDs and phone numbers that have at least one delivered outbound message
export const fetchContactIdsWithDeliveredMessages = async (): Promise<{
  contactIds: Set<string>
  phoneNumbers: Set<string>
}> => fetchContactIdsByOutboundStatus('delivered')

// Fetch contact IDs and phone numbers that have at least one read outbound message
export const fetchContactIdsWithReadMessages = async (): Promise<{
  contactIds: Set<string>
  phoneNumbers: Set<string>
}> => fetchContactIdsByOutboundStatus('read')

// Fetch contact IDs and phone numbers that have replied (at least one inbound message)
export const fetchContactIdsWithRepliedMessages = async (): Promise<{
  contactIds: Set<string>
  phoneNumbers: Set<string>
}> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('contact_id, from_number')
      .eq('direction', 'inbound')

    if (error) {
      logger.error('Error fetching replied contacts:', error)
      throw error
    }

    const contactIds = new Set<string>()
    const phoneNumbers = new Set<string>()
    ;(data || []).forEach((row: { contact_id: string | null; from_number: string }) => {
      if (row.contact_id) contactIds.add(row.contact_id)
      if (row.from_number) phoneNumbers.add(row.from_number)
    })
    return { contactIds, phoneNumbers }
  } catch (error) {
    logger.error('Error in fetchContactIdsWithRepliedMessages:', error)
    throw error
  }
}

// Fetch all contacts with their actual last message (optimized for production)
export const fetchContacts = async (): Promise<Contact[]> => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('is_active', true)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error) {
      logger.error('Error fetching contacts:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return []
    }

    // Optimized: Use cached last_message_at from contacts table if recent
    // Only fetch from messages table if data is stale

    // Fetch the most recent message for each contact in batches
    // This is much more efficient than N+1 queries
    const batchSize = 50
    const contactsWithLastMessage: Contact[] = []

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      
      // For each contact in batch, get the last message efficiently
      const batchResults = await Promise.all(
        batch.map(async (contact) => {
          // Use the last_message_at from contact if recent (within last hour), otherwise fetch
          const contactLastMessageAt = contact.last_message_at 
            ? new Date(contact.last_message_at).getTime() 
            : 0
          const oneHourAgo = Date.now() - 3600000

          if (contactLastMessageAt > oneHourAgo && contact.last_message_preview) {
            // Use cached data if recent
            const hasUnreadInbound = contact.has_unread_inbound || false
            return {
              ...contact,
              has_unread_inbound: hasUnreadInbound,
            }
          }

          // Fetch last message for this contact (optimized query)
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('sent_at, created_at, message_type, message_body, button_text, media_url, direction, read_at')
            .or(`contact_id.eq.${contact.id},from_number.eq.${contact.phone},to_number.eq.${contact.phone}`)
            .order('sent_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (lastMessage) {
            const messageTimestamp = lastMessage.sent_at || lastMessage.created_at
            
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

            if (preview.length > 50) {
              preview = preview.substring(0, 50) + '...'
            }

            const hasUnreadInbound = lastMessage.direction === 'inbound' && !lastMessage.read_at

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

      contactsWithLastMessage.push(...batchResults)
    }

    // Sort by last_message_at (most recent first)
    contactsWithLastMessage.sort((a, b) => {
      if (!a.last_message_at && !b.last_message_at) return 0
      if (!a.last_message_at) return 1
      if (!b.last_message_at) return -1
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    })

    return contactsWithLastMessage
  } catch (error) {
    logger.error('Error in fetchContacts:', error)
    throw error
  }
}

// Fetch messages for a specific contact (with pagination support for bulk messages)
export const fetchMessages = async (
  contactId: string, 
  limit: number = 1000, 
  offset: number = 0
): Promise<{ messages: Message[], hasMore: boolean, total: number }> => {
  try {
    // First, get the contact to get the phone number
    const contact = await fetchContact(contactId)
    if (!contact) {
      logger.error('Contact not found')
      return { messages: [], hasMore: false, total: 0 }
    }

    // For production: Limit the number of messages loaded initially
    // Load most recent messages first, with pagination support
    const maxMessages = limit || 1000 // Default to 1000 messages max per load

    // Fetch messages by contact_id (most recent first)
    const { data: dataByContactId, error: errorByContactId, count: countByContactId } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('contact_id', contactId)
      .order('sent_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + maxMessages - 1)

    // Also fetch messages by phone number (in case contact_id is not set on some messages)
    const { data: dataByPhone, error: errorByPhone } = await supabase
      .from('messages')
      .select('*')
      .or(`from_number.eq.${contact.phone},to_number.eq.${contact.phone}`)
      .order('sent_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + maxMessages - 1)

    if (errorByContactId || errorByPhone) {
      logger.error('Error fetching messages:', errorByContactId || errorByPhone)
      throw errorByContactId || errorByPhone
    }

    // Combine and deduplicate messages
    const allMessages = [...(dataByContactId || []), ...(dataByPhone || [])]
    const uniqueMessages = Array.from(
      new Map(allMessages.map(msg => [msg.id, msg])).values()
    )

    // Sort messages by timestamp (oldest first for display)
    const sortedMessages = uniqueMessages.sort((a, b) => {
      const timeA = a.sent_at ? new Date(a.sent_at).getTime() : new Date(a.created_at).getTime()
      const timeB = b.sent_at ? new Date(b.sent_at).getTime() : new Date(b.created_at).getTime()
      return timeA - timeB
    })

    // Determine if there are more messages
    const totalFetched = sortedMessages.length
    const hasMore = totalFetched >= maxMessages

    logger.log(`Fetched ${sortedMessages.length} messages for contact ${contactId}`)

    return {
      messages: sortedMessages,
      hasMore,
      total: countByContactId || totalFetched
    }
  } catch (error) {
    logger.error('Error in fetchMessages:', error)
    throw error
  }
}

// Fetch a single contact by ID
export const fetchContact = async (contactId: string): Promise<Contact | null> => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single()

  if (error) {
    logger.error('Error fetching contact:', error)
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
    logger.error('Error creating message:', error)
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
    logger.error('Error updating message status:', error)
    throw error
  }

  return data
}

// Mark all unread inbound messages for a contact as read
export const markMessagesAsRead = async (contactId: string): Promise<void> => {
  const contact = await fetchContact(contactId)
  if (!contact) {
    logger.error('Contact not found')
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
    logger.error('Error fetching unread messages:', fetchError)
    throw fetchError
  }

  if (!unreadMessages || unreadMessages.length === 0) {
    logger.log(`No unread inbound messages for contact ${contactId}`)
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
    logger.error('Error marking messages as read:', error)
    throw error
  }

  logger.log(`Marked ${messageIds.length} inbound messages as read for contact ${contactId}`)
}
