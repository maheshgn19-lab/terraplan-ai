import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import axios from 'axios'
import API_BASE from '../api'

function WaterMap() {
  const [pumps, setPumps] = useState([])
  const [plots, setPlots] = useState([])
  const [selectedPump, setSelectedPump] = useState(null)
  const [usageInput, setUsageInput] = useState('')
  const [form, setForm] = useState({ pumpId: '', name: '', zone: '', location: { x: 50, y: 50 }, status: 'active', nearbyPlots: '', capacity: 1000 })
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const [pumpsRes, plotsRes] = await Promise.all([
      axios.get(`${API_BASE}/api/waterpumps`),
      axios.get(`${API_BASE}/api/plots`)
    ])
    setPumps(pumpsRes.data)
    setPlots(plotsRes.data)
  }

  const handleAddPump = async () => {
    try {
      await axios.post(`${API_BASE}/api/waterpumps`, {
        ...form,
        nearbyPlots: form.nearbyPlots.split(',').map(p => p.trim()).filter(Boolean)
      })
      setMessage('Pump added! 💧')
      setForm({ pumpId: '', name: '', zone: '', location: { x: 50, y: 50 }, status: 'active', nearbyPlots: '', capacity: 1000 })
      setShowForm(false)
      fetchData()
    } catch (err) { setMessage('Error adding pump!') }
  }

  const handleUse = async (id) => {
    if (!usageInput) return
    try {
      await axios.put(`${API_BASE}/api/waterpumps/${id}/use`, { litres: Number(usageInput) })
      setUsageInput('')
      setSelectedPump(null)
      fetchData()
    } catch (err) { console.error(err) }
  }

  const handleStatus = async (id, status) => {
    await axios.put(`${API_BASE}/api/waterpumps/${id}`, { status })
    fetchData()
  }

  const handleDelete = async (id) => {
    await axios.delete(`${API_BASE}/api/waterpumps/${id}`)
    setSelectedPump(null)
    fetchData()
  }

  const handleResetDaily = async () => {
    await axios.post(`${API_BASE}/api/waterpumps/reset-daily`)
    fetchData()
  }

  const getStatusColor = (status) => {
    if (status === 'active') return { color: '#4ade80', bg: 'rgba(74,222,128,0.2)' }
    if (status === 'maintenance') return { color: '#fbbf24', bg: 'rgba(251,191,36,0.2)' }
    return { color: '#f87171', bg: 'rgba(239,68,68,0.2)' }
  }

  const getZoneHeatColor = (zone) => {
    const zonePlots = plots.filter(p => p.zone === zone)
    const dryCount = zonePlots.filter(p => !p.soilStatus || p.soilStatus === 'dry').length
    const total = zonePlots.length
    const dryRatio = total > 0 ? dryCount / total : 0
    if (dryRatio > 0.6) return `rgba(239,68,68,${0.25 + dryRatio * 0.3})`
    if (dryRatio > 0.3) return `rgba(251,191,36,${0.2 + dryRatio * 0.2})`
    return `rgba(74,222,128,${0.1 + (1 - dryRatio) * 0.15})`
  }

  const totalUsageToday = pumps.reduce((sum, p) => sum + p.dailyUsage, 0)
  const activePumps = pumps.filter(p => p.status === 'active').length

  return (
    <div className="wrapper">
      <Navbar />
      <div style={{ padding: '32px 0' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', marginBottom: '24px' }}>
          💧 Water <em style={{ color: 'var(--green)' }}>Management</em>
        </h1>

        {/* Stats */}
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
          <div className="stat-card">
            <span className="stat-icon">💧</span>
            <div className="stat-num">{pumps.length}</div>
            <div className="stat-label">Total pumps</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div className="stat-num" style={{ color: 'var(--green)' }}>{activePumps}</div>
            <div className="stat-label">Active pumps</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🪣</span>
            <div className="stat-num" style={{ color: '#60a5fa' }}>{totalUsageToday}L</div>
            <div className="stat-label">Used today</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🗺️</span>
            <div className="stat-num">{plots.length}</div>
            <div className="stat-label">Total plots</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>

          {/* Visual Garden Map */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🗺️ Garden Water Map</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleResetDaily} className="btn-ghost" style={{ fontSize: '11px', padding: '6px 12px' }}>Reset Daily</button>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ fontSize: '11px', padding: '6px 12px' }}>+ Add Pump</button>
              </div>
            </div>

            {/* Add pump form */}
            {showForm && (
              <div style={{ background: 'var(--bg3)', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid var(--border)' }}>
                {message && <p style={{ color: 'var(--green)', fontSize: '12px', marginBottom: '8px' }}>{message}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Pump ID</label>
                    <input value={form.pumpId} onChange={e => setForm({...form, pumpId: e.target.value})} placeholder="e.g. P1" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Name</label>
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. North Pump" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Zone</label>
                    <input value={form.zone} onChange={e => setForm({...form, zone: e.target.value})} placeholder="e.g. Zone A" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Position X (%)</label>
                    <input type="number" min="0" max="100" value={form.location.x} onChange={e => setForm({...form, location: {...form.location, x: Number(e.target.value)}})} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Position Y (%)</label>
                    <input type="number" min="0" max="100" value={form.location.y} onChange={e => setForm({...form, location: {...form.location, y: Number(e.target.value)}})} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Capacity (L)</label>
                    <input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: Number(e.target.value)})} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, gridColumn: '1/-1' }}>
                    <label>Nearby Plots (comma separated)</label>
                    <input value={form.nearbyPlots} onChange={e => setForm({...form, nearbyPlots: e.target.value})} placeholder="e.g. A1, A2, B1" />
                  </div>
                </div>
                <button className="btn-primary" onClick={handleAddPump} style={{ fontSize: '12px' }}>Add Pump</button>
              </div>
            )}

            {/* Garden map canvas */}
            <div style={{
              position: 'relative', width: '100%', paddingBottom: '60%',
              background: 'var(--bg3)', borderRadius: '16px',
              border: '1px solid var(--border)', overflow: 'hidden'
            }}>

              {/* Heatmap zone overlays */}
              {['Zone A', 'Zone B', 'Zone C', 'Zone D'].map((zone, i) => (
                <div key={zone} style={{
                  position: 'absolute',
                  left: `${(i % 2) * 50}%`,
                  top: `${Math.floor(i / 2) * 50}%`,
                  width: '50%', height: '50%',
                  background: getZoneHeatColor(zone),
                  transition: 'background 0.5s',
                  pointerEvents: 'none',
                  borderRadius: '4px'
                }} />
              ))}

              {/* Grid lines */}
              {[25, 50, 75].map(pct => (
                <div key={`h${pct}`} style={{ position: 'absolute', left: 0, right: 0, top: `${pct}%`, height: '1px', background: 'rgba(74,222,128,0.08)' }} />
              ))}
              {[25, 50, 75].map(pct => (
                <div key={`v${pct}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct}%`, width: '1px', background: 'rgba(74,222,128,0.08)' }} />
              ))}

              {/* Zone labels */}
              {['Zone A', 'Zone B', 'Zone C', 'Zone D'].map((zone, i) => (
                <div key={zone} style={{
                  position: 'absolute',
                  left: `${(i % 2) * 50 + 2}%`,
                  top: `${Math.floor(i / 2) * 50 + 2}%`,
                  fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', pointerEvents: 'none'
                }}>{zone}</div>
              ))}

              {/* Plot dots */}
              {plots.map((plot, i) => {
                const x = (i % 8) * 12 + 2
                const y = Math.floor(i / 8) * 20 + 5
                const colors = { free: '#22c55e', taken: '#8b5e3c', reserved: '#fbbf24', mine: '#4ade80' }
                return (
                  <div key={plot._id} title={`Plot ${plot.plotNumber} — ${plot.soilStatus || 'dry'}`} style={{
                    position: 'absolute', left: `${x}%`, top: `${y}%`,
                    width: '10px', height: '10px', borderRadius: '2px',
                    background: colors[plot.status] || '#22c55e', opacity: 0.6,
                    transform: 'translate(-50%, -50%)'
                  }} />
                )
              })}

              {/* Water pump markers */}
              {pumps.map(pump => {
                const sc = getStatusColor(pump.status)
                const isSelected = selectedPump?._id === pump._id
                return (
                  <div key={pump._id} onClick={() => setSelectedPump(isSelected ? null : pump)}
                    style={{ position: 'absolute', left: `${pump.location.x}%`, top: `${pump.location.y}%`, transform: 'translate(-50%, -50%)', cursor: 'pointer', zIndex: 10 }}>
                    {pump.status === 'active' && (
                      <div style={{ position: 'absolute', inset: '-8px', borderRadius: '50%', border: `1px solid ${sc.color}`, opacity: 0.4, animation: 'pulse 2s ease-in-out infinite' }} />
                    )}
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: sc.bg, border: `2px solid ${sc.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', boxShadow: isSelected ? `0 0 16px ${sc.color}` : 'none', transition: 'all 0.2s'
                    }}>💧</div>
                    <div style={{
                      position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                      marginTop: '4px', fontSize: '9px', color: sc.color, whiteSpace: 'nowrap',
                      background: 'rgba(10,15,10,0.85)', padding: '1px 4px', borderRadius: '3px'
                    }}>{pump.pumpId} — {pump.name}</div>
                  </div>
                )
              })}

              {pumps.length === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', fontSize: '13px' }}>
                  No pumps added yet. Click "+ Add Pump" to place one!
                </div>
              )}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
              <div style={{ width: '100%', fontSize: '11px', color: 'var(--text2)', marginBottom: '2px', fontWeight: '500' }}>Pump Status:</div>
              {[
                { color: '#4ade80', label: 'Active', round: true },
                { color: '#fbbf24', label: 'Maintenance', round: true },
                { color: '#f87171', label: 'Inactive', round: true },
                { color: 'rgba(74,222,128,0.5)', label: 'Plot', round: false },
              ].map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text2)' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: l.round ? '50%' : '2px', background: l.color }} />
                  {l.label}
                </div>
              ))}
              <div style={{ width: '100%', fontSize: '11px', color: 'var(--text2)', marginTop: '6px', marginBottom: '2px', fontWeight: '500' }}>Zone Heatmap (based on soil status):</div>
              {[
                { color: 'rgba(239,68,68,0.5)', label: '🔴 Needs water urgently' },
                { color: 'rgba(251,191,36,0.4)', label: '🟡 Needs water soon' },
                { color: 'rgba(74,222,128,0.25)', label: '🟢 Well watered' },
              ].map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text2)' }}>
                  <div style={{ width: '16px', height: '10px', borderRadius: '2px', background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Selected pump details */}
            {selectedPump && (
              <div className="card" style={{ border: '1px solid rgba(74,222,128,0.4)' }}>
                <div className="card-header">
                  <div className="card-title" style={{ fontSize: '15px' }}>💧 {selectedPump.name}</div>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: getStatusColor(selectedPump.status).bg, color: getStatusColor(selectedPump.status).color }}>
                    {selectedPump.status}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '12px' }}>
                  <p>🆔 ID: {selectedPump.pumpId}</p>
                  <p>📍 Zone: {selectedPump.zone}</p>
                  <p>🪣 Capacity: {selectedPump.capacity}L</p>
                  <p>💧 Used today: {selectedPump.dailyUsage}L</p>
                  <p>📊 Total usage: {selectedPump.totalUsage}L</p>
                  <p>⏰ Last used: {selectedPump.lastUsed ? new Date(selectedPump.lastUsed).toLocaleString() : 'Never'}</p>
                  {selectedPump.nearbyPlots?.length > 0 && <p>🗺️ Serves: {selectedPump.nearbyPlots.join(', ')}</p>}
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text2)' }}>Daily usage</span>
                    <span style={{ color: '#60a5fa' }}>{selectedPump.dailyUsage}L / {selectedPump.capacity}L</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${Math.min((selectedPump.dailyUsage / selectedPump.capacity) * 100, 100)}%`,
                      background: selectedPump.dailyUsage > selectedPump.capacity * 0.8 ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #22c55e, #4ade80)'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input type="number" value={usageInput} onChange={e => setUsageInput(e.target.value)}
                    placeholder="Litres used"
                    style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text)', fontSize: '12px' }} />
                  <button onClick={() => handleUse(selectedPump._id)} className="btn-primary" style={{ fontSize: '11px', padding: '8px 12px' }}>Log</button>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  {['active', 'maintenance', 'inactive'].map(st => (
                    <button key={st} onClick={() => handleStatus(selectedPump._id, st)}
                      style={{
                        flex: 1, padding: '5px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', border: 'none',
                        background: selectedPump.status === st ? getStatusColor(st).bg : 'var(--bg3)',
                        color: getStatusColor(st).color, fontWeight: selectedPump.status === st ? '500' : '300'
                      }}>{st}</button>
                  ))}
                </div>

                <button onClick={() => handleDelete(selectedPump._id)} style={{ width: '100%', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'none', padding: '6px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Delete Pump</button>
              </div>
            )}

            {/* Zone water status */}
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ fontSize: '15px' }}>🌡️ Zone Status</div>
              </div>
              {['Zone A', 'Zone B', 'Zone C', 'Zone D'].map(zone => {
                const zonePlots = plots.filter(p => p.zone === zone)
                const dryCount = zonePlots.filter(p => !p.soilStatus || p.soilStatus === 'dry').length
                const moistCount = zonePlots.filter(p => p.soilStatus === 'moist').length
                const wetCount = zonePlots.filter(p => p.soilStatus === 'wet').length
                const total = zonePlots.length
                const dryRatio = total > 0 ? dryCount / total : 0
                const urgency = dryRatio > 0.6 ? { label: 'Urgent 🔴', color: '#f87171' } : dryRatio > 0.3 ? { label: 'Soon 🟡', color: '#fbbf24' } : { label: 'Good 🟢', color: '#4ade80' }
                return (
                  <div key={zone} style={{ padding: '10px', background: 'var(--bg3)', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)' }}>{zone}</span>
                      <span style={{ fontSize: '11px', color: urgency.color }}>{urgency.label}</span>
                    </div>
                    {total === 0 ? (
                      <p style={{ fontSize: '11px', color: 'var(--muted)' }}>No plots in this zone</p>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text2)' }}>
                        <span style={{ color: '#fbbf24' }}>🏜️ {dryCount}</span>
                        <span style={{ color: 'var(--green)' }}>🌱 {moistCount}</span>
                        <span style={{ color: '#60a5fa' }}>💧 {wetCount}</span>
                        <span style={{ color: 'var(--muted)' }}>/ {total} plots</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* All pumps list */}
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ fontSize: '15px' }}>All Pumps ({pumps.length})</div>
              </div>
              {pumps.length === 0 ? (
                <p style={{ color: 'var(--text2)', fontSize: '12px' }}>No pumps yet. Add one!</p>
              ) : (
                pumps.map(pump => {
                  const sc = getStatusColor(pump.status)
                  return (
                    <div key={pump._id} onClick={() => setSelectedPump(pump)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--bg3)', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer', border: `1px solid ${selectedPump?._id === pump._id ? sc.color : 'var(--border)'}`, transition: 'all 0.2s' }}>
                      <div style={{ fontSize: '20px' }}>💧</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>{pump.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{pump.zone} · {pump.dailyUsage}L today</div>
                      </div>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: sc.bg, color: sc.color }}>{pump.status}</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WaterMap