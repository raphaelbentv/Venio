import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import '../espace-client/ClientPortal.css'

const AdminLogin = () => {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(form.email, form.password)
      if (!result.user || result.user.role !== 'ADMIN') {
        logout()
        setError('Acces reserve aux administrateurs')
        return
      }
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message || 'Connexion impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal-container">
      <div className="portal-card">
        <h1>Admin</h1>
        <p>Connexion administrateur.</p>
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

export default AdminLogin
