import { useEffect, useState, useRef } from 'react'
import { fetchContacts, Contact } from '../services/supabaseService'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './ContactList.css'

interface ContactListProps {
  selectedContactId: string | null
  onContactSelect: (contactId: string) => void
  refreshTrigger?: number
}

const ContactList = ({ selectedContactId, onContactSelect, refreshTrigger }: ContactListProps) => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadContacts()
    
    // Refresh contacts every 50 seconds to get latest messages
    const interval = setInterval(() => {
      loadContacts()
    }, 50000)

    return () => clearInterval(interval)
  }, [refreshTrigger])

  const loadContacts = async () => {
    try {
      setLoading(true)
      const data = await fetchContacts()
      setContacts(data)
    } catch (error) {
      console.error('Failed to load contacts:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const formatTime = (dateString: string | null) => {
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
  }

  const getInitials = (name: string | null, phone: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return phone.slice(-2)
  }

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

      <div className="contact-list-items">
        {loading ? (
          <div className="contact-list-loading">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div className="contact-list-empty">No contacts found</div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className={`contact-item ${selectedContactId === contact.id ? 'active' : ''}`}
              onClick={() => onContactSelect(contact.id)}
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
          ))
        )}
      </div>
    </div>
  )
}

export default ContactList
