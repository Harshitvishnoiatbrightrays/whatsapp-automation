import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Login.css'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // For Supabase, we need to use email format
      // If username doesn't contain @, we'll append the configured domain
      // Note: Supabase auth uses email format, so usernames are converted to emails
      const emailDomain = import.meta.env.VITE_EMAIL_DOMAIN || 'example.com'
      const email = username.includes('@') ? username : `${username}@${emailDomain}`
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (data.session) {
        navigate('/')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Left Panel - Login Form */}
        <div className="login-panel">
          {/* Logo - Top Left */}
          <div className="logo-container">
            <img 
              src="/logo.png" 
              alt="WhatsApp Automation Logo" 
              className="logo-image"
              onError={(e) => {
                // Fallback to placeholder if logo not found
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="logo-placeholder"><span class="logo-icon">W</span><span class="logo-text">WhatsApp Automation</span></div>';
                }
              }}
            />
          </div>

          <div className="login-content">
            <h1 className="login-title">Sign in to your account</h1>
            <p className="login-subtitle">Enter your credentials to access WhatsApp Automation</p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username" className="form-label">Username</label>
                <div className="input-wrapper">
                  <input
                    id="username"
                    type="text"
                    className="form-input"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="password" className="form-label">Password</label>
                  <a href="#" className="forgot-password">Forgot password?</a>
                </div>
                <div className="input-wrapper password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3C5 3 1.73 7.11 1 10c.73 2.89 4 7 9 7s8.27-4.11 9-7c-.73-2.89-4-7-9-7zM10 14.5c-2.48 0-4.5-2.02-4.5-4.5S7.52 5.5 10 5.5 14.5 7.52 14.5 10 12.48 14.5 10 14.5zm0-7.5c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
                        <path d="M2.5 2.5L17.5 17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3C5 3 1.73 7.11 1 10c.73 2.89 4 7 9 7s8.27-4.11 9-7c-.73-2.89-4-7-9-7zM10 14.5c-2.48 0-4.5-2.02-4.5-4.5S7.52 5.5 10 5.5 14.5 7.52 14.5 10 12.48 14.5 10 14.5zm0-7.5c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="sign-in-button"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>

            <p className="help-text">
              Need access? Contact your administrator.
            </p>
          </div>
        </div>

        {/* Right Panel - Promotional Content */}
        <div className="promo-panel">
          <div className="promo-content">
            <div className="promo-logo">
              <img 
                src="/logo-white.svg" 
                alt="WhatsApp Automation Logo" 
                className="logo-image-white"
                onError={(e) => {
                  // Fallback to placeholder if logo not found
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<span class="logo-icon-white">W</span><span class="logo-text-white">Innov Arc\'s WhatsApp Automation</span>';
                  }
                }}
              />
            </div>
            <h2 className="promo-title">Where all leads have higher chances of conversion.</h2>
            <p className="promo-description">
              Streamline messaging, automation, and team operations — all in one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
