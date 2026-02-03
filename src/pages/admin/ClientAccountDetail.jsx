import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import '../espace-client/ClientPortal.css'
import './AdminPortal.css'

const ClientAccountDetail = () => {
  const { userId } = useParams()
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [error, setError] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [userRes, projectsRes] = await Promise.all([
          apiFetch(`/api/admin/users/${userId}`),
          apiFetch(`/api/admin/users/${userId}/projects?archived=${showArchived}`),
        ])
        setUser(userRes.user)
        setProjects(projectsRes.projects || [])
      } catch (err) {
        setError(err.message || 'Erreur chargement compte')
      }
    }
    load()
  }, [userId, showArchived])

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'EN_COURS':
        return 'status-en-cours'
      case 'EN_ATTENTE':
        return 'status-en-attente'
      case 'TERMINE':
        return 'status-termine'
      default:
        return ''
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'EN_COURS':
        return 'En cours'
      case 'EN_ATTENTE':
        return 'En attente'
      case 'TERMINE':
        return 'Terminé'
      default:
        return status
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
          <span style={{ color: '#ffffff' }}>{user?.name || 'Chargement...'}</span>
        </div>
        {user && (
          <>
            <div className="admin-header">
              <div>
                <h1 style={{ marginBottom: '8px' }}>{user.name}</h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>{user.email}</p>
              </div>
              <div className="admin-actions">
                <Link className="portal-button" to={`/admin/projets/nouveau?clientId=${userId}`}>
                  + Ajouter un projet
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="admin-error" style={{ marginTop: 24 }}>
          {error}
        </div>
      )}

      <div className="portal-card" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Projets du client</h2>
          <div className="admin-tabs" style={{ margin: 0, border: 'none', padding: 0 }}>
            <button
              type="button"
              className={`admin-tab ${!showArchived ? 'active' : ''}`}
              onClick={() => setShowArchived(false)}
              style={{ borderBottomWidth: 2 }}
            >
              Actifs
            </button>
            <button
              type="button"
              className={`admin-tab ${showArchived ? 'active' : ''}`}
              onClick={() => setShowArchived(true)}
              style={{ borderBottomWidth: 2 }}
            >
              Archivés
            </button>
          </div>
        </div>
        {projects.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-state-icon">📁</div>
            <p className="admin-empty-state-text">Aucun projet pour ce client</p>
          </div>
        ) : (
          <div className="admin-list">
            {projects.map((project) => (
              <div key={project._id} className="admin-list-item">
                <div className="admin-list-item-content">
                  <h3 className="admin-list-item-title">
                    {project.name}
                    {showArchived && project.isArchived && (
                      <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>Archivé</span>
                    )}
                  </h3>
                  <div style={{ marginTop: '8px' }}>
                    <span className={`admin-badge ${getStatusBadgeClass(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                </div>
                <div className="admin-list-item-actions">
                  <Link className="portal-button secondary" to={`/admin/projets/${project._id}`}>
                    Voir projet
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientAccountDetail
