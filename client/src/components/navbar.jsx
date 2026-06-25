import { useRef } from 'react'
import { Link } from 'react-router-dom'

function Navbar() {
  const navRef = useRef(null)

  const scrollLeft = () => {
    navRef.current.scrollBy({ left: -150, behavior: 'smooth' })
  }

  const scrollRight = () => {
    navRef.current.scrollBy({ left: 150, behavior: 'smooth' })
  }

  return (
    <header>
      <div className="logo">
        <div className="logo-icon">🌿</div>
        <span className="logo-text">Terraplan AI</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', flex: 1, margin: '0 12px', overflow: 'hidden' }}>
        <button onClick={scrollLeft} style={{ background: 'transparent', border: 'none', color: 'var(--green)', fontSize: '16px', cursor: 'pointer', padding: '0 6px', flexShrink: 0 }}>‹</button>
        <nav ref={navRef}>
          <Link to="/">Home</Link>
          <Link to="/plots">Plots</Link>
          <Link to="/resources">Resources</Link>
          <Link to="/weather">Weather</Link>
          <Link to="/ai">AI</Link>
          <Link to="/soil">Soil</Link>
          <Link to="/yield">Yield</Link>
          <Link to="/water">Water</Link>
          <Link to="/volunteers">Volunteers</Link>
          <Link to="/calendar">Calendar</Link>
          <Link to="/announcements">Community</Link>
        </nav>
        <button onClick={scrollRight} style={{ background: 'transparent', border: 'none', color: 'var(--green)', fontSize: '16px', cursor: 'pointer', padding: '0 6px', flexShrink: 0 }}>›</button>
      </div>
    </header>
  )
}

export default Navbar