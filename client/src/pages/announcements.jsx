import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import axios from 'axios'

function Announcements() {
  const [announcements, setAnnouncements] = useState([])
  const [form, setForm] = useState({ title: '', body: '', type: 'update', author: '' })
  const [message, setMessage] = useState('')

  useEffect(() => { fetchAnnouncements() }, [])

  const fetchAnnouncements = () => {
    axios.get('http://localhost:5000/api/announcements').then(res => setAnnouncements(res.data))
  }

  const handleSubmit = async () => {
    try {
      await axios.post('http://localhost:5000/api/announcements', form)
      setMessage('Announcement posted! 🌿')
      setForm({ title: '', body: '', type: 'update', author: '' })
      fetchAnnouncements()
    } catch (err) { setMessage('Error posting announcement!') }
  }

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:5000/api/announcements/${id}`)
    fetchAnnouncements()
  }

  const handleRead = async (id) => {
    await axios.put(`http://localhost:5000/api/announcements/${id}/read`)
    fetchAnnouncements()
  }

  return (
    <div className="wrapper">
      <Navbar />
      <div style={{ padding: '32px 0' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', marginBottom: '24px' }}>
          📣 Community <em style={{ color: 'var(--green)' }}>Announcements</em>
        </h1>
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header"><div className="card-title">Post Announcement</div></div>
          {message && <p style={{ color: 'var(--green)', marginBottom: '16px', fontSize: '13px' }}>{message}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group"><label>Title</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Harvest Festival!" /></div>
            <div className="form-group"><label>Author</label><input value={form.author} onChange={e => setForm({...form, author: e.target.value})} placeholder="Your name" /></div>
            <div className="form-group"><label>Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="update">Update</option>
                <option value="urgent">Urgent</option>
                <option value="event">Event</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Message</label>
              <textarea value={form.body} onChange={e => setForm({...form, body: e.target.value})} placeholder="Write your announcement here..." rows={4} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <button className="btn-primary" onClick={handleSubmit}>Post Announcement</button>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">All Announcements ({announcements.length})</div></div>
          <div className="announce-list">
            {announcements.length === 0 ? (
              <p style={{ color: 'var(--text2)', fontSize: '13px' }}>No announcements yet!</p>
            ) : (
              announcements.map(a => (
                <div key={a._id} className={`announce-item ${a.type}`} style={{ opacity: a.isRead ? 0.6 : 1 }}>
                  <div className="announce-meta">
                    <span className={`announce-tag ${a.type === 'urgent' ? 'urgent-tag' : a.type === 'event' ? 'event-tag' : ''}`}>{a.type}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text2)' }}>by {a.author}</span>
                    <span className="announce-date">{new Date(a.date).toLocaleDateString()}</span>
                  </div>
                  <div className="announce-title">{a.title}</div>
                  <div className="announce-body">{a.body}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    {!a.isRead && (
                      <button onClick={() => handleRead(a._id)} style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--green)', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Mark as Read</button>
                    )}
                    <button onClick={() => handleDelete(a._id)} style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
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

export default Announcements