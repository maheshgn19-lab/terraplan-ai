import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/users/login', form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/')
    } catch (err) {
      setError('Invalid email or password!')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌿</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px' }}>Welcome back</h1>
          <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '8px' }}>Sign in to Terraplan AI</p>
        </div>

        {error && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="your@email.com" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />
        </div>

        <button className="btn-primary" onClick={handleSubmit} style={{ width: '100%', marginTop: '8px' }}>Sign In</button>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text2)', marginTop: '20px' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--green)' }}>Register</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
