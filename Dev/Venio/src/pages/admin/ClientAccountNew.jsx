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
        <h1>Nouveau compte client</h1>
        <Link className="portal-link" to="/admin/comptes-clients">
          Retour
        </Link>
      </div>

      <div className="portal-card" style={{ marginTop: 24 }}>
        <form className="portal-list" onSubmit={handleSubmit}>
          <input
            className="portal-input"
            placeholder="Nom"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <input
            className="portal-input"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <input
            className="portal-input"
            type="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
          {error && <p>{error}</p>}
          <button className="portal-button" type="submit" disabled={loading}>
            {loading ? 'Creation...' : 'Creer le compte'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ClientAccountNew
