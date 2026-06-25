import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useTheme } from '../context/ThemeContext'
import Navbar from '../components/Navbar'
import API_BASE from '../api'

function Profile() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'))
  const [activeTab, setActiveTab] = useState('profile')

  // Username form
  const [nameForm, setNameForm] = useState({ name: user.name || '', email: user.email || '' })
  const [nameMsg, setNameMsg] = useState({ text: '', type: '' })
  const [nameLoading, setNameLoading] = useState(false)

  // Password form
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passMsg, setPassMsg] = useState({ text: '', type: '' })
  const [passLoading, setPassLoading] = useState(false)

  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) navigate('/login')
  }, [token])

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleUpdateName = async () => {
    if (!nameForm.name.trim()) {
      setNameMsg({ text: 'Name cannot be empty', type: 'error' })
      return
    }
    if (nameForm.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(nameForm.email)) {
      setNameMsg({ text: 'Please enter a valid email address', type: 'error' })
      return
    }
    setNameLoading(true)
    try {
      const res = await axios.put(`${API_BASE}/api/users/profile`, { name: nameForm.name, email: nameForm.email }, {
        headers: { 'x-auth-token': token }
      })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      setUser(res.data.user)
      setNameForm({ name: res.data.user.name, email: res.data.user.email })
      setNameMsg({ text: '✓ Profile updated successfully!', type: 'success' })
    } catch (err) {
      setNameMsg({ text: err.response?.data?.message || 'Failed to update profile', type: 'error' })
    } finally {
      setNameLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!passForm.currentPassword || !passForm.newPassword || !passForm.confirmPassword) {
      setPassMsg({ text: 'All fields are required', type: 'error' })
      return
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassMsg({ text: 'New passwords do not match', type: 'error' })
      return
    }
    if (passForm.newPassword.length < 6) {
      setPassMsg({ text: 'New password must be at least 6 characters', type: 'error' })
      return
    }
    setPassLoading(true)
    try {
      await axios.put(`${API_BASE}/api/users/profile`, {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword
      }, { headers: { 'x-auth-token': token } })
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPassMsg({ text: '✓ Password changed successfully!', type: 'success' })
    } catch (err) {
      setPassMsg({ text: err.response?.data?.message || 'Failed to update password', type: 'error' })
    } finally {
      setPassLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const tabs = [
    { id: 'profile', label: 'Edit Profile', icon: '👤' },
    { id: 'password', label: 'Change Password', icon: '🔒' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
  ]

  return (
    <div className="wrapper">
      <Navbar />

      <div className="profile-page">
        {/* Sidebar */}
        <aside className="profile-sidebar">
          {/* Avatar */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-ring">
              <div className="profile-avatar-inner">
                {getInitials(user.name)}
              </div>
            </div>
            <h2 className="profile-display-name">{user.name || 'User'}</h2>
            <span className="profile-role-badge">{user.role || 'member'}</span>
            <p className="profile-email">{user.email}</p>
          </div>

          {/* Tabs */}
          <nav className="profile-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`profile-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="profile-tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <button className="profile-logout-btn" onClick={handleLogout}>
            <span>🚪</span>
            Sign Out
          </button>
        </aside>

        {/* Main Content */}
        <main className="profile-content">

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="profile-section" style={{ animation: 'fadeUp 0.4s ease-out both' }}>
              <div className="profile-section-header">
                <h2 className="profile-section-title">✏️ Edit Profile</h2>
                <p className="profile-section-sub">Update your display name</p>
              </div>

              <div className="profile-card">
                <div className="form-group">
                  <label>Display Name</label>
                  <input
                    type="text"
                    value={nameForm.name}
                    onChange={e => { setNameForm({ name: e.target.value }); setNameMsg({ text: '', type: '' }) }}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={nameForm.email}
                    onChange={e => { setNameForm(f => ({ ...f, email: e.target.value })); setNameMsg({ text: '', type: '' }) }}
                    placeholder="Enter your email"
                  />
                  <p className="field-hint">Changing your email will update your login email</p>
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input type="text" value={user.role || 'member'} disabled className="input-disabled" />
                </div>

                {nameMsg.text && (
                  <div className={`profile-msg ${nameMsg.type}`}>{nameMsg.text}</div>
                )}

                <button className="btn-primary profile-save-btn" onClick={handleUpdateName} disabled={nameLoading}>
                  {nameLoading ? <span className="spinner" /> : null}
                  {nameLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="profile-section" style={{ animation: 'fadeUp 0.4s ease-out both' }}>
              <div className="profile-section-header">
                <h2 className="profile-section-title">🔒 Change Password</h2>
                <p className="profile-section-sub">Keep your account secure</p>
              </div>

              <div className="profile-card">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passForm.currentPassword}
                    onChange={e => { setPassForm(p => ({ ...p, currentPassword: e.target.value })); setPassMsg({ text: '', type: '' }) }}
                    placeholder="••••••••"
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passForm.newPassword}
                    onChange={e => { setPassForm(p => ({ ...p, newPassword: e.target.value })); setPassMsg({ text: '', type: '' }) }}
                    placeholder="••••••••"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passForm.confirmPassword}
                    onChange={e => { setPassForm(p => ({ ...p, confirmPassword: e.target.value })); setPassMsg({ text: '', type: '' }) }}
                    placeholder="••••••••"
                  />
                </div>

                <div className="password-rules">
                  <span className={passForm.newPassword.length >= 6 ? 'rule ok' : 'rule'}>✓ At least 6 characters</span>
                  <span className={passForm.newPassword && passForm.newPassword === passForm.confirmPassword ? 'rule ok' : 'rule'}>✓ Passwords match</span>
                </div>

                {passMsg.text && (
                  <div className={`profile-msg ${passMsg.type}`}>{passMsg.text}</div>
                )}

                <button className="btn-primary profile-save-btn" onClick={handleUpdatePassword} disabled={passLoading}>
                  {passLoading ? <span className="spinner" /> : null}
                  {passLoading ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="profile-section" style={{ animation: 'fadeUp 0.4s ease-out both' }}>
              <div className="profile-section-header">
                <h2 className="profile-section-title">🎨 Appearance</h2>
                <p className="profile-section-sub">Choose your preferred look</p>
              </div>

              <div className="profile-card">
                <p className="theme-label">Theme</p>
                <div className="theme-options">
                  <button
                    className={`theme-option ${theme === 'dark' ? 'selected' : ''}`}
                    onClick={() => { if (theme !== 'dark') toggleTheme() }}
                  >
                    <div className="theme-preview dark-preview">
                      <div className="preview-header" />
                      <div className="preview-body">
                        <div className="preview-line" />
                        <div className="preview-line short" />
                      </div>
                    </div>
                    <span className="theme-option-label">🌑 Dark</span>
                    {theme === 'dark' && <span className="theme-active-dot" />}
                  </button>

                  <button
                    className={`theme-option ${theme === 'light' ? 'selected' : ''}`}
                    onClick={() => { if (theme !== 'light') toggleTheme() }}
                  >
                    <div className="theme-preview light-preview">
                      <div className="preview-header" />
                      <div className="preview-body">
                        <div className="preview-line" />
                        <div className="preview-line short" />
                      </div>
                    </div>
                    <span className="theme-option-label">☀️ Light</span>
                    {theme === 'light' && <span className="theme-active-dot" />}
                  </button>
                </div>

                <div className="theme-toggle-row">
                  <div>
                    <p className="theme-toggle-title">Quick Toggle</p>
                    <p className="theme-toggle-sub">Currently: <strong>{theme === 'dark' ? '🌑 Dark Mode' : '☀️ Light Mode'}</strong></p>
                  </div>
                  <button
                    className="theme-toggle-switch"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                  >
                    <span className={`toggle-knob ${theme === 'light' ? 'toggled' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

export default Profile
