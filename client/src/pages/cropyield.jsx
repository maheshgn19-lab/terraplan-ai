import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import axios from 'axios'

function CropYield() {
  const [yields, setYields] = useState([])
  const [stats, setStats] = useState(null)
  const [form, setForm] = useState({ plotNumber: '', zone: '', cropName: '', expectedYield: '', actualYield: '', unit: 'kg', harvestDate: '', notes: '', season: 'Spring 2026' })
  const [message, setMessage] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const [yieldsRes, statsRes] = await Promise.all([
      axios.get('http://localhost:5000/api/yields'),
      axios.get('http://localhost:5000/api/yields/stats')
    ])
    setYields(yieldsRes.data)
    setStats(statsRes.data)
  }

  const handleSubmit = async () => {
    try {
      await axios.post('http://localhost:5000/api/yields', {
        ...form,
        expectedYield: Number(form.expectedYield),
        actualYield: Number(form.actualYield)
      })
      setMessage('Yield entry added! 🌿')
      setForm({ plotNumber: '', zone: '', cropName: '', expectedYield: '', actualYield: '', unit: 'kg', harvestDate: '', notes: '', season: 'Spring 2026' })
      fetchData()
    } catch (err) { setMessage('Error adding yield entry!') }
  }

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:5000/api/yields/${id}`)
    fetchData()
  }

  const getYieldPct = (actual, expected) => {
    if (!expected) return 0
    return Math.min(Math.round((actual / expected) * 100), 100)
  }

  const getYieldColor = (pct) => {
    if (pct >= 80) return 'var(--green)'
    if (pct >= 50) return 'var(--gold)'
    return '#f87171'
  }

  return (
    <div className="wrapper">
      <Navbar />
      <div style={{ padding: '32px 0' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', marginBottom: '24px' }}>
          🌾 Crop <em style={{ color: 'var(--green)' }}>Yield Tracker</em>
        </h1>

        {/* Stats */}
        {stats && (
          <div className="stats-row" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <span className="stat-icon">🌾</span>
              <div className="stat-num">{stats.totalActual}</div>
              <div className="stat-label">Total yield (kg)</div>
              <div className="stat-change">↑ Season total</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🎯</span>
              <div className="stat-num" style={{ color: getYieldColor(stats.successRate) }}>{stats.successRate}%</div>
              <div className="stat-label">Success rate</div>
              <div className="stat-change">Expected vs actual</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🏆</span>
              <div className="stat-num" style={{ fontSize: '20px', paddingTop: '8px' }}>{stats.topCrop}</div>
              <div className="stat-label">Top crop</div>
              <div className="stat-change">Highest yield</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📊</span>
              <div className="stat-num">{stats.totalEntries}</div>
              <div className="stat-label">Harvest entries</div>
              <div className="stat-change">This season</div>
            </div>
          </div>
        )}

        {/* Add form */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div className="card-title">Log Harvest</div>
          </div>
          {message && <p style={{ color: 'var(--green)', marginBottom: '16px', fontSize: '13px' }}>{message}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Plot Number</label>
              <input value={form.plotNumber} onChange={e => setForm({...form, plotNumber: e.target.value})} placeholder="e.g. A1" />
            </div>
            <div className="form-group">
              <label>Zone</label>
              <input value={form.zone} onChange={e => setForm({...form, zone: e.target.value})} placeholder="e.g. Zone A" />
            </div>
            <div className="form-group">
              <label>Crop Name</label>
              <input value={form.cropName} onChange={e => setForm({...form, cropName: e.target.value})} placeholder="e.g. Tomato" />
            </div>
            <div className="form-group">
              <label>Expected Yield</label>
              <input type="number" value={form.expectedYield} onChange={e => setForm({...form, expectedYield: e.target.value})} placeholder="e.g. 10" />
            </div>
            <div className="form-group">
              <label>Actual Yield</label>
              <input type="number" value={form.actualYield} onChange={e => setForm({...form, actualYield: e.target.value})} placeholder="e.g. 8" />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="pieces">pieces</option>
                <option value="bunches">bunches</option>
              </select>
            </div>
            <div className="form-group">
              <label>Harvest Date</label>
              <input type="date" value={form.harvestDate} onChange={e => setForm({...form, harvestDate: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Season</label>
              <input value={form.season} onChange={e => setForm({...form, season: e.target.value})} placeholder="e.g. Spring 2026" />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any observations..." />
            </div>
          </div>
          <button className="btn-primary" onClick={handleSubmit}>Log Harvest</button>
        </div>

        {/* Yields list */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">All Harvest Entries ({yields.length})</div>
          </div>
          {yields.length === 0 ? (
            <p style={{ color: 'var(--text2)', fontSize: '13px' }}>No harvest entries yet. Log one above!</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {yields.map(y => {
                const pct = getYieldPct(y.actualYield, y.expectedYield)
                const color = getYieldColor(pct)
                return (
                  <div key={y._id} style={{ padding: '16px', background: 'var(--bg3)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', color: 'var(--green)' }}>{y.cropName}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Plot {y.plotNumber}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '4px' }}>Zone: {y.zone} · {y.season}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '8px' }}>
                      Expected: {y.expectedYield}{y.unit} · Actual: {y.actualYield}{y.unit}
                    </div>
                    {/* Progress bar */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text2)' }}>Yield success</span>
                        <span style={{ color }}>{pct}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color})` }} />
                      </div>
                    </div>
                    {y.notes && <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '8px', fontStyle: 'italic' }}>"{y.notes}"</div>}
                    <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '10px' }}>
                      📅 {y.harvestDate ? new Date(y.harvestDate).toLocaleDateString() : 'No date'}
                    </div>
                    <button onClick={() => handleDelete(y._id)} style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CropYield