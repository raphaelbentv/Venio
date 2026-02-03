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
          <div className="admin-actions">
            <Link className="portal-button" to="/admin/comptes-admin/nouveau">
              + Nouvel administrateur
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
