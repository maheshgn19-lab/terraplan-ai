import { useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import logoImg from '../assets/logo.jpg'

const NAV_LINKS = [
  { to: '/',             label: 'Home' },
  { to: '/plots',        label: 'Plots' },
  { to: '/resources',    label: 'Resources' },
  { to: '/weather',      label: 'Weather' },
  { to: '/ai',           label: 'AI' },
  { to: '/soil',         label: 'Soil' },
  { to: '/yield',        label: 'Yield' },
  { to: '/volunteers',   label: 'Volunteers' },
  { to: '/hydroponic',   label: '🌊 Hydroponic' },
  { to: '/water',        label: 'Water' },
  { to: '/calendar',     label: 'Calendar' },
  { to: '/announcements',label: 'Community' },
]

function Navbar() {
  const navRef = useRef(null)
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Determine if a link is active
  const isActive = (to) => {
    if (to === '/') return location.pathname === '/'
    return location.pathname === to || location.pathname.startsWith(to + '/')
  }

  const scrollLeft = () => {
    navRef.current.scrollBy({ left: -180, behavior: 'smooth' })
  }

  const scrollRight = () => {
    navRef.current.scrollBy({ left: 180, behavior: 'smooth' })
  }

  // Auto-scroll the active link into view whenever the route changes
  useEffect(() => {
    if (!navRef.current) return
    const activeEl = navRef.current.querySelector('a.active')
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
    }
  }, [location.pathname])

  return (
    <header>
      {/* Logo */}
      <div className="logo">
        <img src={logoImg} alt="Logo" className="logo-icon" style={{ objectFit: 'cover', objectPosition: '50% 18%', background: 'transparent' }} />
        <span className="logo-text">Terraplan AI</span>
      </div>

      {/* Scrollable nav area */}
      <div className="nav-scroll-wrapper">
        <button className="nav-arrow" onClick={scrollLeft} aria-label="Scroll left">‹</button>

        <nav ref={navRef} className="nav-links">
          {NAV_LINKS.map(({ to, label }) => {
            const active = isActive(to)
            return (
              <Link
                key={to}
                to={to}
                className={active ? 'active' : ''}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <button className="nav-arrow" onClick={scrollRight} aria-label="Scroll right">›</button>
      </div>

      {/* Right side actions (Always visible) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
        
        {/* Profile Link ALWAYS visible */}
        {user ? (
          <Link
            to="/profile"
            className={`nav-profile-link${isActive('/profile') ? ' active' : ''}`}
            title={`${user.name} – Profile`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: isActive('/profile') ? 'var(--green)' : 'var(--text)' }}
          >
            <span className="nav-avatar-dot">{getInitials(user.name)}</span>
            <span className="profile-text-hide-mobile">Profile</span>
          </Link>
        ) : (
          <Link to="/login" className="btn-primary" style={{ padding: '7px 16px', fontSize: '12px' }}>
            Sign In
          </Link>
        )}

        <button
          className="navbar-theme-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          style={{ margin: 0 }}
        >
          {theme === 'dark' ? '☀️' : '🌑'}
        </button>
      </div>
    </header>
  )
}

export default Navbar