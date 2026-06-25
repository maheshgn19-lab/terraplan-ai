import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import axios from 'axios'
import API_BASE from '../api'

function Weather() {
  const [weather, setWeather] = useState(null)
  const [crops, setCrops] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [weatherRes, cropsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/weather`),
        axios.get(`${API_BASE}/api/weather/crops`)
      ])
      setWeather(weatherRes.data)
      setCrops(cropsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getSoilStatus = (humidity) => {
    if (humidity > 80) return { status: 'Wet', color: '#60a5fa', emoji: '💧' }
    if (humidity > 50) return { status: 'Moist', color: 'var(--green)', emoji: '🌱' }
    return { status: 'Dry', color: 'var(--gold)', emoji: '🏜️' }
  }

  return (
    <div className="wrapper">
      <Navbar />
      <div style={{ padding: '32px 0' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', marginBottom: '24px' }}>
          🌤️ Weather & <em style={{ color: 'var(--green)' }}>Garden Insights</em>
        </h1>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text2)' }}>Loading weather data... 🌿</div>
        ) : (
          <>
            {weather && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #111a11, #162016)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt="weather" style={{ width: '80px' }} />
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '64px', fontWeight: '700', color: 'var(--gold)', lineHeight: 1 }}>{weather.temperature}°</div>
                    <div style={{ fontSize: '16px', color: 'var(--text)', marginTop: '8px', textTransform: 'capitalize' }}>{weather.description}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>{weather.city} · Feels like {weather.feelsLike}°</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', color: 'var(--green)', fontWeight: '500' }}>{weather.humidity}%</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Humidity</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', color: 'var(--green)', fontWeight: '500' }}>{weather.windSpeed} m/s</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Wind</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', color: 'var(--green)', fontWeight: '500' }}>{weather.pressure} hPa</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Pressure</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', color: 'var(--green)', fontWeight: '500' }}>{weather.visibility} km</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Visibility</div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-title" style={{ fontSize: '16px' }}>🌱 Garden Advice</div>
                  </div>
                  <div style={{ padding: '16px', background: 'var(--bg3)', borderRadius: '12px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text)' }}>{weather.gardenAdvice}</p>
                  </div>
                  <div className="card-title" style={{ fontSize: '16px', marginBottom: '12px' }}>🪱 Soil Status</div>
                  {(() => {
                    const soil = getSoilStatus(weather.humidity)
                    return (
                      <div style={{ padding: '16px', background: 'var(--bg3)', borderRadius: '12px', border: `1px solid ${soil.color}30` }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>{soil.emoji}</div>
                        <div style={{ fontSize: '20px', fontWeight: '500', color: soil.color }}>{soil.status}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>Based on {weather.humidity}% humidity</div>
                        {crops && <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '8px', lineHeight: '1.6' }}>{crops.soilTip}</div>}
                      </div>
                    )
                  })()}
                </div>

                {crops && (
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title" style={{ fontSize: '16px' }}>📅 Current Season</div>
                    </div>
                    <div style={{ padding: '16px', background: 'var(--bg3)', borderRadius: '12px', marginBottom: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌾</div>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: 'var(--green)' }}>{crops.season}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>Chennai, Tamil Nadu</div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.7', padding: '12px', background: 'var(--bg3)', borderRadius: '8px' }}>
                      {crops.soilTip}
                    </div>
                  </div>
                )}
              </div>
            )}

            {crops && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">🌱 Recommended Crops for {crops.season}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {crops.crops.map((crop, i) => (
                    <div key={i} style={{ padding: '16px', background: 'var(--bg3)', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(74,222,128,0.4)'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{crop.emoji}</div>
                      <div style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>{crop.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>{crop.tip}</div>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: crop.difficulty === 'Easy' ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)', color: crop.difficulty === 'Easy' ? 'var(--green)' : 'var(--gold)' }}>{crop.difficulty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Weather