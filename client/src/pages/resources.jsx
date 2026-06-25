import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import axios from 'axios'
import API_BASE from '../api'

function Resources() {
  const [resources, setResources] = useState([])
  const [form, setForm] = useState({ name: '', emoji: '🔧', totalQuantity: '', availableQuantity: '', category: 'tool' })
  const [message, setMessage] = useState('')

  useEffect(() => { fetchResources() }, [])

  const fetchResources = () => {
    axios.get(`${API_BASE}/api/resources`).then(res => setResources(res.data))
  }

  const handleSubmit = async () => {
    try {
      await axios.post(`${API_BASE}/api/resources`, {
        ...form,
        totalQuantity: Number(form.totalQuantity),
        availableQuantity: Number(form.availableQuantity)
      })
      setMessage('Resource added! 🌿')
      setForm({ name: '', emoji: '🔧', totalQuantity: '', availableQuantity: '', category: 'tool' })
      fetchResources()
    } catch (err) {
      setMessage('Error adding resource!')
    }
  }

  const handleBorrow = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/resources/${id}/borrow`, { name: 'User' })
      fetchResources()
    } catch (err) { alert('No resources available!') }
  }

  const handleReturn = async (id) => {
    await axios.put(`${API_BASE}/api/resources/${id}/return`, { name: 'User' })
    fetchResources()
  }

  const handleDelete = async (id) => {
    await axios.delete(`${API_BASE}/api/resources/${id}`)
    fetchResources()
  }

  return (
    <div className="wrapper">
      <Navbar />
      <div style={{ padding: '32px 0' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', marginBottom: '24px' }}>
          🔧 Resource <em style={{ color: 'var(--green)' }}>Sharing</em>
        </h1>
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header"><div className="card-title">Add New Resource</div></div>
          {message && <p style={{ color: 'var(--green)', marginBottom: '16px', fontSize: '13px' }}>{message}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group"><label>Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Watering Can" /></div>
            <div className="form-group"><label>Emoji</label><input value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})} placeholder="🔧" /></div>
            <div className="form-group"><label>Total Quantity</label><input type="number" value={form.totalQuantity} onChange={e => setForm({...form, totalQuantity: e.target.value})} placeholder="e.g. 6" /></div>
            <div className="form-group"><label>Available Quantity</label><input type="number" value={form.availableQuantity} onChange={e => setForm({...form, availableQuantity: e.target.value})} placeholder="e.g. 4" /></div>
            <div className="form-group"><label>Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="tool">Tool</option>
                <option value="seed">Seed</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>
          </div>
          <button className="btn-primary" onClick={handleSubmit}>Add Resource</button>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">All Resources ({resources.length})</div></div>
          <div className="resource-list">
            {resources.length === 0 ? (
              <p style={{ color: 'var(--text2)', fontSize: '13px' }}>No resources yet!</p>
            ) : (
              resources.map(resource => (
                <div key={resource._id} className="resource-item">
                  <span className="resource-emoji">{resource.emoji}</span>
                  <div className="resource-info">
                    <div className="resource-name">{resource.name}</div>
                    <div className="resource-qty">{resource.availableQuantity} of {resource.totalQuantity} available · {resource.category}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleBorrow(resource._id)} className="resource-avail avail-yes" style={{ border: 'none', cursor: 'pointer' }}>Borrow</button>
                    <button onClick={() => handleReturn(resource._id)} style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--text2)', border: 'none', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', cursor: 'pointer' }}>Return</button>
                    <button onClick={() => handleDelete(resource._id)} style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'none', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Resources