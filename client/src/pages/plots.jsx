import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import axios from 'axios'
import API_BASE from '../api'

// Generate the fixed 50-plot grid (A1–E10) always
const ALL_ZONES = ['A', 'B', 'C', 'D', 'E']
const GRID_PLOTS = ALL_ZONES.flatMap(zone =>
  Array.from({ length: 10 }, (_, i) => ({
    plotNumber: `${zone}${i + 1}`,
    zone: `Zone ${zone}`,
    status: 'free',
    _id: null,
    occupant: null,
  }))
) // 50 entries, always present

const STATUS_COLORS = {
  free:     { bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.35)',  text: '#4ade80' },
  reserved: { bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.45)',  text: '#fbbf24' },
  taken:    { bg: 'rgba(239,68,68,0.13)',   border: 'rgba(239,68,68,0.35)',   text: '#f87171' },
  mine:     { bg: 'rgba(74,222,128,0.35)',  border: '#4ade80',                text: '#4ade80' },
}
const STATUS_LABEL = { free: 'Free', reserved: 'Reserved', taken: 'Taken', mine: 'Mine' }

function Plots() {
  const [dbPlots, setDbPlots] = useState([])   // what's actually in MongoDB
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(false)
  const [action, setAction] = useState('')
  const [occupantName, setOccupant] = useState('')
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState('all')

  const user = JSON.parse(localStorage.getItem('user') || '{"name":"Gardener"}')

  useEffect(() => { fetchDbPlots() }, [])

  const fetchDbPlots = () =>
    axios.get(`${API_BASE}/api/plots`).then(res => setDbPlots(res.data)).catch(() => {})

  // Merge: always use canonical zone/plotNumber from grid, overlay DB status
  const merged = GRID_PLOTS.map(slot => {
    const db = dbPlots.find(p => p.plotNumber === slot.plotNumber)
    return db
      ? { ...slot, status: db.status, occupant: db.occupant, _id: db._id, bookedAt: db.bookedAt }
      : slot
  })

  // Filter
  const filtered = filter === 'all'
    ? merged
    : merged.filter(p => {
        if (filter === 'taken') return p.status === 'taken' || p.status === 'mine'
        return p.status === filter
      })

  const stats = {
    free:     merged.filter(p => p.status === 'free').length,
    reserved: merged.filter(p => p.status === 'reserved').length,
    taken:    merged.filter(p => p.status === 'taken' || p.status === 'mine').length,
  }

  const openModal = (plot) => {
    setSelected(plot)
    setAction('')
    setOccupant(user.name || '')
    setModal(true)
  }

  const handleConfirm = async () => {
    if (!action || !selected) return
    const update = action === 'free'
      ? { status: 'free', occupant: null, bookedAt: null }
      : { status: action === 'reserve' ? 'reserved' : 'taken', occupant: occupantName || user.name, bookedAt: new Date() }

    try {
      if (selected._id) {
        // Update existing DB record
        await axios.put(`${API_BASE}/api/plots/${selected._id}`, update)
      } else {
        // Create new record for this virtual plot
        await axios.post(`${API_BASE}/api/plots`, {
          plotNumber: selected.plotNumber,
          zone: selected.zone,
          ...update,
        })
      }
      setMessage(`Plot ${selected.plotNumber} set to ${update.status} ✅`)
      setModal(false)
      fetchDbPlots()
    } catch { setMessage('Error updating plot!') }
  }

  return (
    <div className="wrapper">
      <Navbar />
      <div style={{ padding: '32px 0' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', marginBottom: '6px' }}>
          🗺️ Plot <em style={{ color: 'var(--green)' }}>Booking</em>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '24px' }}>
          50 plots across 5 zones · Click any plot to set as{' '}
          <span style={{ color: '#4ade80' }}>Free</span>,{' '}
          <span style={{ color: '#fbbf24' }}>Reserved</span>, or{' '}
          <span style={{ color: '#f87171' }}>Taken</span>
        </p>

        {message && (
          <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--green)' }}>
            {message}
          </div>
        )}

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { key: 'all',      label: `All (50)` },
            { key: 'free',     label: `🟢 Free (${stats.free})` },
            { key: 'reserved', label: `🟡 Reserved (${stats.reserved})` },
            { key: 'taken',    label: `🔴 Taken (${stats.taken})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              background: filter === f.key ? 'rgba(74,222,128,0.12)' : 'var(--bg3)',
              color: filter === f.key ? 'var(--green)' : 'var(--text2)',
              border: `1px solid ${filter === f.key ? 'rgba(74,222,128,0.4)' : 'var(--border)'}`,
              padding: '7px 18px', borderRadius: '999px', fontSize: '12px',
              cursor: 'pointer', fontWeight: filter === f.key ? '500' : '300', transition: 'all 0.2s'
            }}>{f.label}</button>
          ))}
        </div>

        {/* Zone grids — always 50 plots visible */}
        {ALL_ZONES.map(zone => {
          const zonePlots = filtered.filter(p => p.zone === `Zone ${zone}`)
          const allZonePlots = merged.filter(p => p.zone === `Zone ${zone}`)
          if (zonePlots.length === 0) return null
          return (
            <div key={zone} className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header" style={{ marginBottom: '14px' }}>
                <div className="card-title">
                  <span className="card-title-icon">📍</span> Zone {zone}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text2)' }}>
                  {allZonePlots.filter(p => p.status === 'free').length} free ·{' '}
                  {allZonePlots.filter(p => p.status !== 'free').length} occupied
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '8px' }}>
                {zonePlots.map((plot, idx) => {
                  const c = STATUS_COLORS[plot.status] || STATUS_COLORS.free
                  return (
                    <div
                      key={plot._id || plot.plotNumber + idx}
                      onClick={() => openModal(plot)}
                      title={`Plot ${plot.plotNumber} — ${STATUS_LABEL[plot.status] || 'Free'}${plot.occupant ? ` (${plot.occupant})` : ''}`}
                      style={{
                        aspectRatio: '1', borderRadius: '8px',
                        background: c.bg, border: `1px solid ${c.border}`,
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        boxShadow: plot.status !== 'free' ? `0 0 8px ${c.border}55` : 'none',
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.transform = 'scale(1.12)'
                        e.currentTarget.style.boxShadow = `0 0 14px ${c.border}`
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = plot.status !== 'free' ? `0 0 8px ${c.border}55` : 'none'
                      }}
                    >
                      <span style={{ fontSize: '9px', color: c.text, fontWeight: '600', lineHeight: 1 }}>
                        {plot.plotNumber}
                      </span>
                      <span style={{ fontSize: '8px', color: c.text, opacity: 0.7, marginTop: '2px' }}>
                        {plot.status === 'free' ? '●' : plot.status === 'reserved' ? '◆' : '■'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Legend */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '8px', marginBottom: '8px' }}>
          {Object.entries(STATUS_COLORS).map(([status, c]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text2)' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: c.bg, border: `1px solid ${c.border}` }} />
              {STATUS_LABEL[status]}
            </div>
          ))}
        </div>

        {/* Occupied list */}
        {merged.filter(p => p.status !== 'free').length > 0 && (
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header" style={{ marginBottom: '14px' }}>
              <div className="card-title">📋 Occupied Plots</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {merged.filter(p => p.status !== 'free').map((plot, i) => {
                const c = STATUS_COLORS[plot.status] || STATUS_COLORS.taken
                return (
                  <div key={plot._id || i} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', color: c.text }}>Plot {plot.plotNumber}</span>
                      <span style={{ fontSize: '10px', color: c.text, background: `${c.border}44`, padding: '2px 8px', borderRadius: '999px', fontWeight: '600' }}>
                        {STATUS_LABEL[plot.status]}
                      </span>
                    </div>
                    {plot.occupant && <p style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '8px' }}>👤 {plot.occupant}</p>}
                    <button onClick={() => openModal(plot)} style={{
                      background: 'rgba(74,222,128,0.12)', color: 'var(--green)',
                      border: 'none', padding: '4px 12px', borderRadius: '6px',
                      fontSize: '11px', cursor: 'pointer'
                    }}>Change status</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 999
        }} onClick={() => setModal(false)}>
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '32px', width: '380px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', marginBottom: '4px' }}>
              Plot <em style={{ color: 'var(--green)' }}>{selected.plotNumber}</em>
            </div>
            <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '24px' }}>
              {selected.zone} · Currently{' '}
              <span style={{ color: STATUS_COLORS[selected.status]?.text }}>
                {STATUS_LABEL[selected.status] || 'Free'}
              </span>
            </p>

            <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '14px', fontWeight: '500' }}>Set status to:</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {[
                { key: 'free',    emoji: '🟢', label: 'Free',    sub: 'Mark available', color: '#4ade80', bg: 'rgba(74,222,128,0.15)',  border: '#4ade80' },
                { key: 'reserve', emoji: '🟡', label: 'Reserve', sub: 'Hold for later', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', border: '#fbbf24' },
                { key: 'take',    emoji: '🔴', label: 'Take',    sub: 'Assign to me',   color: '#f87171', bg: 'rgba(239,68,68,0.15)',  border: '#f87171' },
              ].map(opt => (
                <button key={opt.key} onClick={() => setAction(opt.key)} style={{
                  padding: '14px 8px', borderRadius: '14px',
                  border: `2px solid ${action === opt.key ? opt.border : 'var(--border)'}`,
                  background: action === opt.key ? opt.bg : 'var(--bg3)',
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '5px' }}>{opt.emoji}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: action === opt.key ? opt.color : 'var(--text)' }}>{opt.label}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '3px' }}>{opt.sub}</div>
                </button>
              ))}
            </div>

            {action && action !== 'free' && (
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Occupant name</label>
                <input value={occupantName} onChange={e => setOccupant(e.target.value)} placeholder="Enter name" />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleConfirm}
                disabled={!action}
                className="btn-primary"
                style={{ flex: 1, opacity: action ? 1 : 0.45 }}
              >
                Confirm
              </button>
              <button onClick={() => setModal(false)} style={{
                background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)',
                padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px'
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Plots