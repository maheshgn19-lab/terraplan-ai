import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import axios from 'axios'

function Soil() {
  const [plots, setPlots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPlots() }, [])

  const fetchPlots = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/plots')
      setPlots(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const updateSoil = async (id, soilStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/plots/${id}`, {
        soilStatus,
        lastWatered: soilStatus === 'moist' || soilStatus === 'wet' ? new Date() : undefined
      })
      fetchPlots()
    } catch (err) { console.error(err) }
  }

  const getSoilColor = (status) => {
    if (status === 'wet') return { bg: 'rgba(96,165,250,0.2)', border: 'rgba(96,165,250,0.4)', color: '#60a5fa', emoji: '💧' }
    if (status === 'moist') return { bg: 'rgba(74,222,128,0.2)', border: 'rgba(74,222,128,0.4)', color: 'var(--green)', emoji: '🌱' }
    return { bg: 'rgba(251,191,36,0.2)', border: 'rgba(251,191,36,0.4)', color: 'var(--gold)', emoji: '🏜️' }
  }

  const getWateredAgo = (lastWatered) => {
    if (!lastWatered) return 'Never watered'
    const diff = Date.now() - new Date(lastWatered).getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  const drySoilCount = plots.filter(p => !p.soilStatus || p.soilStatus === 'dry').length
  const moistSoilCount = plots.filter(p => p.soilStatus === 'moist').length
  const wetSoilCount = plots.filter(p => p.soilStatus === 'wet').length

  return (
    <div className="wrapper">
      <Navbar />
      <div style={{ padding: '32px 0' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', marginBottom: '24px' }}>
          🪱 Soil <em style={{ color: 'var(--green)' }}>Status Tracker</em>
        </h1>

        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
          <div className="stat-card">
            <span className="stat-icon">🏜️</span>
            <div className="stat-num" style={{ color: 'var(--gold)' }}>{drySoilCount}</div>
            <div className="stat-label">Dry plots</div>
            <div className="stat-change" style={{ color: 'var(--gold)' }}>Need watering!</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🌱</span>
            <div className="stat-num">{moistSoilCount}</div>
            <div className="stat-label">Moist plots</div>
            <div className="stat-change">Perfect condition</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💧</span>
            <div className="stat-num" style={{ color: '#60a5fa' }}>{wetSoilCount}</div>
            <div className="stat-label">Wet plots</div>
            <div className="stat-change" style={{ color: '#60a5fa' }}>Skip watering</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <div className="card-title">🗺️ All Plots Soil Status</div>
            <button className="btn-ghost" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={fetchPlots}>Refresh</button>
          </div>
          {loading ? (
            <p style={{ color: 'var(--text2)', fontSize: '13px' }}>Loading plots...</p>
          ) : plots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text2)', fontSize: '13px' }}>No plots found. Add plots first!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {plots.map(plot => {
                const soil = getSoilColor(plot.soilStatus || 'dry')
                return (
                  <div key={plot._id} style={{ padding: '16px', background: soil.bg, borderRadius: '12px', border: `1px solid ${soil.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', color: soil.color }}>Plot {plot.plotNumber}</span>
                      <span style={{ fontSize: '20px' }}>{soil.emoji}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '4px' }}>Zone: {plot.zone}</div>
                    {plot.occupant && <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '4px' }}>👤 {plot.occupant}</div>}
                    <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '12px' }}>⏰ Watered: {getWateredAgo(plot.lastWatered)}</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => updateSoil(plot._id, 'dry')}
                        style={{ flex: 1, padding: '5px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', border: 'none', background: plot.soilStatus === 'dry' || !plot.soilStatus ? 'rgba(251,191,36,0.4)' : 'rgba(251,191,36,0.1)', color: 'var(--gold)', fontWeight: plot.soilStatus === 'dry' ? '500' : '300' }}>
                        🏜️ Dry
                      </button>
                      <button onClick={() => updateSoil(plot._id, 'moist')}
                        style={{ flex: 1, padding: '5px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', border: 'none', background: plot.soilStatus === 'moist' ? 'rgba(74,222,128,0.4)' : 'rgba(74,222,128,0.1)', color: 'var(--green)', fontWeight: plot.soilStatus === 'moist' ? '500' : '300' }}>
                        🌱 Moist
                      </button>
                      <button onClick={() => updateSoil(plot._id, 'wet')}
                        style={{ flex: 1, padding: '5px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', border: 'none', background: plot.soilStatus === 'wet' ? 'rgba(96,165,250,0.4)' : 'rgba(96,165,250,0.1)', color: '#60a5fa', fontWeight: plot.soilStatus === 'wet' ? '500' : '300' }}>
                        💧 Wet
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">💡 Soil Care Tips for Chennai</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { emoji: '🏜️', title: 'Dry Soil', tip: 'Water immediately in early morning. Add mulch to retain moisture. Check daily during summer.', color: 'var(--gold)' },
              { emoji: '🌱', title: 'Moist Soil', tip: 'Perfect condition! Maintain this by watering every 2 days. Great for most Chennai crops.', color: 'var(--green)' },
              { emoji: '💧', title: 'Wet Soil', tip: 'Skip watering today. Ensure good drainage to prevent root rot. Watch for fungal diseases.', color: '#60a5fa' },
            ].map((tip, i) => (
              <div key={i} style={{ padding: '16px', background: 'var(--bg3)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{tip.emoji}</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: tip.color, marginBottom: '8px' }}>{tip.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.6' }}>{tip.tip}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Soil