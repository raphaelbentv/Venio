import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import '../espace-client/ClientPortal.css'
import './AdminPortal.css'

const roleLabels = {
  SUPER_ADMIN: 'Super admin',
  ADMIN: 'Contributeur',
  VIEWER: 'Lecture seule',
}

const AdminEdit = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [admin, setAdmin] = useState(null)
  const [form, setForm] = useState({ name: '', role: 'ADMIN', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch(`/api/admin/admins/${userId}`)
        const user = data.user
        setAdmin(user)
        setForm({ name: user.name || '', role: user.role || 'ADMIN', password: '' })
      } catch (err) {
        setError(err.message || 'Erreur chargement admin')
      }
    }
    load()
  }, [userId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { name: form.name, role: form.role }
      if (form.password) {
        payload.password = form.password
      }
      const data = await apiFetch(`/api/admin/admins/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      setAdmin(data.user)
      setForm((prev) => ({ ...prev, password: '' }))
    } catch (err) {
      setError(err.message || 'Erreur mise à jour admin')
    } finally {
      setLoading(false)
    }
  }

  if (!admin && !error) {
    return (
      <div className="portal-container">
        <div className="admin-loading">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="portal-container">
      <div className="portal-card">
        <div className="admin-breadcrumb">
          <Link to="/admin">Admin</Link>
          <span>/</span>
          <Link to="/admin/comptes-admin">Comptes admin</Link>
          <span>/</span>
          <span style={{ color: '#ffffff' }}>{admin?.name || 'Administrateur'}</span>
        </div>
        <div className="admin-header">
          <div>
            <h1 style={{ marginBottom: '8px' }}>{admin?.name || 'Administrateur'}</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
              {admin?.email} · {roleLabels[admin?.role] || admin?.role}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-error" style={{ marginTop: 24 }}>
          {error}
        </div>
      )}

      <div className="portal-card" style={{ marginTop: 24 }}>
        <form className="portal-list" onSubmit={handleSubmit}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Nom complet
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
              Rôle
            </label>
            <select
              className="portal-input"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
            >
              {admin?.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super admin</option>}
              <option value="ADMIN">Contributeur</option>
              <option value="VIEWER">Lecture seule</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Nouveau mot de passe (optionnel)
            </label>
            <input
              className="portal-input"
              type="password"
              placeholder="Laisser vide pour ne pas changer"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </div>
          <div className="admin-button-group">
            <button className="portal-button" type="submit" disabled={loading}>
              {loading ? 'Mise à jour...' : 'Enregistrer'}
            </button>
            <button className="portal-button secondary" type="button" onClick={() => navigate('/admin/comptes-admin')}>
              Retour
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminEdit
