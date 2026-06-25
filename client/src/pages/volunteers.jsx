import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import axios from 'axios'

function Volunteers() {
  const [volunteers, setVolunteers] = useState([])
  const [form, setForm] = useState({ name: '', email: '', task: '', zone: '', date: '', time: '' })
  const [message, setMessage] = useState('')

  useEffect(() => { fetchVolunteers() }, [])

  const fetchVolunteers = () => {
    axios.get('http://localhost:5000/api/volunteers').then(res => setVolunteers(res.data))
  }

  const handleSubmit = async () => {
    try {
      await axios.post('http://localhost:5000/api/volunteers', form)
      setMessage('Volunteer added! 🌿')
      setForm({ name: '', email: '', task: '', zone: '', date: '', time: '' })
      fetchVolunteers()
    } catch (err) { setMessage('Error adding volunteer!') }
  }

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:5000/api/volunteers/${id}`)
    fetchVolunteers()
  }

  const handleStatus = async (id, status) => {
    await axios.put(`http://localhost:5000/api/volunteers/${id}`, { status })
    fetchVolunteers()
  }

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase()
  const avatarColors = ['rgba(74,222,128,0.2)', 'rgba(167,139,250,0.2)', 'rgba(251,191,36,0.2)', 'rgba(96,165,250,0.2)']
  const textColors = ['var(--green)', '#a78bfa', 'var(--gold)', '#60a5fa']

  return (
    <div className="wrapper">
      <Navbar />
      <div style={{ padding: '32px 0' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', marginBottom: '24px' }}>
          👥 Volunteer <em style={{ color: 'var(--green)' }}>Management</em>
        </h1>
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header"><div className="card-title">Register Volunteer</div></div>
          {message && <p style={{ color: 'var(--green)', marginBottom: '16px', fontSize: '13px' }}>{message}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group"><label>Full Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Arjun Kumar" /></div>
            <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="e.g. arjun@email.com" /></div>
            <div className="form-group"><label>Task</label><input value={form.task} onChange={e => setForm({...form, task: e.target.value})} placeholder="e.g. Compost turning" /></div>
            <div className="form-group"><label>Zone</label><input value={form.zone} onChange={e => setForm({...form, zone: e.target.value})} placeholder="e.g. Zone A" /></div>
            <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
            <div className="form-group"><label>Time</label><input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} /></div>
          </div>
          <button className="btn-primary" onClick={handleSubmit}>Register Volunteer</button>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">All Volunteers ({volunteers.length})</div></div>
          <div>
            {volunteers.length === 0 ? (
              <p style={{ color: 'var(--text2)', fontSize: '13px' }}>No volunteers yet!</p>
            ) : (
              volunteers.map((vol, i) => (
                <div key={vol._id} className="volunteer-item">
                  <div className="vol-avatar" style={{ background: avatarColors[i % 4], color: textColors[i % 4] }}>
                    {getInitials(vol.name)}
                  </div>
                  <div className="vol-info">
                    <div className="vol-name">{vol.name}</div>
                    <div className="vol-task">{vol.task} · {vol.zone}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{vol.email}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <div className="vol-time">{vol.date ? new Date(vol.date).toLocaleDateString() : ''} {vol.time}</div>
                    <span className={`resource-avail ${vol.status === 'confirmed' ? 'avail-yes' : 'avail-no'}`}>{vol.status}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleStatus(vol._id, 'confirmed')} style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--green)', border: 'none', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Confirm</button>
                      <button onClick={() => handleDelete(vol._id)} style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'none', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Volunteers