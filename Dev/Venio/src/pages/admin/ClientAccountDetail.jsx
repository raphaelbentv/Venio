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

  useEffect(() => {
    const load = async () => {
      try {
        const [userRes, projectsRes] = await Promise.all([
          apiFetch(`/api/admin/users/${userId}`),
          apiFetch(`/api/admin/users/${userId}/projects`),
        ])
        setUser(userRes.user)
        setProjects(projectsRes.projects || [])
      } catch (err) {
        setError(err.message || 'Erreur chargement compte')
      }
    }
    load()
  }, [userId])

  return (
    <div className="portal-container">
      <div className="portal-card">
        <Link className="portal-link" to="/admin/comptes-clients">
          Retour comptes
        </Link>
        {user && (
          <>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
          </>
        )}
        <div className="admin-actions">
          <Link className="portal-link" to={`/admin/projets/nouveau?clientId=${userId}`}>
            Ajouter un projet
          </Link>
        </div>
      </div>

      <div className="portal-card" style={{ marginTop: 24 }}>
        {error && <p>{error}</p>}
        <div className="portal-list">
          {projects.map((project) => (
            <div key={project._id}>
              <strong>{project.name}</strong>
              <p>{project.status}</p>
              <Link className="portal-link" to={`/admin/projets/${project._id}`}>
                Voir projet
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ClientAccountDetail
