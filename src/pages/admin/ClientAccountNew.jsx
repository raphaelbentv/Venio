import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import '../espace-client/ClientPortal.css'

const ClientAccountNew = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      navigate(`/admin/comptes-clients/${data.user._id}`)
    } catch (err) {
      setError(err.message || 'Erreur creation compte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal-container">
      <div className="portal-card">
        <div className="admin-breadcrumb">
          <Link to="/admin">Admin</Link>
          <span>/</span>
          <Link to="/admin/comptes-clients">Comptes clients</Link>
          <span>/</span>
          <span style={{ color: '#ffffff' }}>Nouveau compte</span>
        </div>
        <h1>Nouveau compte client</h1>
      </div>

      <div className="portal-card" style={{ marginTop: 24 }}>
        <form className="portal-list" onSubmit={handleSubmit}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Nom du client
            </label>
            <input
              className="portal-input"
              placeholder="Nom complet"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Email
            </label>
            <input
              className="portal-input"
              type="email"
              placeholder="email@exemple.com"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Mot de passe
            </label>
            <input
              className="portal-input"
              type="password"
              placeholder="Mot de passe sécurisé"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </div>
          {error && <div className="admin-error">{error}</div>}
          <div className="admin-button-group">
            <button className="portal-button" type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
            <Link className="portal-button secondary" to="/admin/comptes-clients">
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClientAccountNew
