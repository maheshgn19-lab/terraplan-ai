import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../api'

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match!')
      return
    }
    try {
      const res = await axios.post(`${API_BASE}/api/users/register`, {
        name: form.name,
        email: form.email,
        password: form.password
      })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Error registering!')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌱</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px' }}>Join Terraplan AI</h1>
          <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '8px' }}>Create your garden account</p>
        </div>

        {error && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

        <div className="form-group">
          <label>Full Name</label>
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Arjun Kumar" />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="your@email.com" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} placeholder="••••••••" />
        </div>

        <button className="btn-primary" onClick={handleSubmit} style={{ width: '100%', marginTop: '8px' }}>Create Account</button>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text2)', marginTop: '20px' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--green)' }}>Sign In</Link>
        </p>
      </div>
    </div>
  )
}

export default Register