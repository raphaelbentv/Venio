import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import './ClientPortal.css'

const statusLabels = {
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  EN_ATTENTE: 'En attente',
  ANNULE: 'Annulé',
}

const statusClass = {
  EN_COURS: 'client-status-active',
  TERMINE: 'client-status-done',
  EN_ATTENTE: 'client-status-pending',
  ANNULE: 'client-status-cancelled',
}

const ClientDashboard = () => {
  const { user, logout } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/api/projects')
        setProjects(data.projects || [])
      } catch (err) {
        setError(err.message || 'Erreur chargement projets')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="portal-container client-dashboard">
      <header className="client-dashboard-header">
        <div className="client-dashboard-header-inner">
          <div className="client-dashboard-brand">
            <span className="client-dashboard-brand-icon">◉</span>
            <span className="client-dashboard-brand-text">Espace client</span>
          </div>
          <div className="client-dashboard-user">
            <span className="client-dashboard-user-name">{user?.name}</span>
            <button
              className="portal-button client-dashboard-logout"
              onClick={logout}
              type="button"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <section className="client-dashboard-hero">
        <h1 className="client-dashboard-title">
          Bonjour, {user?.name?.split(' ')[0] || 'vous'}
        </h1>
        <p className="client-dashboard-subtitle">
          Retrouvez ici vos projets et les documents associés.
        </p>
      </section>

      {loading && (
        <div className="client-dashboard-loading">
          <div className="client-dashboard-spinner" />
          <p>Chargement de vos projets…</p>
        </div>
      )}

      {error && (
        <div className="client-dashboard-error">
          <span className="client-dashboard-error-icon">!</span>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="client-dashboard-stats">
            <div className="client-dashboard-stat">
              <span className="client-dashboard-stat-value">{projects.length}</span>
              <span className="client-dashboard-stat-label">
                {projects.length <= 1 ? 'projet' : 'projets'}
              </span>
            </div>
          </div>

          <section className="client-dashboard-projects">
            <h2 className="client-dashboard-section-title">Mes projets</h2>

            {projects.length === 0 ? (
              <div className="client-dashboard-empty">
                <div className="client-dashboard-empty-icon">📁</div>
                <h3>Aucun projet pour le moment</h3>
                <p>Vos projets apparaîtront ici dès qu’ils seront partagés avec vous.</p>
              </div>
            ) : (
              <div className="client-dashboard-grid">
                {projects.map((project) => (
                  <Link
                    key={project._id}
                    to={`/espace-client/projets/${project._id}`}
                    className="client-project-card"
                  >
                    <div className="client-project-card-header">
                      <span className="client-project-card-icon">◈</span>
                      <span
                        className={`client-project-card-badge ${statusClass[project.status] || 'client-status-pending'}`}
                      >
                        {statusLabels[project.status] || project.status}
                      </span>
                    </div>
                    <h3 className="client-project-card-title">{project.name}</h3>
                    <p className="client-project-card-desc">
                      {project.description || 'Aucune description'}
                    </p>
                    <span className="client-project-card-cta">
                      Voir le détail
                      <span className="client-project-card-cta-arrow">→</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default ClientDashboard
