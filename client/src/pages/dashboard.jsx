import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import API_BASE from '../api'

function Dashboard() {
  const [plots, setPlots] = useState([])
  const [resources, setResources] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [weather, setWeather] = useState(null)
  const [selectedDay, setSelectedDay] = useState(new Date().getDate())

  const user = JSON.parse(localStorage.getItem('user') || '{"name":"Gardener"}')

  useEffect(() => {
    axios.get(`${API_BASE}/api/plots`).then(res => setPlots(res.data))
    axios.get(`${API_BASE}/api/resources`).then(res => setResources(res.data))
    axios.get(`${API_BASE}/api/volunteers`).then(res => setVolunteers(res.data))
    axios.get(`${API_BASE}/api/announcements`).then(res => setAnnouncements(res.data))
    axios.get(`${API_BASE}/api/weather`).then(res => setWeather(res.data))
  }, [])

  const getPlotColor = (status) => {
    if (status === 'mine') return { bg: 'rgba(74,222,128,0.5)', border: '#22c55e' }
    if (status === 'free') return { bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.2)' }
    if (status === 'reserved') return { bg: 'rgba(251,191,36,0.2)', border: 'rgba(251,191,36,0.3)' }
    return { bg: 'rgba(139,92,46,0.25)', border: 'rgba(180,120,60,0.2)' }
  }

  const handleBorrow = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/resources/${id}/borrow`, { name: user.name })
      const res = await axios.get(`${API_BASE}/api/resources`)
      setResources(res.data)
    } catch { alert('No resources available!') }
  }

  const freePlots = plots.filter(p => p.status === 'free').length
  const takenPlots = plots.filter(p => p.status === 'taken' || p.status === 'mine').length
  const reservedPlots = plots.filter(p => p.status === 'reserved').length

  // Calendar
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' })
  const eventDays = volunteers.map(v => new Date(v.date).getDate())

  // Season progress
  const occupiedPct = plots.length ? Math.round((takenPlots / plots.length) * 100) : 0
  const borrowedPct = resources.length ? Math.round((resources.filter(r => r.availableQuantity < r.totalQuantity).length / resources.length) * 100) : 0
  const confirmedPct = volunteers.length ? Math.round((volunteers.filter(v => v.status === 'confirmed').length / volunteers.length) * 100) : 0

  const avatarColors = ['rgba(74,222,128,0.2)', 'rgba(167,139,250,0.2)', 'rgba(251,191,36,0.2)', 'rgba(96,165,250,0.2)']
  const textColors = ['var(--green)', '#a78bfa', 'var(--gold)', '#60a5fa']
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <div className="wrapper">
      <Navbar />
      {/* Forced HMR update */}

      {/* Hero with personalized welcome */}
      <section className="hero">
        <div>
          <div className="hero-eyebrow">🌱 Spring Season 2026</div>
          <h1>Welcome back,<br /><em>{user.name.split(' ')[0]}.</em></h1>
          <p className="hero-sub">
            You have {freePlots} free plots available,{' '}
            {resources.filter(r => r.availableQuantity > 0).length} resources to borrow, and{' '}
            {announcements.filter(a => !a.isRead).length} unread announcements.
          </p>
          <div className="hero-actions">
            <Link to="/plots"><button className="btn-primary">View My Plot</button></Link>
            <Link to="/resources"><button className="btn-ghost">Browse Resources</button></Link>
          </div>
        </div>

        {/* Weather widget */}
        {weather && (
          <div className="card" style={{ background: 'linear-gradient(135deg, #111a11, #162016)', overflow: 'hidden' }}>
            <div style={{ textAlign: 'center' }}>
              <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt="weather" style={{ width: '60px' }} />
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '52px', fontWeight: '700', color: 'var(--gold)', lineHeight: 1 }}>
                {weather.temperature}°
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text)', marginTop: '4px', textTransform: 'capitalize' }}>
                {weather.description}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>
                {weather.city}
              </div>
            </div>

            {/* ✅ FIXED: Water Status — 2x2 grid, textAlign left */}
            <div style={{
              marginTop: '16px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '14px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  💧 Water Status
                </div>
                <Link to="/water" style={{ fontSize: '11px', color: 'var(--green)', textDecoration: 'none' }}>Manage →</Link>
              </div>

              {/* 2x2 grid so all 4 zones fit */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {['Zone A', 'Zone B', 'Zone C', 'Zone D'].map(zone => {
                  const zonePlots = plots.filter(p => p.zone === zone)
                  const dryCount = zonePlots.filter(p => !p.soilStatus || p.soilStatus === 'dry').length
                  const total = zonePlots.length
                  const dryRatio = total > 0 ? dryCount / total : 0
                  const urgency = dryRatio > 0.6
                    ? { label: 'Urgent', color: '#f87171', bg: 'rgba(239,68,68,0.15)', emoji: '🔴' }
                    : dryRatio > 0.3
                    ? { label: 'Soon',   color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', emoji: '🟡' }
                    : { label: 'Good',   color: '#4ade80', bg: 'rgba(74,222,128,0.15)', emoji: '🟢' }
                  return (
                    <div key={zone} style={{
                      padding: '10px',
                      background: urgency.bg,
                      borderRadius: '10px',
                      border: `1px solid ${urgency.color}40`,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '16px', marginBottom: '4px' }}>{urgency.emoji}</div>
                      <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)', marginBottom: '2px' }}>{zone}</div>
                      <div style={{ fontSize: '11px', color: urgency.color, fontWeight: '500' }}>{urgency.label}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '3px' }}>{total} plots · {dryCount} dry</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Weather meta strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '8px',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: 'var(--green)', fontWeight: '500' }}>{weather.humidity}%</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Humidity</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: 'var(--green)', fontWeight: '500' }}>{weather.windSpeed}m/s</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Wind</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: 'var(--green)', fontWeight: '500' }}>
                  {weather.humidity > 80 ? '💧 Wet' : weather.humidity > 50 ? '🌱 Moist' : '🏜️ Dry'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Soil</div>
              </div>
            </div>

            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg3)', borderRadius: '8px', fontSize: '11px', color: 'var(--text2)', textAlign: 'left' }}>
              {weather.gardenAdvice}
            </div>
            <Link to="/weather" style={{ display: 'block', marginTop: '12px', fontSize: '12px', color: 'var(--green2)', textAlign: 'center' }}>
              Full weather report →
            </Link>
          </div>
        )}
      </section>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-icon">🗺️</span>
          <div className="stat-num">{plots.length}</div>
          <div className="stat-label">Total plots</div>
          <div className="stat-change">↑ {freePlots} free plots available</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔧</span>
          <div className="stat-num">{resources.length}</div>
          <div className="stat-label">Resources available</div>
          <div className="stat-change">↑ {resources.filter(r => r.availableQuantity > 0).length} ready to borrow</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-num">{volunteers.length}</div>
          <div className="stat-label">Active volunteers</div>
          <div className="stat-change">↑ {volunteers.filter(v => v.status === 'confirmed').length} confirmed</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📣</span>
          <div className="stat-num">{announcements.length}</div>
          <div className="stat-label">Announcements</div>
          <div className="stat-change">↑ {announcements.filter(a => !a.isRead).length} unread</div>
        </div>
      </div>

      {/* Main grid */}
      <div className="dash-main-grid">

        {/* Plot map */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon">🗺️</span> Plot map</div>
            <Link to="/plots" className="card-link">Manage →</Link>
          </div>
          {plots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <p style={{ color: 'var(--text2)', fontSize: '13px' }}>No plots yet!</p>
              <Link to="/plots">
                <button className="btn-primary" style={{ marginTop: '12px', fontSize: '12px', padding: '8px 16px' }}>Add Plots</button>
              </Link>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px', marginBottom: '10px' }}>
                {plots.map(plot => {
                  const colors = getPlotColor(plot.status)
                  return (
                    <Link to="/plots" key={plot._id}>
                      <div
                        title={`Plot ${plot.plotNumber} — ${plot.status}${plot.occupant ? ` (${plot.occupant})` : ''}`}
                        style={{ aspectRatio: '1', borderRadius: '4px', cursor: 'pointer', border: `1px solid ${colors.border}`, background: colors.bg }}
                      />
                    </Link>
                  )
                })}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {[
                  { label: `Free (${freePlots})`, bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)' },
                  { label: `Taken (${takenPlots})`, bg: 'rgba(139,92,46,0.25)', border: 'rgba(180,120,60,0.2)' },
                  { label: `Reserved (${reservedPlots})`, bg: 'rgba(251,191,36,0.2)', border: 'rgba(251,191,36,0.3)' },
                ].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: 'var(--text2)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: l.bg, border: `1px solid ${l.border}` }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Announcements */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon">📣</span> Announcements</div>
            <Link to="/announcements" className="card-link">All →</Link>
          </div>
          <div className="announce-list">
            {announcements.length === 0 ? (
              <p style={{ color: 'var(--text2)', fontSize: '13px' }}>No announcements yet.</p>
            ) : (
              announcements.slice(0, 3).map(a => (
                <div key={a._id} className={`announce-item ${a.type}`}>
                  <div className="announce-meta">
                    <span className={`announce-tag ${a.type === 'urgent' ? 'urgent-tag' : a.type === 'event' ? 'event-tag' : ''}`}>{a.type}</span>
                    <span className="announce-date">{new Date(a.date).toLocaleDateString()}</span>
                  </div>
                  <div className="announce-title">{a.title}</div>
                  <div className="announce-body">{a.body}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mini calendar + Resources */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Mini calendar */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ fontSize: '15px' }}><span className="card-title-icon">📅</span> {monthName}</div>
              <Link to="/calendar" className="card-link">Full →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: '9px', color: 'var(--muted)', padding: '2px 0' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
              {Array(daysInMonth).fill(null).map((_, i) => {
                const day = i + 1
                const isToday = day === today.getDate()
                const hasEvent = eventDays.includes(day)
                return (
                  <div key={day} onClick={() => setSelectedDay(day)}
                    style={{
                      aspectRatio: '1', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', cursor: 'pointer', position: 'relative',
                      background: isToday ? 'rgba(74,222,128,0.2)' : selectedDay === day ? 'rgba(74,222,128,0.1)' : 'transparent',
                      color: isToday ? 'var(--green)' : 'var(--text2)',
                      fontWeight: isToday ? '500' : '300',
                    }}>
                    {day}
                    {hasEvent && (
                      <div style={{ position: 'absolute', bottom: '1px', width: '3px', height: '3px', background: 'var(--green2)', borderRadius: '50%' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Resources */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ fontSize: '15px' }}><span className="card-title-icon">🔧</span> Resources</div>
              <Link to="/resources" className="card-link">All →</Link>
            </div>
            <div className="resource-list">
              {resources.length === 0 ? (
                <p style={{ color: 'var(--text2)', fontSize: '12px' }}>No resources yet.</p>
              ) : (
                resources.slice(0, 4).map(r => (
                  <div key={r._id} className="resource-item">
                    <span className="resource-emoji">{r.emoji}</span>
                    <div className="resource-info">
                      <div className="resource-name">{r.name}</div>
                      <div className="resource-qty">{r.availableQuantity} of {r.totalQuantity} available</div>
                    </div>
                    <button
                      onClick={() => handleBorrow(r._id)}
                      className={`resource-avail ${r.availableQuantity > 0 ? 'avail-yes' : 'avail-no'}`}
                      style={{ border: 'none', cursor: 'pointer' }}
                      disabled={r.availableQuantity === 0}>
                      {r.availableQuantity > 0 ? 'Borrow' : 'Taken'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Volunteers + Season progress */}
      <div className="dash-bottom-grid">

        {/* Upcoming volunteers */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon">👥</span> Upcoming volunteers</div>
            <Link to="/volunteers" className="card-link">Manage →</Link>
          </div>
          <div>
            {volunteers.length === 0 ? (
              <p style={{ color: 'var(--text2)', fontSize: '13px' }}>No volunteers yet.</p>
            ) : (
              volunteers.slice(0, 4).map((vol, i) => (
                <div key={vol._id} className="volunteer-item">
                  <div className="vol-avatar" style={{ background: avatarColors[i % 4], color: textColors[i % 4] }}>
                    {getInitials(vol.name)}
                  </div>
                  <div className="vol-info">
                    <div className="vol-name">{vol.name}</div>
                    <div className="vol-task">{vol.task} · {vol.zone}</div>
                  </div>
                  <div className="vol-time">{vol.time}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Season progress */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon">📊</span> Season progress</div>
            <Link to="/plots" className="card-link">Details →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Plots occupied', value: occupiedPct },
              { label: 'Resources borrowed', value: borrowedPct },
              { label: 'Volunteer shifts filled', value: confirmedPct },
              { label: 'Announcements read', value: announcements.length ? Math.round((announcements.filter(a => a.isRead).length / announcements.length) * 100) : 0 },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text2)' }}>{item.label}</span>
                  <span style={{ color: 'var(--green)', fontWeight: '500' }}>{item.value}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer>
        Built with 🌿 for the community · <span>Terraplan AI v1.0</span> · TerraTech LTD
      </footer>
    </div>
  )
}

export default Dashboard