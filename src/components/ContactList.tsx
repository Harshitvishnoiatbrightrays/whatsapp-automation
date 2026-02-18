import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { fetchContacts, Contact } from '../services/supabaseService'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './ContactList.css'

interface ContactListProps {
  selectedContactId: string | null
  onContactSelect: (contactId: string) => void
  refreshTrigger?: number
  onContactUpdate?: (contactId: string, updates: Partial<Contact>) => void
}

// Memoized ContactItem component to prevent unnecessary re-renders
interface ContactItemProps {
  contact: Contact
  isSelected: boolean
  onClick: () => void
  formatTime: (dateString: string | null) => string
  getInitials: (name: string | null, phone: string) => string
}

const ContactItem = ({ contact, isSelected, onClick, formatTime, getInitials }: ContactItemProps) => {
  return (
    <div
      className={`contact-item ${isSelected ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="contact-avatar">
        {getInitials(contact.name, contact.phone)}
      </div>
      <div className="contact-info">
        <div className="contact-name-row">
          <span className="contact-name">
            {contact.name || contact.phone}
          </span>
          {contact.last_message_at && (
            <span className="contact-time">
              {formatTime(contact.last_message_at)}
            </span>
          )}
        </div>
        <div className="contact-preview-row">
          <span className={`contact-preview ${contact.has_unread_inbound ? 'unread' : ''}`}>
            {contact.last_message_preview || 'No messages yet'}
          </span>
          {contact.has_unread_inbound && (
            <span className="contact-unread-dot"></span>
          )}
        </div>
      </div>
    </div>
  )
}

const ContactList = ({ selectedContactId, onContactSelect, refreshTrigger, onContactUpdate }: ContactListProps) => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load contacts function
  const loadContacts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchContacts()
      setContacts(data)
      setFilteredContacts(data)
    } catch (error) {
      console.error('Failed to load contacts:', error)
    } finally {
      // Add a small delay to prevent flickering on fast loads
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      loadingTimeoutRef.current = setTimeout(() => {
        setLoading(false)
      }, 100)
    }
  }, [])

  // Filter contacts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts)
      return
    }

    const query = searchQuery.toLowerCase().trim()
    const filtered = contacts.filter((contact) => {
      const name = (contact.name || '').toLowerCase()
      const phone = contact.phone.toLowerCase()
      const preview = (contact.last_message_preview || '').toLowerCase()
      
      return name.includes(query) || phone.includes(query) || preview.includes(query)
    })
    
    setFilteredContacts(filtered)
  }, [searchQuery, contacts])

  // Initial load and refresh trigger
  useEffect(() => {
    loadContacts()
  }, [loadContacts, refreshTrigger])

  // Periodic refresh (every 50 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      loadContacts()
    }, 50000)

    return () => clearInterval(interval)
  }, [loadContacts])

  // Handle contact updates from parent (when messages are marked as read)
  useEffect(() => {
    if (onContactUpdate && selectedContactId) {
      // Update the specific contact's unread status locally
      setContacts(prevContacts => 
        prevContacts.map(contact => 
          contact.id === selectedContactId
            ? { ...contact, has_unread_inbound: false }
            : contact
        )
      )
    }
  }, [selectedContactId, onContactUpdate])


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const formatTime = useCallback((dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString()
  }, [])

  const getInitials = useCallback((name: string | null, phone: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return phone.slice(-2)
  }, [])

  const handleContactClick = useCallback((contactId: string) => {
    onContactSelect(contactId)
  }, [onContactSelect])

  // Memoize contact items to prevent unnecessary re-renders
  const contactItems = useMemo(() => {
    return filteredContacts.map((contact) => (
      <ContactItem
        key={contact.id}
        contact={contact}
        isSelected={selectedContactId === contact.id}
        onClick={() => handleContactClick(contact.id)}
        formatTime={formatTime}
        getInitials={getInitials}
      />
    ))
  }, [filteredContacts, selectedContactId, handleContactClick, formatTime, getInitials])

  return (
    <div className="contact-list">
      <div className="contact-list-header">
        <div className="contact-list-header-top">
          <img src="/logo.png" alt="Logo" className="contact-list-logo" />
          <div className="contact-list-actions" ref={menuRef}>
            <button 
              className="icon-button" 
              title="Menu"
              onClick={() => setShowMenu(!showMenu)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 12H12.01M12 6H12.01M12 18H12.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            {showMenu && (
              <div className="menu-dropdown">
                <button className="menu-item" onClick={handleLogout}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="contact-list-search">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="contact-list-items">
        {loading && contacts.length === 0 ? (
          <div className="contact-list-loading">
            <div className="loading-spinner"></div>
            <span>Loading contacts...</span>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="contact-list-empty">
            {searchQuery ? `No contacts found for "${searchQuery}"` : 'No contacts found'}
          </div>
        ) : (
          <>
            {contactItems}
            {loading && contacts.length > 0 && (
              <div className="contact-list-refreshing">
                <div className="loading-spinner-small"></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ContactList
