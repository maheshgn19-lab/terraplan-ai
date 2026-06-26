import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import axios from 'axios'
import API_BASE from '../api'

function Calendar() {
  const [volunteers, setVolunteers] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [events, setEvents] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Form for regional events
  const [form, setForm] = useState({ title: '', date: '', region: 'Local', description: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => {
    axios.get(`${API_BASE}/api/volunteers`).then(res => setVolunteers(res.data))
    axios.get(`${API_BASE}/api/announcements`).then(res => setAnnouncements(res.data))
    axios.get(`${API_BASE}/api/events`).then(res => setEvents(res.data))
  }

  const handleAddEvent = async () => {
    if (!form.title || !form.date) return setMessage('Title and date required!')
    try {
      await axios.post(`${API_BASE}/api/events`, form)
      setMessage('Event added! 🎉')
      setForm({ title: '', date: '', region: 'Local', description: '' })
      fetchData()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('Error adding event!')
    }
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth)

  const getEventsForDay = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dayVols = volunteers.filter(v => new Date(v.date).toDateString() === date.toDateString()).map(v => ({...v, eventType: 'volunteer'}))
    const dayEvents = events.filter(e => new Date(e.date).toDateString() === date.toDateString()).map(e => ({...e, eventType: e.type}))
    return [...dayVols, ...dayEvents]
  }

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
  const today = new Date()
  const isToday = (day) => today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear()

  return (
    <div className="wrapper">
      <Navbar />
      <div style={{ padding: '32px 0' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', marginBottom: '24px' }}>
          📅 Garden <em style={{ color: 'var(--green)' }}>Calendar</em>
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
          
          {/* Main Calendar Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card">
              <div className="card-header">
                <button onClick={prevMonth} className="btn-ghost" style={{ padding: '6px 14px' }}>←</button>
                <div className="card-title" style={{ fontSize: '20px' }}>{monthName}</div>
                <button onClick={nextMonth} className="btn-ghost" style={{ padding: '6px 14px' }}>→</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', padding: '4px 0' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
                {Array(daysInMonth).fill(null).map((_, i) => {
                  const day = i + 1
                  const dayEvts = getEventsForDay(day)
                  return (
                    <div key={day} onClick={() => setSelectedDay(day)}
                      style={{
                        aspectRatio: '1', borderRadius: '8px', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', fontSize: '13px', cursor: 'pointer',
                        position: 'relative',
                        background: isToday(day) ? 'rgba(74,222,128,0.2)' : selectedDay === day ? 'rgba(74,222,128,0.1)' : 'transparent',
                        color: isToday(day) ? 'var(--green)' : 'var(--text2)',
                        fontWeight: isToday(day) ? '500' : '300',
                        border: selectedDay === day ? '1px solid rgba(74,222,128,0.4)' : '1px solid transparent',
                        transition: 'all 0.2s'
                      }}>
                      {day}
                      {dayEvts.length > 0 && (
                        <div style={{ display: 'flex', gap: '3px', position: 'absolute', bottom: '6px' }}>
                          {dayEvts.some(e => e.eventType === 'volunteer') && <div style={{ width: '5px', height: '5px', background: 'var(--green)', borderRadius: '50%' }} />}
                          {dayEvts.some(e => e.eventType === 'holiday') && <div style={{ width: '5px', height: '5px', background: '#f87171', borderRadius: '50%' }} />}
                          {dayEvts.some(e => e.eventType === 'regional') && <div style={{ width: '5px', height: '5px', background: '#60a5fa', borderRadius: '50%' }} />}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', padding: '12px', background: 'var(--bg3)', borderRadius: '8px', fontSize: '12px', color: 'var(--text2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', background: 'var(--green)', borderRadius: '50%' }}/> Volunteer</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', background: '#f87171', borderRadius: '50%' }}/> Holiday</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', background: '#60a5fa', borderRadius: '50%' }}/> Regional</div>
              </div>
            </div>

            {/* Add Event Form */}
            <div className="card">
              <div className="card-header"><div className="card-title" style={{ fontSize: '16px' }}>Add Regional Event</div></div>
              {message && <p style={{ color: message.includes('Error') ? '#f87171' : 'var(--green)', marginBottom: '12px', fontSize: '13px' }}>{message}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label>Event Title</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Harvest Festival" /></div>
                <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
              </div>
              <div className="form-group" style={{ marginTop: '12px' }}><label>Description (optional)</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Details..." /></div>
              <button className="btn-primary" onClick={handleAddEvent} style={{ marginTop: '12px', padding: '8px 16px', fontSize: '13px' }}>Save Event</button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ fontSize: '16px' }}>
                {selectedDay ? `Events on ${selectedDay} ${monthName}` : 'Select a day'}
              </div>
            </div>
            {!selectedDay ? (
              <p style={{ color: 'var(--text2)', fontSize: '13px', padding: '16px 0' }}>Click on a day in the calendar to view its events.</p>
            ) : (
              <div>
                {getEventsForDay(selectedDay).length === 0 ? (
                  <p style={{ color: 'var(--text2)', fontSize: '13px', padding: '16px 0' }}>No events scheduled for this day.</p>
                ) : (
                  getEventsForDay(selectedDay).map(v => {
                    if (v.eventType === 'volunteer') {
                      return (
                        <div key={v._id} className="volunteer-item" style={{ marginBottom: '12px', background: 'var(--bg3)', borderRadius: '8px', padding: '12px' }}>
                          <div className="vol-avatar" style={{ background: 'rgba(74,222,128,0.2)', color: 'var(--green)' }}>
                            {v.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="vol-info">
                            <div className="vol-name" style={{ fontSize: '13px' }}>{v.name}</div>
                            <div className="vol-task" style={{ fontSize: '11px' }}>Volunteer · {v.task}</div>
                            <div className="vol-time" style={{ fontSize: '11px' }}>{v.time}</div>
                          </div>
                        </div>
                      )
                    } else {
                      return (
                        <div key={v._id} style={{ 
                          marginBottom: '12px', background: 'var(--bg3)', borderRadius: '8px', padding: '12px',
                          borderLeft: `3px solid ${v.eventType === 'holiday' ? '#f87171' : '#60a5fa'}` 
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>{v.title}</div>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: v.eventType === 'holiday' ? '#f87171' : '#60a5fa', background: v.eventType === 'holiday' ? 'rgba(248,113,113,0.1)' : 'rgba(96,165,250,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                              {v.eventType}
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{v.description || 'Regional event'}</div>
                        </div>
                      )
                    }
                  })
                )}
              </div>
            )}
            
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />
            
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: '600' }}>Recent Announcements</div>
              {announcements.slice(0, 3).map(a => (
                <div key={a._id} style={{ padding: '10px', background: 'var(--bg3)', borderRadius: '8px', marginBottom: '8px', borderLeft: `2px solid ${a.type === 'urgent' ? 'var(--gold)' : a.type === 'event' ? '#a78bfa' : 'var(--green2)'}` }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)' }}>{a.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>{new Date(a.date).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calendar