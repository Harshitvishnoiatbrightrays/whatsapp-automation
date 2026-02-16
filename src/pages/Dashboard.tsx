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

  return (
    <div className="dashboard-container">
      <div className="dashboard-layout">
        <ContactList
          selectedContactId={selectedContactId}
          onContactSelect={setSelectedContactId}
          refreshTrigger={refreshContacts}
        />
        <ChatView 
          contactId={selectedContactId}
          onMessagesRead={() => setRefreshContacts(prev => prev + 1)}
        />
      </div>
    </div>
  )
}

export default Dashboard
