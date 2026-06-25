import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import axios from 'axios'
import API_BASE from '../api'

function Plots() {
  const [plots, setPlots] = useState([])
  const [form, setForm] = useState({ plotNumber: '', zone: '', status: 'free', occupant: '', crops: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchPlots()
  }, [])

  const fetchPlots = () => {
    axios.get(`${API_BASE}/api/plots`).then(res => setPlots(res.data))
  }

  const handleSubmit = async () => {
    try {
      await axios.post(`${API_BASE}/api/plots`, {
        ...form,
        crops: form.crops.split(',').map(c => c.trim())
      })
      setMessage('Plot added successfully! 🌿')
      setForm({ plotNumber: '', zone: '', status: 'free', occupant: '', crops: '' })
      fetchPlots()
    } catch (err) {
      setMessage('Error adding plot!')
    }
  }

  const handleDelete = async (id) => {
    await axios.delete(`${API_BASE}/api/plots/${id}`)
    fetchPlots()
  }

  return (
    <div className="wrapper">
      <Navbar />

      <div style={{ padding: '32px 0' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', marginBottom: '24px' }}>
          🗺️ Plot <em style={{ color: 'var(--green)' }}>Booking</em>
        </h1>

        {/* Add Plot Form */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div className="card-title">Add New Plot</div>
          </div>
          {message && <p style={{ color: 'var(--green)', marginBottom: '16px', fontSize: '13px' }}>{message}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Plot Number</label>
              <input value={form.plotNumber} onChange={e => setForm({...form, plotNumber: e.target.value})} placeholder="e.g. A1" />
            </div>
            <div className="form-group">
              <label>Zone</label>
              <input value={form.zone} onChange={e => setForm({...form, zone: e.target.value})} placeholder="e.g. Zone A" />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="free">Free</option>
                <option value="taken">Taken</option>
                <option value="reserved">Reserved</option>
                <option value="mine">Mine</option>
              </select>
            </div>
            <div className="form-group">
              <label>Occupant</label>
              <input value={form.occupant} onChange={e => setForm({...form, occupant: e.target.value})} placeholder="Name of occupant" />
            </div>
            <div className="form-group">
              <label>Crops (comma separated)</label>
              <input value={form.crops} onChange={e => setForm({...form, crops: e.target.value})} placeholder="e.g. Tomato, Basil" />
            </div>
          </div>
          <button className="btn-primary" onClick={handleSubmit}>Add Plot</button>
        </div>

        {/* Plots List */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">All Plots ({plots.length})</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {plots.length === 0 ? (
              <p style={{ color: 'var(--text2)', fontSize: '13px' }}>No plots yet. Add one above!</p>
            ) : (
              plots.map(plot => (
                <div key={plot._id} style={{ background: 'var(--bg3)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: 'var(--green)' }}>Plot {plot.plotNumber}</span>
                    <span className={`resource-avail ${plot.status === 'free' ? 'avail-yes' : 'avail-no'}`}>{plot.status}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>Zone: {plot.zone}</p>
                  {plot.occupant && <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>Occupant: {plot.occupant}</p>}
                  {plot.crops?.length > 0 && <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Crops: {plot.crops.join(', ')}</p>}
                  <p style={{ fontSize: '11px', color: plot.soilStatus === 'moist' ? 'var(--green)' : plot.soilStatus === 'wet' ? '#60a5fa' : 'var(--gold)', marginBottom: '8px' }}>
                    Soil: {plot.soilStatus || 'dry'}
                  </p>
                  <button onClick={() => handleDelete(plot._id)} style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Plots