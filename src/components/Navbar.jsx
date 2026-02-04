import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

const Navbar = () => {
  const [polesOpen, setPolesOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobilePolesOpen, setMobilePolesOpen] = useState(false)
  const location = useLocation()

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
    if (!mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
    setMobilePolesOpen(false)
    document.body.style.overflow = 'unset'
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo" onClick={closeMobileMenu}>VENIO</Link>
        <div className="nav-links">
          <Link 
            to="/services/communication" 
            className={`nav-link nav-link-icon ${location.pathname.startsWith('/services') ? 'active' : ''}`}
            data-tooltip="Services"
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
            <span className="nav-link-text">Services</span>
          </Link>
          
          <div 
            className="nav-item dropdown"
            onMouseEnter={() => setPolesOpen(true)}
            onMouseLeave={() => setPolesOpen(false)}
          >
            <span className={`nav-link nav-link-icon ${location.pathname === '/poles' ? 'active' : ''}`} data-tooltip="Pôles">
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="nav-link-text">Pôles</span>
            </span>
            {polesOpen && (
              <div className="dropdown-menu">
                <a href="https://creatio.paris" target="_blank" rel="noopener noreferrer" className="dropdown-item dropdown-item-pole">
                  <span className="pole-name">CREATIO</span>
                  <span className="pole-description">Supports de cours</span>
                </a>
                <a href="https://decisio.paris" target="_blank" rel="noopener noreferrer" className="dropdown-item dropdown-item-pole">
                  <span className="pole-name">DECISIO</span>
                  <span className="pole-description">Communication juridique</span>
                </a>
                <a href="https://formatio.paris" target="_blank" rel="noopener noreferrer" className="dropdown-item dropdown-item-pole">
                  <span className="pole-name">FORMATIO</span>
                  <span className="pole-description">Formations professionnelles</span>
                </a>
              </div>
            )}
          </div>
          
          <Link 
            to="/realisations" 
            className={`nav-link nav-link-icon ${location.pathname === '/realisations' ? 'active' : ''}`}
            data-tooltip="Réalisations"
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="2" y="2" width="20" height="20" rx="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="17" x2="22" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
            </svg>
            <span className="nav-link-text">Réalisations</span>
          </Link>
          
          <Link 
            to="/a-propos" 
            className={`nav-link nav-link-icon ${location.pathname === '/a-propos' ? 'active' : ''}`}
            data-tooltip="À propos"
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span className="nav-link-text">À propos</span>
          </Link>
          
          <Link 
            to="/contact" 
            className={`nav-link nav-link-icon ${location.pathname === '/contact' ? 'active' : ''}`}
            data-tooltip="Contact"
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="nav-link-text">Contact</span>
          </Link>
          
          <Link 
            to="/espace-client" 
            className={`nav-link nav-portal nav-link-icon ${location.pathname.startsWith('/espace-client') ? 'active' : ''}`}
            data-tooltip="Espace client"
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="nav-link-text">Espace client</span>
          </Link>
          
          <Link 
            to="/admin" 
            className={`nav-link nav-portal nav-link-icon ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
            data-tooltip="Administration"
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="nav-link-text">Admin</span>
          </Link>
        </div>
        
        <button 
          type="button"
          className={`burger-menu ${mobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <span className="mobile-menu-title">Menu</span>
          <button
            type="button"
            className="mobile-menu-close"
            onClick={closeMobileMenu}
            aria-label="Fermer le menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            <span>Fermer</span>
          </button>
        </div>
        <div className="mobile-menu-content">
          <Link to="/services/communication" className="mobile-nav-link" onClick={closeMobileMenu}>
            Services
          </Link>
          
          <div className="mobile-nav-item">
            <button 
              className="mobile-nav-link mobile-nav-link-button"
              onClick={() => setMobilePolesOpen(!mobilePolesOpen)}
            >
              Pôles
              <span className={`mobile-dropdown-arrow ${mobilePolesOpen ? 'open' : ''}`}>▼</span>
            </button>
            {mobilePolesOpen && (
              <div className="mobile-dropdown-menu">
                <a href="https://creatio.paris" target="_blank" rel="noopener noreferrer" className="mobile-dropdown-item" onClick={closeMobileMenu}>
                  <span className="pole-name">CREATIO</span>
                  <span className="pole-description">Supports de cours</span>
                </a>
                <a href="https://decisio.paris" target="_blank" rel="noopener noreferrer" className="mobile-dropdown-item" onClick={closeMobileMenu}>
                  <span className="pole-name">DECISIO</span>
                  <span className="pole-description">Communication juridique</span>
                </a>
                <a href="https://formatio.paris" target="_blank" rel="noopener noreferrer" className="mobile-dropdown-item" onClick={closeMobileMenu}>
                  <span className="pole-name">FORMATIO</span>
                  <span className="pole-description">Formations professionnelles</span>
                </a>
              </div>
            )}
          </div>
          
          <Link to="/realisations" className="mobile-nav-link" onClick={closeMobileMenu}>
            Réalisations
          </Link>
          <Link to="/a-propos" className="mobile-nav-link" onClick={closeMobileMenu}>
            À propos
          </Link>
          <Link to="/contact" className="mobile-nav-link" onClick={closeMobileMenu}>
            Contact
          </Link>
          <Link to="/espace-client" className="mobile-nav-link mobile-nav-portal" onClick={closeMobileMenu}>
            <svg className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Espace client
          </Link>
          <Link to="/admin" className="mobile-nav-link mobile-nav-portal" onClick={closeMobileMenu}>
            <svg className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Admin
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
