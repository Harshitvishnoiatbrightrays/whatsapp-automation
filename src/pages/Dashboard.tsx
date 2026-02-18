import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ContactList from '../components/ContactList'
import ChatView from '../components/ChatView'
import './Dashboard.css'

const Dashboard = () => {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [refreshContacts, setRefreshContacts] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
      }
    }
    getUser()
  }, [navigate])

  // Handle contact updates (for marking messages as read without full refresh)
  const handleContactUpdate = (_contactId: string, _updates: any) => {
    // This will be handled by ContactList internally
    // We still keep refreshTrigger for periodic updates
  }

  // Debounced refresh function
  const handleMessagesRead = () => {
    // Only refresh if needed, debounced
    setTimeout(() => {
      setRefreshContacts(prev => prev + 1)
    }, 1000)
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-layout">
        <ContactList
          selectedContactId={selectedContactId}
          onContactSelect={setSelectedContactId}
          refreshTrigger={refreshContacts}
          onContactUpdate={handleContactUpdate}
        />
        <ChatView 
          contactId={selectedContactId}
          onMessagesRead={handleMessagesRead}
          onContactUpdate={handleContactUpdate}
        />
      </div>
    </div>
  )
}

export default Dashboard
