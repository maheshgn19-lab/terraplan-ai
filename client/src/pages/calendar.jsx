import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import axios from 'axios'

function Calendar() {
  const [volunteers, setVolunteers] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    axios.get('http://localhost:5000/api/volunteers').then(res => setVolunteers(res.data))
    axios.get('http://localhost:5000/api/announcements').then(res => setAnnouncements(res.data))
  }, [])

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
    return volunteers.filter(v => {
      const vDate = new Date(v.date)
      return vDate.toDateString() === date.toDateString()
    })
  }

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
  const today = new Date()
  const isToday = (day) => today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear()
  const eventDays = volunteers.map(v => new Date(v.date).getDate())

  return (
    <div className="wrapper">
      <Navbar />
      <div style={{ padding: '32px 0' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', marginBottom: '24px' }}>
          📅 Garden <em style={{ color: 'var(--green)' }}>Calendar</em>
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
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
                const events = getEventsForDay(day)
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
                    }}>
                    {day}
                    {events.length > 0 && (
                      <div style={{ width: '4px', height: '4px', background: 'var(--green2)', borderRadius: '50%', position: 'absolute', bottom: '4px' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ fontSize: '16px' }}>
                {selectedDay ? `Events — ${selectedDay} ${monthName}` : 'Select a day'}
              </div>
            </div>
            {!selectedDay ? (
              <p style={{ color: 'var(--text2)', fontSize: '13px' }}>Click on a day to see events</p>
            ) : (
              <div>
                {getEventsForDay(selectedDay).length === 0 ? (
                  <p style={{ color: 'var(--text2)', fontSize: '13px' }}>No events on this day</p>
                ) : (
                  getEventsForDay(selectedDay).map(v => (
                    <div key={v._id} className="volunteer-item" style={{ marginBottom: '8px' }}>
                      <div className="vol-avatar" style={{ background: 'rgba(74,222,128,0.2)', color: 'var(--green)' }}>
                        {v.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="vol-info">
                        <div className="vol-name">{v.name}</div>
                        <div className="vol-task">{v.task} · {v.zone}</div>
                        <div className="vol-time">{v.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Recent Posts</div>
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