import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import './ClientPortal.css'

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
    <div className="portal-container">
      <div className="portal-card">
        <h1>Mes projets</h1>
        <p>Compte : {user?.name}</p>
        <button className="portal-button secondary" onClick={logout} type="button">
          Se deconnecter
        </button>
      </div>

      <div className="portal-card" style={{ marginTop: 24 }}>
        {loading && <p>Chargement...</p>}
        {error && <p>{error}</p>}
        {!loading && !error && (
          <div className="portal-grid">
            {projects.map((project) => (
              <div key={project._id} className="portal-card">
                <h3>{project.name}</h3>
                <p>{project.description || 'Aucune description'}</p>
                <span className="portal-badge">{project.status}</span>
                <div style={{ marginTop: 12 }}>
                  <Link className="portal-link" to={`/espace-client/projets/${project._id}`}>
                    Voir le detail
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

export default ClientDashboard
