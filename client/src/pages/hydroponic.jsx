import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import axios from 'axios'
import API_BASE from '../api'

const SYSTEMS = ['DWC', 'NFT', 'Vertical Tower', 'Ebb & Flow', 'Aeroponics', 'Wick']
const STATUSES = ['active', 'idle', 'maintenance', 'harvesting']
const CROPS_LIST = ['Lettuce', 'Basil', 'Spinach', 'Kale', 'Tomato', 'Mint', 'Cilantro', 'Arugula', 'Chard', 'Cucumber', 'Peppers', 'Strawberry']

const SYSTEM_EMOJI = { 'DWC': '💧', 'NFT': '🌊', 'Vertical Tower': '🗼', 'Ebb & Flow': '🔄', 'Aeroponics': '💨', 'Wick': '🕯️' }
const STATUS_LABEL = { active: '🟢 Active', idle: '⚪ Idle', maintenance: '🟡 Maintenance', harvesting: '🌿 Harvesting' }

const FACTS = [
  { icon: '💧', title: '90% Less Water', body: 'Hydroponic systems recirculate nutrient-rich water, using up to 90% less water than traditional soil farming — perfect for sustainable urban gardens.' },
  { icon: '⚡', title: '3× Faster Growth', body: 'Plants receive nutrients directly at their roots, eliminating soil search effort. This results in growth rates 3× faster than conventional farming.' },
  { icon: '🏙️', title: 'Urban Space Efficiency', body: 'Vertical towers and compact DWC setups allow high-density cultivation in small footprints — ideal for rooftops, balconies, and unused lots.' },
  { icon: '🌡️', title: 'Year-Round Harvest', body: 'Controlled light, temperature, and nutrients enable 365-day crop production regardless of external season or weather conditions.' },
  { icon: '🚫', title: 'Pesticide-Free Produce', body: 'Closed, controlled environments significantly reduce pest pressure — yielding cleaner, pesticide-free produce that boosts community health.' },
  { icon: '📚', title: 'Educational Hub', body: 'Each hydroponic unit doubles as a learning station, teaching nutrient science, plumbing, automation, and sustainable food systems to volunteers.' },
]

// Generate 10 local plot slots in a single hydro zone
const HYDRO_ZONES = ['H1']
const LOCAL_PLOTS = HYDRO_ZONES.flatMap(zone =>
  Array.from({ length: 10 }, (_, i) => ({
    plotNumber: `${zone}-P${i + 1}`,
    zone: `Zone ${zone}`,
    status: 'idle',
    system: 'DWC',
    crop: '',
    nutrientLevel: 100,
    phLevel: 6.5,
    waterTempC: 22,
    dailyYieldGrams: 0,
    lightsOn: true,
    _id: null,
  }))
)

// 10 plant options with growth data
const PLANT_CATALOG = [
  { name: 'Lettuce',  emoji: '🥬', daysToHarvest: 21, waterLDay: 1.5, tempMin: 18, tempMax: 22, ph: 6.0, ec: 1.2, color: '#4ade80',  tip: 'Thrives in cool temps. Harvest outer leaves first.' },
  { name: 'Basil',    emoji: '🌿', daysToHarvest: 28, waterLDay: 1.2, tempMin: 20, tempMax: 25, ph: 6.2, ec: 1.6, color: '#86efac',  tip: 'Pinch flowers to extend leafy growth season.' },
  { name: 'Spinach',  emoji: '🍃', daysToHarvest: 35, waterLDay: 1.3, tempMin: 15, tempMax: 20, ph: 6.5, ec: 1.8, color: '#22c55e',  tip: 'Prefers cooler water — keep reservoir at 18°C.' },
  { name: 'Kale',     emoji: '🥦', daysToHarvest: 40, waterLDay: 1.8, tempMin: 15, tempMax: 20, ph: 6.0, ec: 2.0, color: '#16a34a',  tip: 'Cold-tolerant. Frost improves sweetness.' },
  { name: 'Tomato',   emoji: '🍅', daysToHarvest: 75, waterLDay: 2.5, tempMin: 22, tempMax: 26, ph: 6.3, ec: 3.0, color: '#ef4444',  tip: 'Needs support staking and pollination shaking.' },
  { name: 'Mint',     emoji: '🌱', daysToHarvest: 35, waterLDay: 1.0, tempMin: 18, tempMax: 22, ph: 6.5, ec: 1.5, color: '#34d399',  tip: 'Fast spreader — keep trimmed to stay bushy.' },
  { name: 'Cilantro', emoji: '🌾', daysToHarvest: 25, waterLDay: 1.1, tempMin: 17, tempMax: 22, ph: 6.5, ec: 1.3, color: '#a3e635',  tip: 'Bolts in heat — keep under 22°C for best yield.' },
  { name: 'Arugula',  emoji: '🥗', daysToHarvest: 22, waterLDay: 1.2, tempMin: 16, tempMax: 20, ph: 6.0, ec: 1.4, color: '#bef264',  tip: 'Quickest harvest. Cut-and-come-again method works great.' },
  { name: 'Chard',    emoji: '🌸', daysToHarvest: 45, waterLDay: 1.6, tempMin: 15, tempMax: 20, ph: 6.5, ec: 1.8, color: '#f472b6',  tip: 'Colourful stems — harvest when 15–20 cm tall.' },
  { name: 'Cucumber', emoji: '🥒', daysToHarvest: 60, waterLDay: 2.0, tempMin: 22, tempMax: 28, ph: 6.2, ec: 2.5, color: '#38bdf8',  tip: 'Needs warm roots. Keep water temp above 20°C.' },
]

const initLiveStats = () => {
  const s = {}
  LOCAL_PLOTS.forEach(p => {
    s[p.plotNumber] = {
      temp: +(21 + Math.random() * 5).toFixed(1),
      waterUsedL: +(0.8 + Math.random() * 1.2).toFixed(2),
      humidity: Math.floor(60 + Math.random() * 25),
      ec: +(1.2 + Math.random() * 1.5).toFixed(1),
      ph: +(5.8 + Math.random() * 1.2).toFixed(1),
      daysGrown: Math.floor(Math.random() * 20),
    }
  })
  return s
}

function HydroponicFarming() {
  const [plots, setPlots] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterZone, setFilterZone] = useState('all')
  const [form, setForm] = useState({
    plotNumber: '', zone: 'Zone H1', system: 'DWC', crop: 'Lettuce',
    occupant: '', status: 'idle', nutrientLevel: 100, phLevel: 6.5,
    waterTempC: 22, dailyYieldGrams: 0, lightsOn: true, notes: ''
  })
  const [yieldInput, setYieldInput] = useState('')
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'manage' | 'plant' | 'learn'
  const [selectedCrop, setSelectedCrop] = useState(null)   // name of crop chosen in catalog
  const [plantedPlots, setPlantedPlots] = useState({})     // { plotNumber: cropName }
  const [liveStats, setLiveStats] = useState(initLiveStats)
  const liveRef = useRef(null)

  useEffect(() => { fetchPlots() }, [])

  // Real-time sensor simulation — updates every 3 seconds
  useEffect(() => {
    liveRef.current = setInterval(() => {
      setLiveStats(prev => {
        const next = { ...prev }
        LOCAL_PLOTS.forEach(p => {
          const old = prev[p.plotNumber]
          next[p.plotNumber] = {
            temp:       +Math.max(15, Math.min(32, old.temp + (Math.random() - 0.5) * 0.4)).toFixed(1),
            waterUsedL: +Math.max(0.3, Math.min(3.0, old.waterUsedL + (Math.random() - 0.48) * 0.06)).toFixed(2),
            humidity:   Math.max(40, Math.min(95, old.humidity + Math.round((Math.random() - 0.5) * 3))),
            ec:         +Math.max(0.5, Math.min(4.0, old.ec + (Math.random() - 0.5) * 0.08)).toFixed(1),
            ph:         +Math.max(4.5, Math.min(8.0, old.ph + (Math.random() - 0.5) * 0.05)).toFixed(1),
            daysGrown:  old.daysGrown,
          }
        })
        return next
      })
    }, 3000)
    return () => clearInterval(liveRef.current)
  }, [])

  const fetchPlots = () => {
    axios.get(`${API_BASE}/api/hydroponics`)
      .then(res => setPlots(res.data))
      .catch(() => {})
  }

  // Seed 60 plots on server if none exist
  const handleSeed = async () => {
    try {
      const res = await axios.post(`${API_BASE}/api/hydroponics/seed`)
      setMessage(`✅ ${res.data.message}`)
      fetchPlots()
    } catch { setMessage('Error seeding plots!') }
  }

  const handleAdd = async () => {
    try {
      await axios.post(`${API_BASE}/api/hydroponics`, { ...form })
      setMessage('Hydroponic plot added! 🌊')
      setShowForm(false)
      setForm({ plotNumber: '', zone: 'Zone H1', system: 'DWC', crop: 'Lettuce', occupant: '', status: 'idle', nutrientLevel: 100, phLevel: 6.5, waterTempC: 22, dailyYieldGrams: 0, lightsOn: true, notes: '' })
      fetchPlots()
    } catch (err) { setMessage('Error: ' + (err.response?.data?.message || 'Could not add plot')) }
  }

  const handleUpdate = async (id, data) => {
    try {
      await axios.put(`${API_BASE}/api/hydroponics/${id}`, data)
      fetchPlots()
      if (selected?._id === id) {
        setSelected(prev => ({ ...prev, ...data }))
      }
    } catch { setMessage('Update failed!') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this hydroponic plot?')) return
    await axios.delete(`${API_BASE}/api/hydroponics/${id}`)
    setSelected(null)
    fetchPlots()
  }

  const handleLogYield = async (id) => {
    if (!yieldInput) return
    await axios.put(`${API_BASE}/api/hydroponics/${id}/yield`, { grams: Number(yieldInput) })
    setYieldInput('')
    fetchPlots()
  }

  // Merge DB with local template (like Plots page does)
  const merged = LOCAL_PLOTS.map(slot => {
    const db = plots.find(p => p.plotNumber === slot.plotNumber)
    return db ? { ...slot, ...db } : slot
  })

  // Stats
  const active = merged.filter(p => p.status === 'active').length
  const harvesting = merged.filter(p => p.status === 'harvesting').length
  const maintenance = merged.filter(p => p.status === 'maintenance').length
  const totalYield = plots.reduce((s, p) => s + (p.dailyYieldGrams || 0), 0)

  // Filtered list view — always shows all 10 merged plots
  const filteredList = merged.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (filterZone !== 'all' && p.zone !== `Zone ${filterZone}`) return false
    return true
  })

  const getStatusClass = (s) => `hydro-status-${s}`
  const getNutrientClass = (n) => n > 60 ? '' : n > 30 ? 'warn' : 'danger'
  const getPhClass = (ph) => (ph >= 5.5 && ph <= 7.0) ? '' : ph >= 4 ? 'warn' : 'danger'

  return (
    <div className="wrapper">
      <Navbar />
      <div style={{ padding: '32px 0' }}>

        {/* HERO */}
        <div className="hydro-hero">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="hydro-hero-title">🌊 Hydroponic Farming</div>
            <p className="hydro-hero-sub">
              Soil-free, ultra-efficient crop cultivation right in your community garden.
              10 dedicated hydroponic plots in Zone H1 — growing year-round with
              up to 90% less water, 3× faster yields, and zero pesticides.
            </p>

            <div className="hydro-badge-row">
              <span className="hydro-badge">💧 90% Water Saved</span>
              <span className="hydro-badge">⚡ 3× Faster Growth</span>
              <span className="hydro-badge">🚫 Pesticide-Free</span>
              <span className="hydro-badge">📅 Year-Round Harvest</span>
              <span className="hydro-badge">🌿 10 Hydro Plots</span>
              <span className="hydro-badge">🔬 Zone H1</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn-hydro" onClick={() => setActiveTab('overview')}>📊 Overview</button>
              <button className="btn-hydro" onClick={() => setActiveTab('manage')}>🛠️ Manage Plots</button>
              <button className="btn-hydro" onClick={() => setActiveTab('plant')}>🌿 Plant & Monitor</button>
              <button className="btn-hydro" onClick={() => setActiveTab('learn')}>📚 Learn Hydroponics</button>
              {plots.length < 10 && (
                <button
                  onClick={handleSeed}
                  style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', color: 'var(--hydro-blue)', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}
                >
                  🌱 Seed 10 Demo Plots
                </button>
              )}
            </div>
          </div>
        </div>

        {message && (
          <div style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '10px', padding: '10px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--hydro-blue)' }}>
            {message}
            <button onClick={() => setMessage('')} style={{ float: 'right', background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* STATS */}
        <div className="hydro-stats-row">
          <div className="hydro-stat-card">
            <span className="hydro-stat-icon">🌊</span>
            <div className="hydro-stat-num">{merged.length}</div>
            <div className="hydro-stat-label">Total Hydro Plots</div>
          </div>
          <div className="hydro-stat-card">
            <span className="hydro-stat-icon">🟢</span>
            <div className="hydro-stat-num">{active}</div>
            <div className="hydro-stat-label">Active Growing</div>
          </div>
          <div className="hydro-stat-card">
            <span className="hydro-stat-icon">🌿</span>
            <div className="hydro-stat-num">{harvesting}</div>
            <div className="hydro-stat-label">Ready to Harvest</div>
          </div>
          <div className="hydro-stat-card">
            <span className="hydro-stat-icon">⚖️</span>
            <div className="hydro-stat-num">{totalYield > 0 ? `${(totalYield / 1000).toFixed(1)}kg` : '—'}</div>
            <div className="hydro-stat-label">Today's Yield</div>
          </div>
        </div>

        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            {/* Visual plot grid */}
            <div className="card" style={{ borderColor: 'var(--hydro-border)', marginBottom: '24px' }}>
              <div className="card-header">
                <div className="card-title" style={{ color: 'var(--hydro-blue)' }}>
                  <span className="card-title-icon">🌊</span> 10-Plot Hydroponic Grid
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text2)' }}>Click any plot to inspect</span>
              </div>

              {/* Zone rows */}
              {HYDRO_ZONES.map(zone => (
                <div key={zone} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--hydro-blue)', marginBottom: '5px', opacity: 0.7 }}>
                    Zone {zone} — {SYSTEM_EMOJI[merged.find(p => p.zone === `Zone ${zone}`)?.system || 'DWC']} {merged.find(p => p.zone === `Zone ${zone}`)?.system || 'DWC'}
                  </div>
                  <div className="hydro-grid">
                    {merged.filter(p => p.zone === `Zone ${zone}`).map(plot => (
                      <div
                        key={plot.plotNumber}
                        className={`hydro-plot-cell ${plot.status}`}
                        title={`${plot.plotNumber} — ${plot.crop || 'No crop'} (${plot.status})`}
                        onClick={() => setSelected(plot._id ? plot : null)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--hydro-border)' }}>
                {[
                  { label: 'Active', cls: 'active', bg: 'rgba(56,189,248,0.22)', border: 'var(--hydro-blue)' },
                  { label: 'Harvesting', cls: 'harvesting', bg: 'rgba(74,222,128,0.2)', border: 'rgba(74,222,128,0.45)' },
                  { label: 'Maintenance', cls: 'maintenance', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)' },
                  { label: 'Idle', cls: 'idle', bg: 'rgba(56,189,248,0.05)', border: 'rgba(56,189,248,0.12)' },
                ].map(l => (
                  <div key={l.cls} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text2)' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: l.bg, border: `1px solid ${l.border}` }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Zone breakdown card */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>
              {HYDRO_ZONES.map(zone => {
                const zonePlots = merged.filter(p => p.zone === `Zone ${zone}`)
                const activeCount = zonePlots.filter(p => p.status === 'active').length
                const harvestCount = zonePlots.filter(p => p.status === 'harvesting').length
                const system = zonePlots[0]?.system || 'DWC'
                return (
                  <div key={zone} className="card" style={{ borderColor: 'var(--hydro-border)', background: 'var(--hydro-bg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--hydro-blue)' }}>Zone {zone}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{SYSTEM_EMOJI[system]} {system}</div>
                      </div>
                      <span style={{ fontSize: '20px' }}>{SYSTEM_EMOJI[system]}</span>
                    </div>
                    <div className="hydro-metrics-row">
                      <div className="hydro-metric-box">
                        <div className="hydro-metric-val">{zonePlots.length}</div>
                        <div className="hydro-metric-lbl">Plots</div>
                      </div>
                      <div className="hydro-metric-box">
                        <div className="hydro-metric-val">{activeCount}</div>
                        <div className="hydro-metric-lbl">Active</div>
                      </div>
                      <div className="hydro-metric-box">
                        <div className="hydro-metric-val" style={{ color: '#4ade80' }}>{harvestCount}</div>
                        <div className="hydro-metric-lbl">Ready</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* TAB: MANAGE */}
        {activeTab === 'manage' && (
          <>
            {/* Add form */}
            <div className="card" style={{ borderColor: 'var(--hydro-border)', marginBottom: '20px' }}>
              <div className="card-header">
                <div className="card-title" style={{ color: 'var(--hydro-blue)' }}>➕ Register Hydroponic Plot</div>
                <button onClick={() => setShowForm(!showForm)} className="hydro-toggle-btn">
                  {showForm ? 'Close ▲' : 'Open ▼'}
                </button>
              </div>

              {showForm && (
                <div>
                  <div className="hydro-form-grid" style={{ marginBottom: '14px' }}>
                    <div className="form-group">
                      <label>Plot Number</label>
                      <input value={form.plotNumber} onChange={e => setForm({ ...form, plotNumber: e.target.value })} placeholder="e.g. H1-P11" />
                    </div>
                    <div className="form-group">
                      <label>Zone</label>
                      <select value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', width: '100%' }}>
                        {HYDRO_ZONES.map(z => <option key={z} value={`Zone ${z}`}>Zone {z}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>System Type</label>
                      <select value={form.system} onChange={e => setForm({ ...form, system: e.target.value })} style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', width: '100%' }}>
                        {SYSTEMS.map(s => <option key={s} value={s}>{SYSTEM_EMOJI[s]} {s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Crop</label>
                      <select value={form.crop} onChange={e => setForm({ ...form, crop: e.target.value })} style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', width: '100%' }}>
                        {CROPS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Occupant / Gardener</label>
                      <input value={form.occupant} onChange={e => setForm({ ...form, occupant: e.target.value })} placeholder="e.g. Arjun Kumar" />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', width: '100%' }}>
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Nutrient Level (%)</label>
                      <input type="number" min="0" max="100" value={form.nutrientLevel} onChange={e => setForm({ ...form, nutrientLevel: Number(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>pH Level (5.5–7.0 ideal)</label>
                      <input type="number" step="0.1" min="0" max="14" value={form.phLevel} onChange={e => setForm({ ...form, phLevel: Number(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>Water Temp (°C)</label>
                      <input type="number" value={form.waterTempC} onChange={e => setForm({ ...form, waterTempC: Number(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>Notes</label>
                      <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." />
                    </div>
                  </div>
                  <button className="btn-hydro" onClick={handleAdd}>🌊 Add Hydroponic Plot</button>
                </div>
              )}
            </div>

            {/* Filter row */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Filter:</span>
              {['all', ...STATUSES].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  style={{
                    padding: '5px 14px', borderRadius: '999px', fontSize: '11px', cursor: 'pointer', border: '1px solid',
                    background: filterStatus === s ? 'rgba(56,189,248,0.2)' : 'transparent',
                    borderColor: filterStatus === s ? 'var(--hydro-blue)' : 'var(--hydro-border)',
                    color: filterStatus === s ? 'var(--hydro-blue)' : 'var(--text2)',
                  }}
                >
                  {s === 'all' ? 'All' : STATUS_LABEL[s]}
                </button>
              ))}
              <div style={{ marginLeft: 'auto' }}>
                <select value={filterZone} onChange={e => setFilterZone(e.target.value)} style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--hydro-border)', borderRadius: '8px', padding: '5px 10px', fontSize: '11px' }}>
                  <option value="all">All Zones</option>
                  {HYDRO_ZONES.map(z => <option key={z} value={z}>Zone {z}</option>)}
                </select>
              </div>
            </div>

            {/* Plots list */}
            <div className="card" style={{ borderColor: 'var(--hydro-border)' }}>
              <div className="card-header">
                <div className="card-title" style={{ color: 'var(--hydro-blue)' }}>🌊 Hydroponic Plots ({filteredList.length})</div>
              </div>

              {filteredList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌱</div>
                  <p>No plots found. Add your first or seed 10 demo plots.</p>
                  <button className="btn-hydro" style={{ marginTop: '16px' }} onClick={handleSeed}>🌱 Seed 10 Demo Plots</button>
                </div>
              ) : (
                filteredList.map(p => (
                  <div key={p.plotNumber} className="hydro-plot-item">
                    <div className="hydro-plot-avatar">{SYSTEM_EMOJI[p.system] || '💧'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>{p.plotNumber}</span>
                        <span className={`hydro-system-badge ${getStatusClass(p.status)}`}>{STATUS_LABEL[p.status]}</span>
                        <span className="hydro-system-badge">{p.system}</span>
                        {!p._id && <span style={{ fontSize: '10px', color: 'var(--text2)', fontStyle: 'italic' }}>Unregistered</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
                        {p.crop ? `🌿 ${p.crop}` : 'No crop'} · {p.zone}
                        {p.occupant ? ` · 👤 ${p.occupant}` : ''}
                      </div>
                      {/* Nutrient bar */}
                      <div style={{ marginTop: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text2)', marginBottom: '2px' }}>
                          <span>Nutrients</span><span>{p.nutrientLevel}%</span>
                        </div>
                        <div className="hydro-bar-track">
                          <div className={`hydro-bar-fill ${getNutrientClass(p.nutrientLevel)}`} style={{ width: `${p.nutrientLevel}%` }} />
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text2)' }}>pH {p.phLevel} · {p.waterTempC}°C</div>
                      {p.dailyYieldGrams > 0 && (
                        <div style={{ fontSize: '11px', color: '#4ade80' }}>⚖️ {p.dailyYieldGrams}g today</div>
                      )}
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {p._id ? (
                          <>
                            <button
                              onClick={() => handleUpdate(p._id, { status: p.status === 'active' ? 'idle' : 'active' })}
                              style={{ background: 'rgba(56,189,248,0.12)', color: 'var(--hydro-blue)', border: 'none', padding: '3px 9px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer' }}
                            >
                              {p.status === 'active' ? 'Pause' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleUpdate(p._id, { status: 'harvesting' })}
                              style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: 'none', padding: '3px 9px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer' }}
                            >
                              Harvest
                            </button>
                            <button
                              onClick={() => handleDelete(p._id)}
                              style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'none', padding: '3px 9px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer' }}
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '10px', color: 'var(--text2)', padding: '3px 9px', borderRadius: '6px', background: 'rgba(56,189,248,0.06)', border: '1px dashed rgba(56,189,248,0.2)' }}>
                            Use "Register Plot" to activate
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* TAB: PLANT & MONITOR */}
        {activeTab === 'plant' && (
          <>
            {/* --- Plant Catalog --- */}
            <div className="card" style={{ borderColor: 'var(--hydro-border)', marginBottom: '24px' }}>
              <div className="card-header">
                <div className="card-title" style={{ color: 'var(--hydro-blue)' }}>
                  <span className="card-title-icon">🌱</span> Choose a Plant to Grow
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text2)' }}>
                  {selectedCrop ? `Selected: ${selectedCrop} — click a plot below to plant` : 'Select a crop, then click a plot slot'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                {PLANT_CATALOG.map(plant => {
                  const isSelected = selectedCrop === plant.name
                  return (
                    <div
                      key={plant.name}
                      onClick={() => setSelectedCrop(isSelected ? null : plant.name)}
                      style={{
                        background: isSelected ? `${plant.color}22` : 'var(--hydro-bg)',
                        border: `2px solid ${isSelected ? plant.color : 'var(--hydro-border)'}`,
                        borderRadius: '14px', padding: '14px 10px', cursor: 'pointer',
                        transition: 'all 0.2s', textAlign: 'center',
                        boxShadow: isSelected ? `0 0 16px ${plant.color}33` : 'none',
                        transform: isSelected ? 'translateY(-3px)' : 'none',
                      }}
                    >
                      <div style={{ fontSize: '28px', marginBottom: '6px' }}>{plant.emoji}</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: isSelected ? plant.color : 'var(--text)', marginBottom: '4px' }}>{plant.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text2)', marginBottom: '6px' }}>🗓️ {plant.daysToHarvest}d harvest</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '10px', color: 'var(--text2)' }}>
                        <span>💧 {plant.waterLDay}L/day</span>
                        <span>🌡️ {plant.tempMin}–{plant.tempMax}°C</span>
                        <span>⚗️ pH {plant.ph}</span>
                      </div>
                      {isSelected && (
                        <div style={{ marginTop: '8px', fontSize: '9px', color: plant.color, lineHeight: 1.4, fontStyle: 'italic' }}>
                          {plant.tip}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* --- Live Plot Monitor --- */}
            <div className="card" style={{ borderColor: 'var(--hydro-border)' }}>
              <div className="card-header">
                <div className="card-title" style={{ color: 'var(--hydro-blue)' }}>
                  <span className="card-title-icon">📡</span> Live Plot Sensor Monitor
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#4ade80' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                  Live · updates every 3s
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                {LOCAL_PLOTS.map(slot => {
                  const live = liveStats[slot.plotNumber] || {}
                  const dbPlot = plots.find(p => p.plotNumber === slot.plotNumber)
                  const cropName = plantedPlots[slot.plotNumber] || dbPlot?.crop || null
                  const plant = PLANT_CATALOG.find(p => p.name === cropName)
                  const daysLeft = plant ? Math.max(0, plant.daysToHarvest - (live.daysGrown || 0)) : null
                  const harvestSoon = daysLeft !== null && daysLeft <= 5
                  const tempOk = plant ? (live.temp >= plant.tempMin && live.temp <= plant.tempMax) : true
                  const phOk = plant ? (live.ph >= plant.ph - 0.5 && live.ph <= plant.ph + 0.5) : true

                  return (
                    <div
                      key={slot.plotNumber}
                      onClick={() => {
                        if (selectedCrop && !cropName) {
                          setPlantedPlots(prev => ({ ...prev, [slot.plotNumber]: selectedCrop }))
                          setSelectedCrop(null)
                        }
                      }}
                      style={{
                        background: cropName ? 'var(--hydro-bg)' : selectedCrop ? 'rgba(56,189,248,0.04)' : 'var(--hydro-bg)',
                        border: `1px solid ${harvestSoon ? 'rgba(74,222,128,0.5)' : !tempOk ? 'rgba(251,191,36,0.4)' : 'var(--hydro-border)'}`,
                        borderRadius: '16px', padding: '16px',
                        cursor: selectedCrop && !cropName ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        outline: selectedCrop && !cropName ? '2px dashed rgba(56,189,248,0.4)' : 'none',
                      }}
                    >
                      {/* Plot header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--hydro-blue)' }}>{slot.plotNumber}</div>
                          {cropName ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                              <span style={{ fontSize: '16px' }}>{plant?.emoji || '🌱'}</span>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: plant?.color || 'var(--text)' }}>{cropName}</span>
                            </div>
                          ) : (
                            <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px', fontStyle: 'italic' }}>
                              {selectedCrop ? '👆 Click to plant here' : 'Empty — no crop planted'}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {harvestSoon && (
                            <div style={{ fontSize: '10px', background: 'rgba(74,222,128,0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: '999px', marginBottom: '4px' }}>
                              🌾 Harvest soon!
                            </div>
                          )}
                          {!tempOk && cropName && (
                            <div style={{ fontSize: '10px', background: 'rgba(251,191,36,0.12)', color: '#fbbf24', padding: '2px 8px', borderRadius: '999px', marginBottom: '4px' }}>
                              ⚠️ Temp alert
                            </div>
                          )}
                          {cropName && (
                            <button
                              onClick={e => { e.stopPropagation(); setPlantedPlots(prev => { const n = {...prev}; delete n[slot.plotNumber]; return n }) }}
                              style={{ fontSize: '9px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none', padding: '2px 7px', borderRadius: '5px', cursor: 'pointer' }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Live sensor readings */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: cropName && daysLeft !== null ? '10px' : '0' }}>
                        {/* Temperature */}
                        <div style={{ background: 'rgba(56,189,248,0.07)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '3px' }}>🌡️ Temp</div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: tempOk ? 'var(--hydro-blue)' : '#fbbf24' }}>
                            {live.temp}°C
                          </div>
                          {plant && <div style={{ fontSize: '9px', color: 'var(--text2)' }}>ideal {plant.tempMin}–{plant.tempMax}</div>}
                        </div>

                        {/* Water needed */}
                        <div style={{ background: 'rgba(56,189,248,0.07)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '3px' }}>💧 Water</div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--hydro-blue)' }}>
                            {live.waterUsedL}L
                          </div>
                          {plant && <div style={{ fontSize: '9px', color: 'var(--text2)' }}>need {plant.waterLDay}L/d</div>}
                        </div>

                        {/* pH */}
                        <div style={{ background: 'rgba(56,189,248,0.07)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '3px' }}>⚗️ pH</div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: phOk ? 'var(--hydro-blue)' : '#fbbf24' }}>
                            {live.ph}
                          </div>
                          {plant && <div style={{ fontSize: '9px', color: 'var(--text2)' }}>ideal {plant.ph}</div>}
                        </div>

                        {/* Humidity */}
                        <div style={{ background: 'rgba(56,189,248,0.07)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '3px' }}>💦 Humidity</div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--hydro-blue)' }}>
                            {live.humidity}%
                          </div>
                        </div>

                        {/* EC */}
                        <div style={{ background: 'rgba(56,189,248,0.07)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '3px' }}>⚡ EC</div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--hydro-blue)' }}>
                            {live.ec}
                          </div>
                          {plant && <div style={{ fontSize: '9px', color: 'var(--text2)' }}>need {plant.ec}</div>}
                        </div>

                        {/* Harvest countdown */}
                        <div style={{ background: harvestSoon ? 'rgba(74,222,128,0.12)' : 'rgba(56,189,248,0.07)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '3px' }}>🗓️ Harvest</div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: harvestSoon ? '#4ade80' : daysLeft !== null ? 'var(--hydro-blue)' : 'var(--text2)' }}>
                            {daysLeft !== null ? `${daysLeft}d` : '—'}
                          </div>
                          {plant && <div style={{ fontSize: '9px', color: 'var(--text2)' }}>in {plant.daysToHarvest}d total</div>}
                        </div>
                      </div>

                      {/* Water progress bar */}
                      {cropName && plant && (
                        <div style={{ marginTop: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text2)', marginBottom: '3px' }}>
                            <span>Water consumption</span>
                            <span>{Math.min(100, Math.round((live.waterUsedL / plant.waterLDay) * 100))}% of daily need</span>
                          </div>
                          <div style={{ height: '4px', background: 'rgba(56,189,248,0.15)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.min(100, (live.waterUsedL / plant.waterLDay) * 100)}%`,
                              background: 'linear-gradient(90deg, var(--hydro-blue3), var(--hydro-blue))',
                              borderRadius: '999px',
                              transition: 'width 1s ease',
                            }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* TAB: LEARN */}
        {activeTab === 'learn' && (

          <>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: 'var(--hydro-blue)', marginBottom: '8px' }}>
                📚 Why Hydroponic Farming?
              </h2>
              <p style={{ color: 'var(--text2)', fontSize: '13px', lineHeight: 1.7, maxWidth: '700px' }}>
                Hydroponics is the future of sustainable urban food production. By growing plants in
                nutrient-rich water solutions instead of soil, we unlock remarkable efficiencies that
                traditional farming simply can't match — especially in dense urban environments.
              </p>
            </div>

            <div className="hydro-facts-grid">
              {FACTS.map((f, i) => (
                <div key={i} className="hydro-fact-card">
                  <div className="hydro-fact-icon">{f.icon}</div>
                  <div className="hydro-fact-title">{f.title}</div>
                  <div className="hydro-fact-body">{f.body}</div>
                </div>
              ))}
            </div>

            {/* System types */}
            <div className="card" style={{ borderColor: 'var(--hydro-border)', marginBottom: '24px' }}>
              <div className="card-header">
                <div className="card-title" style={{ color: 'var(--hydro-blue)' }}>⚙️ Hydroponic System Types</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                {[
                  { name: 'DWC', full: 'Deep Water Culture', desc: 'Roots suspended in oxygenated nutrient solution. Best for leafy greens & lettuce. Simple and reliable.', ideal: 'Lettuce, Basil, Spinach' },
                  { name: 'NFT', full: 'Nutrient Film Technique', desc: 'Thin film of nutrient solution flows over roots. Excellent for fast-growing crops. Space-efficient.', ideal: 'Herbs, Lettuce, Strawberry' },
                  { name: 'Vertical Tower', full: 'Vertical Tower Systems', desc: 'Plants stacked vertically, fed from a central reservoir. Maximum space efficiency for urban gardens.', ideal: 'Lettuce, Kale, Herbs' },
                  { name: 'Ebb & Flow', full: 'Ebb & Flow / Flood & Drain', desc: 'Periodic flooding and draining of the root zone. Highly versatile for many plant types.', ideal: 'Tomatoes, Peppers, Cucumbers' },
                  { name: 'Aeroponics', full: 'Aeroponics', desc: 'Roots are misted with nutrient solution in air. Highest oxygenation — fastest growth rates of all systems.', ideal: 'Root vegetables, Tomatoes' },
                  { name: 'Wick', full: 'Wick System', desc: 'Passive system using wicks to draw nutrients. No pumps needed. Perfect for beginners and low-maintenance plots.', ideal: 'Herbs, Microgreens' },
                ].map(s => (
                  <div key={s.name} style={{ background: 'var(--hydro-bg)', border: '1px solid var(--hydro-border)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{SYSTEM_EMOJI[s.name]}</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--hydro-blue)' }}>{s.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text2)' }}>{s.full}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '8px' }}>{s.desc}</p>
                    <div style={{ fontSize: '10px', color: '#4ade80' }}>🌿 Ideal for: {s.ideal}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick tips */}
            <div className="card" style={{ borderColor: 'var(--hydro-border)' }}>
              <div className="card-header">
                <div className="card-title" style={{ color: 'var(--hydro-blue)' }}>💡 Pro Tips for Success</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { tip: 'Maintain pH 5.5–7.0', detail: 'Most crops thrive at pH 6.0–6.5. Leafy greens prefer 6.0 while fruiting plants prefer 6.0–6.5.' },
                  { tip: 'Monitor nutrients weekly', detail: 'Top off reservoir with fresh nutrient solution. Full replacement every 2 weeks to prevent salt buildup.' },
                  { tip: 'Water temp 18–24°C', detail: 'Warmer water holds less dissolved oxygen. Keep it cool for healthier root zones and faster growth.' },
                  { tip: '16–18 hrs of light', detail: 'For most crops, 16 hours of full-spectrum LED light with 8 hours darkness mimics optimal growing conditions.' },
                  { tip: 'Check dissolved oxygen', detail: 'Use air stones in reservoirs. Roots need oxygen as much as nutrients — aeration is non-negotiable in DWC.' },
                  { tip: 'Harvest regularly', detail: 'Frequent harvesting of outer leaves (cut-and-come-again) extends plant life and increases total yield by 40%.' },
                ].map((t, i) => (
                  <div key={i} style={{ background: 'var(--hydro-bg)', border: '1px solid var(--hydro-border)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--hydro-blue)', marginBottom: '5px' }}>✓ {t.tip}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: 1.6 }}>{t.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <footer style={{ marginTop: '40px' }}>
          Built with 🌊 for sustainable urban farming · <span>Terraplan AI v1.0</span> · TerraTech LTD
        </footer>
      </div>
    </div>
  )
}

export default HydroponicFarming
