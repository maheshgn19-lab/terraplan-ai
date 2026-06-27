import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import axios from 'axios'
import API_BASE from '../api'

const ZONES = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E']

const initSensorData = (pumps) => {
  const d = {}
  pumps.forEach(p => {
    d[p._id] = {
      flowRate:    +(8 + Math.random() * 12).toFixed(1),    // L/min
      pressure:    +(1.5 + Math.random() * 2).toFixed(2),   // bar
      tankLevel:   Math.floor(40 + Math.random() * 55),     // %
      valveOpen:   p.status === 'active',
      tempC:       +(18 + Math.random() * 10).toFixed(1),   // °C water temp
      turbidity:   +(0.5 + Math.random() * 3).toFixed(1),   // NTU
    }
  })
  return d
}

function WaterMap() {
  const [pumps, setPumps]           = useState([])
  const [plots, setPlots]           = useState([])
  const [selectedPump, setSelectedPump] = useState(null)
  const [usageInput, setUsageInput] = useState('')
  const [form, setForm]             = useState({ pumpId: '', name: '', zone: 'Zone A', location: { x: 50, y: 50 }, status: 'active', nearbyPlots: '', capacity: 1000 })
  const [message, setMessage]       = useState('')
  const [showForm, setShowForm]     = useState(false)
  const [sensorData, setSensorData] = useState({})
  const [activeTab, setActiveTab]   = useState('map') // 'map' | 'sensors' | 'manual'
  const [manualForm, setManualForm] = useState({ pumpId: '', flowRate: '', pressure: '', tankLevel: '', tempC: '', note: '' })
  const [manualLog, setManualLog]   = useState([])
  const [liveOn, setLiveOn]         = useState(true)
  const intervalRef = useRef(null)

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (liveOn) {
      intervalRef.current = setInterval(() => {
        setSensorData(prev => {
          const next = { ...prev }
          Object.keys(prev).forEach(id => {
            const old = prev[id]
            next[id] = {
              flowRate:  +Math.max(0, Math.min(30, old.flowRate  + (Math.random() - 0.5) * 1.2)).toFixed(1),
              pressure:  +Math.max(0.5, Math.min(5, old.pressure + (Math.random() - 0.5) * 0.15)).toFixed(2),
              tankLevel: Math.max(5, Math.min(100, old.tankLevel + Math.round((Math.random() - 0.52) * 2))),
              valveOpen: old.valveOpen,
              tempC:     +Math.max(10, Math.min(35, old.tempC    + (Math.random() - 0.5) * 0.3)).toFixed(1),
              turbidity: +Math.max(0.1, Math.min(8, old.turbidity + (Math.random() - 0.5) * 0.2)).toFixed(1),
            }
          })
          return next
        })
      }, 3000)
    }
    return () => clearInterval(intervalRef.current)
  }, [liveOn, pumps])

  const fetchData = async () => {
    const [pumpsRes, plotsRes] = await Promise.all([
      axios.get(`${API_BASE}/api/waterpumps`),
      axios.get(`${API_BASE}/api/plots`)
    ])
    setPumps(pumpsRes.data)
    setPlots(plotsRes.data)
    setSensorData(initSensorData(pumpsRes.data))
  }

  const handleAddPump = async () => {
    try {
      const res = await axios.post(`${API_BASE}/api/waterpumps`, {
        ...form,
        nearbyPlots: form.nearbyPlots.split(',').map(p => p.trim()).filter(Boolean)
      })
      setMessage('Pump added! 💧')
      setForm({ pumpId: '', name: '', zone: 'Zone A', location: { x: 50, y: 50 }, status: 'active', nearbyPlots: '', capacity: 1000 })
      setShowForm(false)
      fetchData()
      setSensorData(prev => ({
        ...prev,
        [res.data._id]: { flowRate: 10, pressure: 2.0, tankLevel: 75, valveOpen: true, tempC: 22, turbidity: 1.0 }
      }))
    } catch { setMessage('Error adding pump!') }
  }

  const handleUse = async (id) => {
    if (!usageInput) return
    await axios.put(`${API_BASE}/api/waterpumps/${id}/use`, { litres: Number(usageInput) })
    setUsageInput('')
    setSelectedPump(null)
    fetchData()
  }

  const handleStatus = async (id, status) => {
    await axios.put(`${API_BASE}/api/waterpumps/${id}`, { status })
    setSensorData(prev => ({
      ...prev,
      [id]: { ...prev[id], valveOpen: status === 'active', flowRate: status === 'active' ? 10 : 0 }
    }))
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

  // Manual sensor override
  const handleManualSubmit = (e) => {
    e.preventDefault()
    const target = pumps.find(p => p.pumpId === manualForm.pumpId)
    if (!target) { setMessage('⚠️ Pump ID not found'); return }
    setSensorData(prev => ({
      ...prev,
      [target._id]: {
        ...prev[target._id],
        ...(manualForm.flowRate   !== '' && { flowRate:   +manualForm.flowRate }),
        ...(manualForm.pressure   !== '' && { pressure:   +manualForm.pressure }),
        ...(manualForm.tankLevel  !== '' && { tankLevel:  +manualForm.tankLevel }),
        ...(manualForm.tempC      !== '' && { tempC:      +manualForm.tempC }),
      }
    }))
    setManualLog(prev => [{
      time: new Date().toLocaleTimeString(),
      pumpId: manualForm.pumpId,
      changes: {
        ...(manualForm.flowRate  !== '' && { 'Flow Rate': `${manualForm.flowRate} L/min` }),
        ...(manualForm.pressure  !== '' && { 'Pressure': `${manualForm.pressure} bar` }),
        ...(manualForm.tankLevel !== '' && { 'Tank Level': `${manualForm.tankLevel}%` }),
        ...(manualForm.tempC     !== '' && { 'Water Temp': `${manualForm.tempC}°C` }),
      },
      note: manualForm.note
    }, ...prev].slice(0, 20))
    setMessage(`✅ Manual override applied to pump ${manualForm.pumpId}`)
    setManualForm({ pumpId: '', flowRate: '', pressure: '', tankLevel: '', tempC: '', note: '' })
  }

  const toggleValve = (id) => {
    setSensorData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        valveOpen: !prev[id].valveOpen,
        flowRate:  !prev[id].valveOpen ? +(8 + Math.random() * 8).toFixed(1) : 0
      }
    }))
  }

  const getStatusColor = (status) => {
    if (status === 'active')      return { color: '#4ade80', bg: 'rgba(74,222,128,0.2)' }
    if (status === 'maintenance') return { color: '#fbbf24', bg: 'rgba(251,191,36,0.2)' }
    return { color: '#f87171', bg: 'rgba(239,68,68,0.2)' }
  }

  const getZoneHeatColor = (zone) => {
    const zp = plots.filter(p => p.zone === zone)
    const dr = zp.length > 0 ? zp.filter(p => !p.soilStatus || p.soilStatus === 'dry').length / zp.length : 0
    if (dr > 0.6) return `rgba(239,68,68,${0.25 + dr * 0.3})`
    if (dr > 0.3) return `rgba(251,191,36,${0.2 + dr * 0.2})`
    return `rgba(74,222,128,${0.1 + (1 - dr) * 0.15})`
  }

  const totalUsageToday = pumps.reduce((s, p) => s + p.dailyUsage, 0)
  const activePumps     = pumps.filter(p => p.status === 'active').length
  const avgTankLevel    = pumps.length > 0 ? Math.round(Object.values(sensorData).reduce((s, d) => s + (d.tankLevel || 0), 0) / pumps.length) : 0

  const SensorBadge = ({ label, value, unit, warn, danger }) => {
    const isWarn   = warn   !== undefined && value >= warn
    const isDanger = danger !== undefined && value >= danger
    const col = isDanger ? '#f87171' : isWarn ? '#fbbf24' : '#38bdf8'
    return (
      <div style={{ background: 'rgba(56,189,248,0.07)', border: `1px solid rgba(56,189,248,0.15)`, borderRadius: '10px', padding: '8px', textAlign: 'center', flex: 1 }}>
        <div style={{ fontSize: '10px', color: 'var(--text2)', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: col, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '9px', color: 'var(--text2)' }}>{unit}</div>
      </div>
    )
  }

  return (
    <div className="wrapper">
      <Navbar />
      <div style={{ padding: '32px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '34px', marginBottom: '6px' }}>
              💧 Water <em style={{ color: '#38bdf8' }}>Management</em>
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '13px' }}>Real-time sensor monitoring + manual override for all pumps</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: liveOn ? '#4ade80' : 'var(--text2)', background: liveOn ? 'rgba(74,222,128,0.1)' : 'rgba(148,163,184,0.1)', border: `1px solid ${liveOn ? 'rgba(74,222,128,0.3)' : 'rgba(148,163,184,0.2)'}`, borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }} onClick={() => setLiveOn(!liveOn)}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: liveOn ? '#4ade80' : '#94a3b8', display: 'inline-block', animation: liveOn ? 'pulse 1.5s infinite' : 'none' }} />
              {liveOn ? 'Live · 3s' : 'Paused'}
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '10px', padding: '10px 16px', marginBottom: '18px', fontSize: '13px', color: '#38bdf8', display: 'flex', justifyContent: 'space-between' }}>
            {message}
            <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* Stats row */}
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '24px' }}>
          {[
            { icon: '💧', val: pumps.length,         label: 'Total Pumps',    col: '#38bdf8' },
            { icon: '✅', val: activePumps,           label: 'Active Pumps',   col: '#4ade80' },
            { icon: '🪣', val: `${totalUsageToday}L`, label: 'Used Today',     col: '#60a5fa' },
            { icon: '🗺️', val: plots.length,          label: 'Total Plots',    col: 'var(--text)' },
            { icon: '📊', val: `${avgTankLevel}%`,    label: 'Avg Tank Level', col: avgTankLevel < 30 ? '#f87171' : avgTankLevel < 60 ? '#fbbf24' : '#4ade80' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <span className="stat-icon">{s.icon}</span>
              <div className="stat-num" style={{ color: s.col }}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          {[
            { key: 'map',     label: '🗺️ Garden Map' },
            { key: 'sensors', label: '📡 Sensor Dashboard' },
            { key: 'manual',  label: '🛠️ Manual Override' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '8px 18px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', border: '1px solid',
              background: activeTab === tab.key ? 'rgba(56,189,248,0.15)' : 'transparent',
              borderColor: activeTab === tab.key ? '#38bdf8' : 'var(--border)',
              color: activeTab === tab.key ? '#38bdf8' : 'var(--text2)',
              fontWeight: activeTab === tab.key ? '600' : '300',
              transition: 'all 0.2s',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: GARDEN MAP ── */}
        {activeTab === 'map' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">🗺️ Garden Water Map</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleResetDaily} className="btn-ghost" style={{ fontSize: '11px', padding: '6px 12px' }}>Reset Daily</button>
                  <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ fontSize: '11px', padding: '6px 12px' }}>+ Add Pump</button>
                </div>
              </div>

              {showForm && (
                <div style={{ background: 'var(--bg3)', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    {[
                      { label: 'Pump ID', key: 'pumpId', placeholder: 'e.g. P1' },
                      { label: 'Name',    key: 'name',   placeholder: 'e.g. North Pump' },
                    ].map(f => (
                      <div key={f.key} className="form-group" style={{ marginBottom: 0 }}>
                        <label>{f.label}</label>
                        <input value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} placeholder={f.placeholder} />
                      </div>
                    ))}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Zone</label>
                      <select value={form.zone} onChange={e => setForm({...form, zone: e.target.value})} style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', width: '100%' }}>
                        {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                      </select>
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

              {/* Map canvas */}
              <div style={{ position: 'relative', width: '100%', paddingBottom: '60%', background: 'var(--bg3)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                {ZONES.slice(0, 4).map((zone, i) => (
                  <div key={zone} style={{ position: 'absolute', left: `${(i % 2) * 50}%`, top: `${Math.floor(i / 2) * 50}%`, width: '50%', height: '50%', background: getZoneHeatColor(zone), transition: 'background 0.5s', pointerEvents: 'none', borderRadius: '4px' }} />
                ))}
                {[25, 50, 75].map(pct => (
                  <div key={`h${pct}`} style={{ position: 'absolute', left: 0, right: 0, top: `${pct}%`, height: '1px', background: 'rgba(74,222,128,0.08)' }} />
                ))}
                {[25, 50, 75].map(pct => (
                  <div key={`v${pct}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct}%`, width: '1px', background: 'rgba(74,222,128,0.08)' }} />
                ))}
                {ZONES.slice(0, 4).map((zone, i) => (
                  <div key={zone} style={{ position: 'absolute', left: `${(i % 2) * 50 + 2}%`, top: `${Math.floor(i / 2) * 50 + 2}%`, fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', pointerEvents: 'none' }}>{zone}</div>
                ))}
                {plots.map((plot, i) => {
                  const colors = { free: '#22c55e', taken: '#8b5e3c', reserved: '#fbbf24', mine: '#4ade80' }
                  return (
                    <div key={plot._id} title={`Plot ${plot.plotNumber} — ${plot.soilStatus || 'dry'}`} style={{ position: 'absolute', left: `${(i % 8) * 12 + 2}%`, top: `${Math.floor(i / 8) * 20 + 5}%`, width: '10px', height: '10px', borderRadius: '2px', background: colors[plot.status] || '#22c55e', opacity: 0.6, transform: 'translate(-50%, -50%)' }} />
                  )
                })}
                {pumps.map(pump => {
                  const sc = getStatusColor(pump.status)
                  const sd = sensorData[pump._id] || {}
                  const isSelected = selectedPump?._id === pump._id
                  return (
                    <div key={pump._id} onClick={() => setSelectedPump(isSelected ? null : pump)} style={{ position: 'absolute', left: `${pump.location.x}%`, top: `${pump.location.y}%`, transform: 'translate(-50%, -50%)', cursor: 'pointer', zIndex: 10 }}>
                      {pump.status === 'active' && <div style={{ position: 'absolute', inset: '-8px', borderRadius: '50%', border: `1px solid ${sc.color}`, opacity: 0.4, animation: 'pulse 2s ease-in-out infinite' }} />}
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: sc.bg, border: `2px solid ${sc.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', boxShadow: isSelected ? `0 0 16px ${sc.color}` : 'none', transition: 'all 0.2s' }}>💧</div>
                      <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '4px', fontSize: '9px', color: sc.color, whiteSpace: 'nowrap', background: 'rgba(10,15,10,0.85)', padding: '1px 4px', borderRadius: '3px' }}>
                        {pump.pumpId} · {sd.tankLevel}%
                      </div>
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
                <div style={{ width: '100%', fontSize: '11px', color: 'var(--text2)', marginBottom: '2px', fontWeight: '500' }}>Zone Heatmap (soil dryness):</div>
                {[
                  { color: 'rgba(239,68,68,0.5)',   label: '🔴 Needs water urgently' },
                  { color: 'rgba(251,191,36,0.4)',  label: '🟡 Needs water soon' },
                  { color: 'rgba(74,222,128,0.25)', label: '🟢 Well watered' },
                ].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text2)' }}>
                    <div style={{ width: '16px', height: '10px', borderRadius: '2px', background: l.color }} /> {l.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right panel — selected pump + zone status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedPump && (() => {
                const sd = sensorData[selectedPump._id] || {}
                const sc = getStatusColor(selectedPump.status)
                return (
                  <div className="card" style={{ border: `1px solid ${sc.color}40` }}>
                    <div className="card-header">
                      <div className="card-title" style={{ fontSize: '15px', color: '#38bdf8' }}>💧 {selectedPump.name}</div>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: sc.bg, color: sc.color }}>{selectedPump.status}</span>
                    </div>

                    {/* Live sensor mini-grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
                      <SensorBadge label="Flow"     value={sd.flowRate}   unit="L/min" />
                      <SensorBadge label="Pressure" value={sd.pressure}   unit="bar"   warn={3.5} danger={4.5} />
                      <SensorBadge label="Tank"     value={`${sd.tankLevel}%`} unit="level"  />
                      <SensorBadge label="Temp"     value={`${sd.tempC}°C`}    unit="water"  warn={30} />
                      <SensorBadge label="Turbidity" value={sd.turbidity}  unit="NTU"  warn={4} danger={6} />
                      <div style={{ background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: '10px', padding: '8px', textAlign: 'center', flex: 1 }}>
                        <div style={{ fontSize: '10px', color: 'var(--text2)', marginBottom: '2px' }}>Valve</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: sd.valveOpen ? '#4ade80' : '#f87171' }}>{sd.valveOpen ? 'OPEN' : 'CLOSED'}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text2)' }}>status</div>
                      </div>
                    </div>

                    {/* Tank level bar */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text2)' }}>Tank level</span>
                        <span style={{ color: '#38bdf8' }}>{sd.tankLevel}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${sd.tankLevel}%`, background: sd.tankLevel < 20 ? 'linear-gradient(90deg,#ef4444,#f87171)' : sd.tankLevel < 50 ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#22c55e,#4ade80)', transition: 'width 1s ease' }} />
                      </div>
                    </div>

                    {/* Daily usage bar */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text2)' }}>Daily usage</span>
                        <span style={{ color: '#60a5fa' }}>{selectedPump.dailyUsage}L / {selectedPump.capacity}L</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min((selectedPump.dailyUsage / selectedPump.capacity) * 100, 100)}%`, background: selectedPump.dailyUsage > selectedPump.capacity * 0.8 ? 'linear-gradient(90deg,#ef4444,#f87171)' : 'linear-gradient(90deg,#22c55e,#4ade80)' }} />
                      </div>
                    </div>

                    {/* Valve toggle */}
                    <button onClick={() => toggleValve(selectedPump._id)} style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', border: '1px solid', background: sd.valveOpen ? 'rgba(239,68,68,0.12)' : 'rgba(74,222,128,0.12)', color: sd.valveOpen ? '#f87171' : '#4ade80', borderColor: sd.valveOpen ? 'rgba(239,68,68,0.3)' : 'rgba(74,222,128,0.3)' }}>
                      {sd.valveOpen ? '🔴 Close Valve' : '🟢 Open Valve'}
                    </button>

                    {/* Log usage */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input type="number" value={usageInput} onChange={e => setUsageInput(e.target.value)} placeholder="Litres used" style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text)', fontSize: '12px' }} />
                      <button onClick={() => handleUse(selectedPump._id)} className="btn-primary" style={{ fontSize: '11px', padding: '8px 12px' }}>Log</button>
                    </div>

                    {/* Status buttons */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                      {['active', 'maintenance', 'inactive'].map(st => (
                        <button key={st} onClick={() => handleStatus(selectedPump._id, st)} style={{ flex: 1, padding: '5px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', border: 'none', background: selectedPump.status === st ? getStatusColor(st).bg : 'var(--bg3)', color: getStatusColor(st).color }}>
                          {st}
                        </button>
                      ))}
                    </div>

                    <button onClick={() => handleDelete(selectedPump._id)} style={{ width: '100%', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'none', padding: '6px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                      🗑️ Delete Pump
                    </button>
                  </div>
                )
              })()}

              {/* Zone Status */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ fontSize: '15px' }}>🌡️ Zone Water Status</div>
                </div>
                {ZONES.map(zone => {
                  const zp = plots.filter(p => p.zone === zone)
                  const dry   = zp.filter(p => !p.soilStatus || p.soilStatus === 'dry').length
                  const moist = zp.filter(p => p.soilStatus === 'moist').length
                  const wet   = zp.filter(p => p.soilStatus === 'wet').length
                  const dr    = zp.length > 0 ? dry / zp.length : 0
                  const urg   = dr > 0.6 ? { label: 'Urgent 🔴', color: '#f87171' } : dr > 0.3 ? { label: 'Soon 🟡', color: '#fbbf24' } : { label: 'Good 🟢', color: '#4ade80' }
                  return (
                    <div key={zone} style={{ padding: '10px', background: 'var(--bg3)', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)' }}>{zone}</span>
                        <span style={{ fontSize: '11px', color: urg.color }}>{urg.label}</span>
                      </div>
                      {zp.length === 0 ? (
                        <p style={{ fontSize: '11px', color: 'var(--muted)' }}>No plots in this zone</p>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text2)' }}>
                          <span style={{ color: '#fbbf24' }}>🏜️ {dry}</span>
                          <span style={{ color: 'var(--green)' }}>🌱 {moist}</span>
                          <span style={{ color: '#60a5fa' }}>💧 {wet}</span>
                          <span style={{ color: 'var(--muted)' }}>/ {zp.length} plots</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: SENSOR DASHBOARD ── */}
        {activeTab === 'sensors' && (
          <>
            <div className="card" style={{ marginBottom: '20px', border: '1px solid rgba(56,189,248,0.3)' }}>
              <div className="card-header">
                <div className="card-title" style={{ color: '#38bdf8' }}>
                  <span className="card-title-icon">📡</span> Live Sensor Feed — All Pumps
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: liveOn ? '#4ade80' : 'var(--text2)' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: liveOn ? '#4ade80' : '#94a3b8', display: 'inline-block', animation: liveOn ? 'pulse 1.5s infinite' : 'none' }} />
                  {liveOn ? 'Live · updates every 3s' : 'Paused'}
                </div>
              </div>

              {pumps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>💧</div>
                  <p>No pumps found. Add pumps in the Garden Map tab.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {pumps.map(pump => {
                    const sd  = sensorData[pump._id] || {}
                    const sc  = getStatusColor(pump.status)
                    const pressureAlert = sd.pressure >= 4.5
                    const turbAlert     = sd.turbidity >= 6
                    const tankLow       = (sd.tankLevel || 0) < 20
                    const hasAlert      = pressureAlert || turbAlert || tankLow
                    return (
                      <div key={pump._id} style={{ background: 'var(--bg3)', border: `1px solid ${hasAlert ? 'rgba(239,68,68,0.4)' : 'rgba(56,189,248,0.2)'}`, borderRadius: '16px', padding: '18px' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#38bdf8' }}>💧 {pump.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{pump.pumpId} · {pump.zone}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {hasAlert && <span style={{ fontSize: '10px', background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '2px 8px', borderRadius: '999px' }}>⚠️ Alert</span>}
                            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: sc.bg, color: sc.color }}>{pump.status}</span>
                          </div>
                        </div>

                        {/* 6 sensor tiles */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                          {[
                            { label: '💧 Flow Rate', value: `${sd.flowRate} L/min`,   alert: false },
                            { label: '⚡ Pressure',   value: `${sd.pressure} bar`,     alert: pressureAlert },
                            { label: '🪣 Tank',        value: `${sd.tankLevel}%`,       alert: tankLow },
                            { label: '🌡️ Water Temp', value: `${sd.tempC}°C`,          alert: sd.tempC > 30 },
                            { label: '🔬 Turbidity',  value: `${sd.turbidity} NTU`,    alert: turbAlert },
                            { label: '🔧 Valve',       value: sd.valveOpen ? 'OPEN' : 'CLOSED', alert: false, valveColor: sd.valveOpen ? '#4ade80' : '#f87171' },
                          ].map((tile, i) => (
                            <div key={i} style={{ background: tile.alert ? 'rgba(239,68,68,0.08)' : 'rgba(56,189,248,0.07)', border: `1px solid ${tile.alert ? 'rgba(239,68,68,0.25)' : 'rgba(56,189,248,0.12)'}`, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', color: 'var(--text2)', marginBottom: '4px' }}>{tile.label}</div>
                              <div style={{ fontSize: '15px', fontWeight: '700', color: tile.valveColor || (tile.alert ? '#f87171' : '#38bdf8'), lineHeight: 1 }}>{tile.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Tank bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text2)', marginBottom: '3px' }}>
                            <span>Tank Level</span><span>{sd.tankLevel}%</span>
                          </div>
                          <div style={{ height: '5px', background: 'rgba(56,189,248,0.15)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${sd.tankLevel}%`, background: tankLow ? 'linear-gradient(90deg,#ef4444,#f87171)' : 'linear-gradient(90deg,#0284c7,#38bdf8)', borderRadius: '999px', transition: 'width 1s ease' }} />
                          </div>
                        </div>

                        {/* Valve quick toggle */}
                        <button onClick={() => toggleValve(pump._id)} style={{ width: '100%', marginTop: '10px', padding: '6px', borderRadius: '7px', fontSize: '11px', cursor: 'pointer', border: '1px solid', background: sd.valveOpen ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.1)', color: sd.valveOpen ? '#f87171' : '#4ade80', borderColor: sd.valveOpen ? 'rgba(239,68,68,0.3)' : 'rgba(74,222,128,0.3)' }}>
                          {sd.valveOpen ? '🔴 Close Valve' : '🟢 Open Valve'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── TAB: MANUAL OVERRIDE ── */}
        {activeTab === 'manual' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Override form */}
            <div className="card" style={{ border: '1px solid rgba(251,191,36,0.3)' }}>
              <div className="card-header">
                <div className="card-title" style={{ color: '#fbbf24' }}>
                  <span className="card-title-icon">🛠️</span> Manual Sensor Override
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '16px', lineHeight: 1.6 }}>
                Override sensor readings for a specific pump. Leave fields blank to keep current values. Changes apply immediately to the live display.
              </p>
              <form onSubmit={handleManualSubmit}>
                <div className="form-group">
                  <label>Pump ID *</label>
                  <select value={manualForm.pumpId} onChange={e => setManualForm({...manualForm, pumpId: e.target.value})} required style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', width: '100%' }}>
                    <option value="">— select pump —</option>
                    {pumps.map(p => <option key={p._id} value={p.pumpId}>{p.pumpId} · {p.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { label: 'Flow Rate (L/min)', key: 'flowRate', placeholder: 'e.g. 12.5', step: '0.1', min: '0', max: '30' },
                    { label: 'Pressure (bar)',    key: 'pressure', placeholder: 'e.g. 2.5',  step: '0.01', min: '0', max: '10' },
                    { label: 'Tank Level (%)',    key: 'tankLevel', placeholder: 'e.g. 75',  step: '1', min: '0', max: '100' },
                    { label: 'Water Temp (°C)',   key: 'tempC',    placeholder: 'e.g. 22',   step: '0.1', min: '0', max: '50' },
                  ].map(f => (
                    <div key={f.key} className="form-group" style={{ marginBottom: 0 }}>
                      <label>{f.label}</label>
                      <input type="number" step={f.step} min={f.min} max={f.max} value={manualForm[f.key]} onChange={e => setManualForm({...manualForm, [f.key]: e.target.value})} placeholder={f.placeholder} />
                    </div>
                  ))}
                </div>
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>Note / Reason</label>
                  <input value={manualForm.note} onChange={e => setManualForm({...manualForm, note: e.target.value})} placeholder="e.g. Calibration after maintenance" />
                </div>
                <button type="submit" style={{ width: '100%', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.35)', padding: '10px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' }}>
                  🛠️ Apply Override
                </button>
              </form>
            </div>

            {/* Override log */}
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ fontSize: '15px' }}>📋 Override Log</div>
                {manualLog.length > 0 && (
                  <button onClick={() => setManualLog([])} style={{ fontSize: '10px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none', padding: '3px 9px', borderRadius: '6px', cursor: 'pointer' }}>Clear</button>
                )}
              </div>
              {manualLog.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text2)', fontSize: '12px' }}>
                  <div style={{ fontSize: '30px', marginBottom: '8px' }}>📋</div>
                  No manual overrides yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                  {manualLog.map((entry, i) => (
                    <div key={i} style={{ background: 'var(--bg3)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#fbbf24' }}>Pump {entry.pumpId}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text2)' }}>{entry.time}</span>
                      </div>
                      {Object.entries(entry.changes).map(([k, v]) => (
                        <div key={k} style={{ fontSize: '11px', color: 'var(--text2)' }}>✏️ {k}: <span style={{ color: 'var(--text)' }}>{v}</span></div>
                      ))}
                      {entry.note && <div style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '4px', fontStyle: 'italic' }}>📝 {entry.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default WaterMap