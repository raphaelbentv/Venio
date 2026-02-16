import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import type { Project } from '../../types/project.types'
import './ClientPortal.css'

const statusLabels: Record<string, string> = {
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  EN_ATTENTE: 'En attente',
  ANNULE: 'Annulé',
}

const statusClass: Record<string, string> = {
  EN_COURS: 'client-status-active',
  TERMINE: 'client-status-done',
  EN_ATTENTE: 'client-status-pending',
  ANNULE: 'client-status-cancelled',
}

const ClientDashboard = () => {
  const { user, logout } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<{ projects: Project[] }>('/api/projects')
        setProjects(data.projects || [])
      } catch (err: unknown) {
        setError((err as Error).message || 'Erreur chargement projets')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const activeProjects = projects.filter(p => p.status === 'EN_COURS')
  const completedProjects = projects.filter(p => p.status === 'TERMINE')
  const pendingProjects = projects.filter(p => p.status === 'EN_ATTENTE')

  return (
    <div className="portal-container client-dashboard">
      <header className="client-dashboard-header">
        <div className="client-dashboard-header-inner">
          <div className="client-dashboard-brand">
            <span className="client-dashboard-brand-icon">◉</span>
            <span className="client-dashboard-brand-text">Espace client</span>
          </div>
          <div className="client-dashboard-user portal-actions-reveal">
            <span className="client-dashboard-user-name">{user?.name}</span>
            <button
              className="portal-button client-dashboard-logout portal-action-link"
              onClick={logout}
              type="button"
              title="Déconnexion"
            >
              <span className="portal-action-icon" aria-hidden>
                <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>
              <span className="portal-action-label">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <section className="client-dashboard-hero">
        <div className="client-dashboard-hero-content">
          <h1 className="client-dashboard-title">
            Bonjour, {user?.name?.split(' ')[0] || 'vous'} 👋
          </h1>
          <p className="client-dashboard-subtitle">
            Retrouvez ici vos projets et les documents associés.
          </p>
        </div>
        <div className="client-dashboard-hero-decoration">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M45.3,-58.8C57.5,-48.2,65.4,-32.7,68.9,-16.3C72.4,0.1,71.5,17.4,64.3,31.8C57.1,46.2,43.6,57.7,28.3,63.8C13,69.9,-4.1,70.6,-20.3,66.3C-36.5,62,-51.8,52.7,-61.3,39.3C-70.8,25.9,-74.5,8.4,-72.3,-8.2C-70.1,-24.8,-62,-40.5,-49.8,-51.1C-37.6,-61.7,-21.2,-67.2,-3.8,-62.5C13.6,-57.8,33.1,-69.4,45.3,-58.8Z" transform="translate(100 100)" />
          </svg>
        </div>
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
              <div className="client-dashboard-stat-icon">
                <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="client-dashboard-stat-content">
                <span className="client-dashboard-stat-value">{projects.length}</span>
                <span className="client-dashboard-stat-label">
                  {projects.length <= 1 ? 'projet total' : 'projets totaux'}
                </span>
              </div>
            </div>
            <div className="client-dashboard-stat">
              <div className="client-dashboard-stat-icon active">
                <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="client-dashboard-stat-content">
                <span className="client-dashboard-stat-value">{activeProjects.length}</span>
                <span className="client-dashboard-stat-label">en cours</span>
              </div>
            </div>
            <div className="client-dashboard-stat">
              <div className="client-dashboard-stat-icon done">
                <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="client-dashboard-stat-content">
                <span className="client-dashboard-stat-value">{completedProjects.length}</span>
                <span className="client-dashboard-stat-label">terminés</span>
              </div>
            </div>
            <div className="client-dashboard-stat">
              <div className="client-dashboard-stat-icon pending">
                <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="client-dashboard-stat-content">
                <span className="client-dashboard-stat-value">{pendingProjects.length}</span>
                <span className="client-dashboard-stat-label">en attente</span>
              </div>
            </div>
          </div>

          <section className="client-dashboard-projects">
            <div className="client-dashboard-section-header">
              <h2 className="client-dashboard-section-title">Mes projets</h2>
              <p className="client-dashboard-section-subtitle">
                Suivez l'avancement de vos projets en temps réel
              </p>
            </div>

            {projects.length === 0 ? (
              <div className="client-dashboard-empty">
                <div className="client-dashboard-empty-icon">📁</div>
                <h3>Aucun projet pour le moment</h3>
                <p>Vos projets apparaîtront ici dès qu'ils seront partagés avec vous.</p>
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
                    {project.summary && (
                      <p className="client-project-card-summary">{project.summary}</p>
                    )}
                    <p className="client-project-card-desc">
                      {project.description || 'Aucune description'}
                    </p>
                    {project.serviceTypes && project.serviceTypes.length > 0 && (
                      <div className="client-project-card-tags">
                        {project.serviceTypes.slice(0, 3).map((service, idx) => (
                          <span key={idx} className="client-project-card-tag">{service}</span>
                        ))}
                        {project.serviceTypes.length > 3 && (
                          <span className="client-project-card-tag-more">+{project.serviceTypes.length - 3}</span>
                        )}
                      </div>
                    )}
                    <div className="client-project-card-footer">
                      <span className="client-project-card-cta">
                        Voir le détail
                        <span className="client-project-card-cta-arrow">→</span>
                      </span>
                    </div>
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
