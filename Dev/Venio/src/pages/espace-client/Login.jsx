import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './ClientPortal.css'

const ClientLogin = () => {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user?.role === 'CLIENT') {
    return <Navigate to="/espace-client" replace />
  }
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(form.email, form.password)
      if (result.user?.role === 'ADMIN') {
        navigate('/admin', { replace: true })
        return
      }
      navigate('/espace-client', { replace: true })
    } catch (err) {
      setError(err.message || 'Connexion impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal-container">
      <div className="portal-card">
        <h1>Espace client</h1>
        <p>Connectez-vous pour acceder a vos projets.</p>
        <form onSubmit={handleSubmit} className="portal-list">
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
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ClientLogin
