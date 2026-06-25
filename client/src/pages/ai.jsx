import { useState } from 'react'
import Navbar from '../components/Navbar'
import axios from 'axios'

function AI() {
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const suggestions = [
    'What should I plant in my garden right now?',
    'How do I improve my soil quality?',
    'What pests should I watch out for this season?',
    'How often should I water my plants in Chennai heat?',
    'What are the best companion plants for tomatoes?',
    'How do I start composting in my garden?',
  ]

  const handleAsk = async () => {
    if (!question.trim()) return
    setLoading(true)
    setResponse('')
    try {
      const res = await axios.post('http://localhost:5000/api/ai/suggest', { question })
      setResponse(res.data.suggestion)
    } catch (err) {
      setResponse('Sorry, AI is unavailable right now. Please try again!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="wrapper">
      <Navbar />
      <div style={{ padding: '32px 0' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', marginBottom: '8px' }}>
          🤖 AI Garden <em style={{ color: 'var(--green)' }}>Assistant</em>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '32px' }}>
          Powered by Google Gemini · Tailored for Chennai climate
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
          <div>
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="card-header">
                <div className="card-title" style={{ fontSize: '16px' }}>💡 Quick Questions</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => setQuestion(s)}
                    style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '8px 14px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={e => { e.target.style.borderColor = 'rgba(74,222,128,0.4)'; e.target.style.color = 'var(--green)' }}
                    onMouseOut={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text2)' }}
                  >{s}</button>
                ))}
              </div>
            </div>
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label>Ask your garden question</label>
                <textarea value={question} onChange={e => setQuestion(e.target.value)}
                  placeholder="e.g. What vegetables grow best in Chennai in March?"
                  rows={3} style={{ resize: 'none' }} />
              </div>
              <button className="btn-primary" onClick={handleAsk} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? '🌿 Thinking...' : '🤖 Ask AI Assistant'}
              </button>
            </div>
            {(loading || response) && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ fontSize: '16px' }}>🌿 AI Response</div>
                </div>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌱</div>
                    <p>Analyzing Chennai weather and soil conditions...</p>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text)', whiteSpace: 'pre-wrap', padding: '16px', background: 'var(--bg3)', borderRadius: '12px' }}>
                    {response}
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <div className="card-title" style={{ fontSize: '15px', marginBottom: '16px' }}>🌍 About This AI</div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.7' }}>
                <p style={{ marginBottom: '12px' }}>Our AI assistant is powered by Google Gemini and trained to give advice specific to:</p>
                {['Chennai climate & seasons', 'Tamil Nadu soil types', 'Local crop varieties', 'Regional pest patterns', 'Water conservation'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--green)', fontSize: '12px' }}>✓</span>
                    <span style={{ fontSize: '12px' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-title" style={{ fontSize: '15px', marginBottom: '16px' }}>📊 Current Conditions</div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.7' }}>
                <p>🌡️ Chennai, Tamil Nadu</p>
                <p>📅 {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                <p>🌾 {(() => {
                  const m = new Date().getMonth() + 1
                  if (m >= 6 && m <= 9) return 'Kharif Season'
                  if (m >= 10 && m <= 12) return 'Rabi Season'
                  if (m >= 1 && m <= 3) return 'Spring Season'
                  return 'Summer Season'
                })()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AI