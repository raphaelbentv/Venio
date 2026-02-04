import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import '../espace-client/ClientPortal.css'
import './AdminPortal.css'

const roleLabels = {
  SUPER_ADMIN: 'Super admin',
  ADMIN: 'Contributeur',
  VIEWER: 'Lecture seule',
}

const AdminList = () => {
  const { user } = useAuth()
  const [admins, setAdmins] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/api/admin/admins')
        setAdmins(data.users || [])
      } catch (err) {
        setError(err.message || 'Erreur chargement admins')
      }
    }
    load()
  }, [])

  const handleDelete = async (adminId) => {
    if (!window.confirm('Supprimer cet administrateur ?')) return
    setError('')
    try {
      await apiFetch(`/api/admin/admins/${adminId}`, { method: 'DELETE' })
      setAdmins((prev) => prev.filter((admin) => admin._id !== adminId))
    } catch (err) {
      setError(err.message || 'Erreur suppression admin')
    }
  }

  return (
    <div className="portal-container">
      <div className="portal-card">
        <div className="admin-breadcrumb">
          <Link to="/admin">Admin</Link>
          <span>/</span>
          <span style={{ color: '#ffffff' }}>Comptes admin</span>
        </div>
        <div className="admin-header">
          <h1>Comptes admin</h1>
          <div className="admin-actions portal-actions-reveal">
            <Link className="portal-button portal-action-link" to="/admin/comptes-admin/nouveau" title="Nouvel administrateur">
              <span className="portal-action-icon" aria-hidden>
                <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
              </span>
              <span className="portal-action-label">Nouvel administrateur</span>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-error" style={{ marginTop: 24 }}>
          {error}
        </div>
      )}

      <div className="portal-card" style={{ marginTop: 24 }}>
        {admins.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-state-icon">🛡️</div>
            <p className="admin-empty-state-text">Aucun compte admin</p>
          </div>
        ) : (
          <div className="admin-list">
            {admins.map((admin) => (
              <div key={admin._id} className="admin-list-item">
                <div className="admin-list-item-content">
                  <h3 className="admin-list-item-title">{admin.name}</h3>
                  <p className="admin-list-item-subtitle">
                    {admin.email} · {roleLabels[admin.role] || admin.role}
                  </p>
                </div>
                <div className="admin-list-item-actions">
                  <Link className="portal-button secondary" to={`/admin/comptes-admin/${admin._id}`}>
                    Modifier
                  </Link>
                  <button
                    className="portal-button secondary"
                    type="button"
                    onClick={() => handleDelete(admin._id)}
                    disabled={user?._id === admin._id}
                    title={user?._id === admin._id ? 'Suppression interdite' : 'Supprimer'}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminList
