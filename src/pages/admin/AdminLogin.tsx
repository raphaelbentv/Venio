import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isAdminRole } from '../../lib/permissions'
import '../espace-client/ClientPortal.css'

const AdminLogin = () => {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<{ email: string; password: string }>({ email: '', password: '' })
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  if (user?.role && isAdminRole(user.role)) {
    return <Navigate to="/admin" replace />
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(form.email, form.password)
      if (!result.user || !isAdminRole(result.user.role)) {
        logout()
        setError('Accès réservé aux administrateurs')
        return
      }
      navigate('/admin', { replace: true })
    } catch (err: unknown) {
      setError((err as Error).message || 'Connexion impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal-container">
      <div className="portal-card" style={{ maxWidth: '480px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '8px' }}>Connexion Admin</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '24px' }}>
          Accès réservé aux administrateurs
        </p>
        <form onSubmit={handleSubmit} className="portal-list">
          <input
            className="portal-input"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: event.target.value })}
            required
          />
          <input
            className="portal-input"
            type="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, password: event.target.value })}
            required
          />
          {error && <div className="admin-error">{error}</div>}
          <button className="portal-button" type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
            <a href="mailto:contact@venio.fr?subject=Réinitialisation mot de passe admin" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
              Mot de passe oublié ?
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin
