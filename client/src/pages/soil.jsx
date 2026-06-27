import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import axios from 'axios'
import API_BASE from '../api'

const GRID_PLOTS = ['A', 'B', 'C', 'D', 'E'].flatMap(zone =>
  Array.from({ length: 10 }, (_, i) => ({
    plotNumber: `${zone}${i + 1}`,
    zone: `Zone ${zone}`,
    soilStatus: 'dry',
    lastWatered: null,
    _id: null,
  }))
)

const initSoilSensors = () => {
  const s = {}
  GRID_PLOTS.forEach(p => {
    s[p.plotNumber] = {
      moisture:    Math.floor(20 + Math.random() * 70),   // %
      tempC:       +(18 + Math.random() * 14).toFixed(1), // °C soil temp
      ph:          +(5.5 + Math.random() * 2).toFixed(1), // pH
      humidity:    Math.floor(40 + Math.random() * 50),   // %
      nitrogen:    Math.floor(10 + Math.random() * 80),   // ppm
      conductivity:+(0.5 + Math.random() * 3).toFixed(2), // mS/cm
    }
  })
  return s
}

const SOIL_STATES = ['dry', 'moist', 'wet']

function Soil() {
  const [plots, setPlots]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [sensors, setSensors]     = useState(initSoilSensors)
  const [liveOn, setLiveOn]       = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'sensors' | 'manual'
  const [filterZone, setFilterZone] = useState('all')
  const [filterSoil, setFilterSoil] = useState('all')
  const [message, setMessage]     = useState('')
  const [manualForm, setManualForm] = useState({ plotNumber: '', soilStatus: 'moist', moisture: '', tempC: '', ph: '', nitrogen: '', note: '' })
  const [manualLog, setManualLog] = useState([])
  const [bulkZone, setBulkZone]   = useState('Zone A')
  const [bulkStatus, setBulkStatus] = useState('moist')
  const intervalRef = useRef(null)

  useEffect(() => { fetchPlots() }, [])

  useEffect(() => {
    if (liveOn) {
      intervalRef.current = setInterval(() => {
        setSensors(prev => {
          const next = { ...prev }
          GRID_PLOTS.forEach(p => {
            const old = prev[p.plotNumber]
            if (!old) return
            next[p.plotNumber] = {
              moisture:     Math.max(0,   Math.min(100, old.moisture     + Math.round((Math.random() - 0.5) * 3))),
              tempC:        +Math.max(10, Math.min(40,  old.tempC        + (Math.random() - 0.5) * 0.4)).toFixed(1),
              ph:           +Math.max(4,  Math.min(9,   old.ph           + (Math.random() - 0.5) * 0.05)).toFixed(1),
              humidity:     Math.max(20,  Math.min(100, old.humidity     + Math.round((Math.random() - 0.5) * 2))),
              nitrogen:     Math.max(0,   Math.min(150, old.nitrogen     + Math.round((Math.random() - 0.5) * 2))),
              conductivity: +Math.max(0.1, Math.min(5,  old.conductivity + (Math.random() - 0.5) * 0.05)).toFixed(2),
            }
          })
          return next
        })
      }, 3000)
    }
    return () => clearInterval(intervalRef.current)
  }, [liveOn])

  const fetchPlots = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/plots`)
      setPlots(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const updateSoil = async (id, soilStatus) => {
    try {
      await axios.put(`${API_BASE}/api/plots/${id}`, {
        soilStatus,
        lastWatered: soilStatus === 'moist' || soilStatus === 'wet' ? new Date() : undefined
      })
      fetchPlots()
    } catch (err) { console.error(err) }
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    const dbPlot = plots.find(p => p.plotNumber === manualForm.plotNumber)
    // Update DB soil status
    if (dbPlot) {
      await updateSoil(dbPlot._id, manualForm.soilStatus)
    }
    // Update local sensor readings
    setSensors(prev => ({
      ...prev,
      [manualForm.plotNumber]: {
        ...prev[manualForm.plotNumber],
        ...(manualForm.moisture  !== '' && { moisture:     +manualForm.moisture }),
        ...(manualForm.tempC     !== '' && { tempC:        +manualForm.tempC }),
        ...(manualForm.ph        !== '' && { ph:           +manualForm.ph }),
        ...(manualForm.nitrogen  !== '' && { nitrogen:     +manualForm.nitrogen }),
      }
    }))
    setManualLog(prev => [{
      time: new Date().toLocaleTimeString(),
      plotNumber: manualForm.plotNumber,
      soilStatus: manualForm.soilStatus,
      changes: {
        ...(manualForm.moisture !== '' && { Moisture: `${manualForm.moisture}%` }),
        ...(manualForm.tempC    !== '' && { Temp: `${manualForm.tempC}°C` }),
        ...(manualForm.ph       !== '' && { pH: manualForm.ph }),
        ...(manualForm.nitrogen !== '' && { Nitrogen: `${manualForm.nitrogen} ppm` }),
      },
      note: manualForm.note
    }, ...prev].slice(0, 30))
    setMessage(`✅ Updated Plot ${manualForm.plotNumber} → ${manualForm.soilStatus}`)
    setManualForm({ plotNumber: '', soilStatus: 'moist', moisture: '', tempC: '', ph: '', nitrogen: '', note: '' })
  }

  const handleBulkUpdate = async () => {
    const zonePlots = plots.filter(p => p.zone === bulkZone)
    if (zonePlots.length === 0) { setMessage(`⚠️ No DB plots in ${bulkZone}`); return }
    await Promise.all(zonePlots.map(p => updateSoil(p._id, bulkStatus)))
    setMessage(`✅ Bulk updated ${zonePlots.length} plots in ${bulkZone} → ${bulkStatus}`)
  }

  const getSoilColor = (status) => {
    if (status === 'wet')   return { bg: 'rgba(96,165,250,0.18)',  border: 'rgba(96,165,250,0.4)',  color: '#60a5fa', emoji: '💧' }
    if (status === 'moist') return { bg: 'rgba(74,222,128,0.18)',  border: 'rgba(74,222,128,0.4)',  color: '#4ade80', emoji: '🌱' }
    return                        { bg: 'rgba(251,191,36,0.18)',   border: 'rgba(251,191,36,0.4)',  color: '#fbbf24', emoji: '🏜️' }
  }

  const getMoistureStatus = (pct) => pct >= 60 ? 'wet' : pct >= 30 ? 'moist' : 'dry'

  const getWateredAgo = (d) => {
    if (!d) return 'Never watered'
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000)
    const days = Math.floor(h / 24)
    if (days > 0) return `${days}d ago`
    if (h > 0)   return `${h}h ago`
    return 'Just now'
  }

  // Merge DB with template
  const merged = GRID_PLOTS.map(slot => {
    const db = plots.find(p => p.plotNumber === slot.plotNumber)
    return db ? { ...slot, ...db } : slot
  })

  const filtered = merged.filter(p => {
    if (filterZone !== 'all' && p.zone !== filterZone) return false
    if (filterSoil !== 'all' && (p.soilStatus || 'dry') !== filterSoil) return false
    return true
  })

  const drySoilCount   = merged.filter(p => !p.soilStatus || p.soilStatus === 'dry').length
  const moistSoilCount = merged.filter(p => p.soilStatus === 'moist').length
  const wetSoilCount   = merged.filter(p => p.soilStatus === 'wet').length
  const avgMoisture    = Math.round(Object.values(sensors).reduce((s, d) => s + d.moisture, 0) / Object.keys(sensors).length)
  const criticalPlots  = Object.entries(sensors).filter(([, d]) => d.moisture < 20).length

  return (
    <div className="wrapper">
      <Navbar />
      <div style={{ padding: '32px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '34px', marginBottom: '6px' }}>
              🪱 Soil <em style={{ color: 'var(--green)' }}>Status Tracker</em>
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '13px' }}>Real-time soil sensors + manual override for all 50 plots</p>
          </div>
          <div
            onClick={() => setLiveOn(!liveOn)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: liveOn ? '#4ade80' : 'var(--text2)', background: liveOn ? 'rgba(74,222,128,0.1)' : 'rgba(148,163,184,0.1)', border: `1px solid ${liveOn ? 'rgba(74,222,128,0.3)' : 'rgba(148,163,184,0.2)'}`, borderRadius: '8px', padding: '6px 14px', cursor: 'pointer' }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: liveOn ? '#4ade80' : '#94a3b8', display: 'inline-block', animation: liveOn ? 'pulse 1.5s infinite' : 'none' }} />
            {liveOn ? 'Live · 3s' : 'Paused'}
          </div>
        </div>

        {message && (
          <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '10px', padding: '10px 16px', marginBottom: '18px', fontSize: '13px', color: '#4ade80', display: 'flex', justifyContent: 'space-between' }}>
            {message}
            <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* Stats row */}
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '24px' }}>
          {[
            { icon: '🏜️', val: drySoilCount,   label: 'Dry Plots',      col: 'var(--gold)', sub: 'Need watering!' },
            { icon: '🌱', val: moistSoilCount,  label: 'Moist Plots',    col: 'var(--green)', sub: 'Perfect' },
            { icon: '💧', val: wetSoilCount,    label: 'Wet Plots',      col: '#60a5fa', sub: 'Skip watering' },
            { icon: '📊', val: `${avgMoisture}%`, label: 'Avg Moisture', col: avgMoisture < 30 ? '#fbbf24' : '#4ade80', sub: 'sensor avg' },
            { icon: '🚨', val: criticalPlots,   label: 'Critical (<20%)', col: criticalPlots > 0 ? '#f87171' : '#4ade80', sub: criticalPlots > 0 ? 'Urgent!' : 'All good' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <span className="stat-icon">{s.icon}</span>
              <div className="stat-num" style={{ color: s.col }}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-change" style={{ color: s.col }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          {[
            { key: 'overview', label: '🗺️ Plot Overview' },
            { key: 'sensors',  label: '📡 Sensor Dashboard' },
            { key: 'manual',   label: '🛠️ Manual Override' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '8px 18px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', border: '1px solid',
              background: activeTab === tab.key ? 'rgba(74,222,128,0.12)' : 'transparent',
              borderColor: activeTab === tab.key ? 'var(--green)' : 'var(--border)',
              color: activeTab === tab.key ? 'var(--green)' : 'var(--text2)',
              fontWeight: activeTab === tab.key ? '600' : '300',
              transition: 'all 0.2s',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">🗺️ All Plots Soil Status ({filtered.length})</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={filterZone} onChange={e => setFilterZone(e.target.value)} style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '5px 10px', fontSize: '11px' }}>
                  <option value="all">All Zones</option>
                  {['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'].map(z => <option key={z} value={z}>{z}</option>)}
                </select>
                <select value={filterSoil} onChange={e => setFilterSoil(e.target.value)} style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '5px 10px', fontSize: '11px' }}>
                  <option value="all">All Statuses</option>
                  <option value="dry">🏜️ Dry</option>
                  <option value="moist">🌱 Moist</option>
                  <option value="wet">💧 Wet</option>
                </select>
                <button className="btn-ghost" style={{ fontSize: '11px', padding: '5px 12px' }} onClick={fetchPlots}>Refresh</button>
              </div>
            </div>

            {loading ? (
              <p style={{ color: 'var(--text2)', fontSize: '13px' }}>Loading plots...</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {filtered.map(plot => {
                  const sensorStatus = getMoistureStatus(sensors[plot.plotNumber]?.moisture || 0)
                  const displayStatus = plot._id ? (plot.soilStatus || 'dry') : sensorStatus
                  const soil = getSoilColor(displayStatus)
                  const sd   = sensors[plot.plotNumber] || {}
                  const isCritical = (sd.moisture || 0) < 20
                  return (
                    <div key={plot.plotNumber} style={{ padding: '14px', background: soil.bg, borderRadius: '12px', border: `1px solid ${isCritical ? 'rgba(239,68,68,0.5)' : soil.border}`, transition: 'all 0.3s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '14px', color: soil.color }}>Plot {plot.plotNumber}</span>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          {isCritical && <span style={{ fontSize: '9px', background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '1px 6px', borderRadius: '999px' }}>⚠️ DRY</span>}
                          <span style={{ fontSize: '16px' }}>{soil.emoji}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text2)', marginBottom: '2px' }}>{plot.zone}</div>
                      {plot.occupant && <div style={{ fontSize: '10px', color: 'var(--text2)', marginBottom: '2px' }}>👤 {plot.occupant}</div>}

                      {/* Live sensor row */}
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '1px 6px', borderRadius: '4px' }}>💧 {sd.moisture}%</span>
                        <span style={{ fontSize: '10px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', padding: '1px 6px', borderRadius: '4px' }}>🌡️ {sd.tempC}°C</span>
                        <span style={{ fontSize: '10px', background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '1px 6px', borderRadius: '4px' }}>⚗️ {sd.ph}</span>
                      </div>

                      {/* Moisture bar */}
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${sd.moisture || 0}%`, background: isCritical ? 'linear-gradient(90deg,#ef4444,#f87171)' : `linear-gradient(90deg,${soil.color},${soil.color}88)`, borderRadius: '999px', transition: 'width 1s ease' }} />
                        </div>
                      </div>

                      <div style={{ fontSize: '10px', color: 'var(--text2)', marginBottom: '8px' }}>⏰ {getWateredAgo(plot.lastWatered)}</div>

                      {/* Quick update buttons — only for DB plots */}
                      {plot._id ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {SOIL_STATES.map(st => {
                            const c = getSoilColor(st)
                            return (
                              <button key={st} onClick={() => updateSoil(plot._id, st)} style={{ flex: 1, padding: '4px 2px', borderRadius: '5px', fontSize: '9px', cursor: 'pointer', border: 'none', background: displayStatus === st ? c.bg : 'rgba(255,255,255,0.04)', color: c.color, fontWeight: displayStatus === st ? '600' : '300', transition: 'all 0.15s' }}>
                                {c.emoji} {st}
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <div style={{ fontSize: '9px', color: 'var(--text2)', fontStyle: 'italic', textAlign: 'center' }}>Sensor only · not in DB</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: SENSOR DASHBOARD ── */}
        {activeTab === 'sensors' && (
          <>
            {/* Zone summary heatmap */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="card-header">
                <div className="card-title">🗺️ Zone Sensor Summary</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: liveOn ? '#4ade80' : 'var(--text2)' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: liveOn ? '#4ade80' : '#94a3b8', display: 'inline-block', animation: liveOn ? 'pulse 1.5s infinite' : 'none' }} />
                  {liveOn ? 'Live · 3s' : 'Paused'}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                {['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'].map(zone => {
                  const zonePlotNums = GRID_PLOTS.filter(p => p.zone === zone).map(p => p.plotNumber)
                  const zoneSensors  = zonePlotNums.map(n => sensors[n]).filter(Boolean)
                  const avgM  = Math.round(zoneSensors.reduce((s, d) => s + d.moisture, 0) / (zoneSensors.length || 1))
                  const avgT  = +(zoneSensors.reduce((s, d) => s + d.tempC, 0)   / (zoneSensors.length || 1)).toFixed(1)
                  const avgPH = +(zoneSensors.reduce((s, d) => s + d.ph, 0)      / (zoneSensors.length || 1)).toFixed(1)
                  const crit  = zoneSensors.filter(d => d.moisture < 20).length
                  const mColor = avgM < 20 ? '#f87171' : avgM < 40 ? '#fbbf24' : '#4ade80'
                  return (
                    <div key={zone} style={{ background: 'var(--bg3)', border: `1px solid ${crit > 0 ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--green)', marginBottom: '8px' }}>{zone}</div>
                      {crit > 0 && <div style={{ fontSize: '9px', background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '2px 6px', borderRadius: '999px', marginBottom: '6px' }}>⚠️ {crit} critical</div>}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text2)' }}>💧 Moisture: <span style={{ color: mColor, fontWeight: '600' }}>{avgM}%</span></div>
                        <div style={{ fontSize: '10px', color: 'var(--text2)' }}>🌡️ Temp: <span style={{ color: 'var(--text)' }}>{avgT}°C</span></div>
                        <div style={{ fontSize: '10px', color: 'var(--text2)' }}>⚗️ pH: <span style={{ color: 'var(--text)' }}>{avgPH}</span></div>
                      </div>
                      <div style={{ marginTop: '8px', height: '5px', background: 'rgba(74,222,128,0.15)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${avgM}%`, background: `linear-gradient(90deg,${mColor}88,${mColor})`, borderRadius: '999px', transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Per-plot sensor cards (show only plots with notable readings first) */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">📡 Per-Plot Sensor Readings (50 plots)</div>
                <span style={{ fontSize: '11px', color: 'var(--text2)' }}>Sorted: critical first</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {[...GRID_PLOTS]
                  .sort((a, b) => (sensors[a.plotNumber]?.moisture || 0) - (sensors[b.plotNumber]?.moisture || 0))
                  .map(plot => {
                    const sd      = sensors[plot.plotNumber] || {}
                    const status  = getMoistureStatus(sd.moisture || 0)
                    const soil    = getSoilColor(status)
                    const crit    = (sd.moisture || 0) < 20
                    const phAlert = sd.ph < 5.5 || sd.ph > 7.5
                    return (
                      <div key={plot.plotNumber} style={{ background: crit ? 'rgba(239,68,68,0.07)' : 'var(--bg3)', border: `1px solid ${crit ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`, borderRadius: '12px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: soil.color }}>{plot.plotNumber}</span>
                          <span style={{ fontSize: '13px' }}>{soil.emoji}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {[
                            { label: '💧', val: `${sd.moisture}%`, col: crit ? '#f87171' : '#38bdf8' },
                            { label: '🌡️', val: `${sd.tempC}°C`,   col: 'var(--text)' },
                            { label: '⚗️', val: sd.ph,             col: phAlert ? '#fbbf24' : 'var(--text)' },
                            { label: '🌿', val: `${sd.nitrogen}ppm`, col: 'var(--text2)' },
                            { label: '⚡', val: `${sd.conductivity}`, col: 'var(--text2)' },
                          ].map((row, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                              <span style={{ color: 'var(--text2)' }}>{row.label}</span>
                              <span style={{ color: row.col, fontWeight: '600' }}>{row.val}</span>
                            </div>
                          ))}
                        </div>
                        {/* Moisture mini bar */}
                        <div style={{ marginTop: '8px', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${sd.moisture}%`, background: crit ? '#ef4444' : soil.color, borderRadius: '999px', transition: 'width 1s ease' }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </>
        )}

        {/* ── TAB: MANUAL OVERRIDE ── */}
        {activeTab === 'manual' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Per-plot override */}
              <div className="card" style={{ border: '1px solid rgba(251,191,36,0.3)' }}>
                <div className="card-header">
                  <div className="card-title" style={{ color: '#fbbf24' }}>🛠️ Plot Manual Override</div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '14px', lineHeight: 1.6 }}>
                  Update soil status and sensor readings for a specific plot. Soil status changes are saved to the database.
                </p>
                <form onSubmit={handleManualSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label>Plot Number *</label>
                      <select value={manualForm.plotNumber} onChange={e => setManualForm({...manualForm, plotNumber: e.target.value})} required style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', width: '100%' }}>
                        <option value="">— select plot —</option>
                        {GRID_PLOTS.map(p => <option key={p.plotNumber} value={p.plotNumber}>{p.plotNumber} ({p.zone})</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Soil Status *</label>
                      <select value={manualForm.soilStatus} onChange={e => setManualForm({...manualForm, soilStatus: e.target.value})} style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', width: '100%' }}>
                        <option value="dry">🏜️ Dry</option>
                        <option value="moist">🌱 Moist</option>
                        <option value="wet">💧 Wet</option>
                      </select>
                    </div>
                    {[
                      { label: 'Moisture (%)',   key: 'moisture',  placeholder: '0–100', step: '1',   min: '0',   max: '100' },
                      { label: 'Soil Temp (°C)', key: 'tempC',     placeholder: '10–40', step: '0.1', min: '0',   max: '60' },
                      { label: 'pH',             key: 'ph',        placeholder: '4–9',   step: '0.1', min: '0',   max: '14' },
                      { label: 'Nitrogen (ppm)', key: 'nitrogen',  placeholder: '0–150', step: '1',   min: '0',   max: '200' },
                    ].map(f => (
                      <div key={f.key} className="form-group" style={{ marginBottom: 0 }}>
                        <label>{f.label}</label>
                        <input type="number" step={f.step} min={f.min} max={f.max} value={manualForm[f.key]} onChange={e => setManualForm({...manualForm, [f.key]: e.target.value})} placeholder={f.placeholder} />
                      </div>
                    ))}
                    <div className="form-group" style={{ gridColumn: '1/-1', marginBottom: 0 }}>
                      <label>Note / Reason</label>
                      <input value={manualForm.note} onChange={e => setManualForm({...manualForm, note: e.target.value})} placeholder="e.g. Manual inspection after rain" />
                    </div>
                  </div>
                  <button type="submit" style={{ width: '100%', marginTop: '14px', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.35)', padding: '10px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    🛠️ Apply Override
                  </button>
                </form>
              </div>

              {/* Bulk zone update */}
              <div className="card" style={{ border: '1px solid rgba(96,165,250,0.3)' }}>
                <div className="card-header">
                  <div className="card-title" style={{ color: '#60a5fa' }}>⚡ Bulk Zone Update</div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '14px' }}>
                  Update all plots in a zone at once — saves to database.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Zone</label>
                    <select value={bulkZone} onChange={e => setBulkZone(e.target.value)} style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', width: '100%' }}>
                      {['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'].map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Soil Status</label>
                    <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', width: '100%' }}>
                      <option value="dry">🏜️ Dry</option>
                      <option value="moist">🌱 Moist</option>
                      <option value="wet">💧 Wet</option>
                    </select>
                  </div>
                </div>
                <button onClick={handleBulkUpdate} style={{ width: '100%', background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', padding: '10px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  ⚡ Apply to All {bulkZone} Plots
                </button>
              </div>
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
                  No overrides yet. Use the form to make changes.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '600px', overflowY: 'auto' }}>
                  {manualLog.map((entry, i) => {
                    const soil = getSoilColor(entry.soilStatus)
                    return (
                      <div key={i} style={{ background: 'var(--bg3)', border: `1px solid ${soil.border}`, borderRadius: '10px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: soil.color }}>{soil.emoji} Plot {entry.plotNumber}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text2)' }}>{entry.time}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#4ade80', marginBottom: '4px' }}>Status → {entry.soilStatus}</div>
                        {Object.entries(entry.changes).map(([k, v]) => (
                          <div key={k} style={{ fontSize: '11px', color: 'var(--text2)' }}>✏️ {k}: <span style={{ color: 'var(--text)' }}>{v}</span></div>
                        ))}
                        {entry.note && <div style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '4px', fontStyle: 'italic' }}>📝 {entry.note}</div>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Soil tips */}
        {activeTab === 'overview' && (
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header">
              <div className="card-title">💡 Soil Care Tips for Chennai</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { emoji: '🏜️', title: 'Dry Soil',   tip: 'Water immediately in early morning. Add mulch to retain moisture. Check daily during summer.',            color: 'var(--gold)' },
                { emoji: '🌱', title: 'Moist Soil',  tip: 'Perfect condition! Maintain by watering every 2 days. Great for most Chennai crops.',                      color: 'var(--green)' },
                { emoji: '💧', title: 'Wet Soil',    tip: 'Skip watering today. Ensure good drainage to prevent root rot. Watch for fungal diseases.',               color: '#60a5fa' },
              ].map((tip, i) => (
                <div key={i} style={{ padding: '16px', background: 'var(--bg3)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{tip.emoji}</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: tip.color, marginBottom: '8px' }}>{tip.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.6' }}>{tip.tip}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Soil