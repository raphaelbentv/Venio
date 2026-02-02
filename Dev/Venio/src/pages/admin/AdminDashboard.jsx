import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import '../espace-client/ClientPortal.css'
import './AdminPortal.css'

const AdminDashboard = () => {
  const { logout } = useAuth()
  const [clientCount, setClientCount] = useState(0)
  const [projectCount, setProjectCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const users = await apiFetch('/api/admin/users?role=CLIENT')
        const projects = await apiFetch('/api/admin/projects')
        setClientCount(users.users?.length || 0)
        setProjectCount(projects.projects?.length || 0)
      } catch (err) {
        // Silent for dashboard
      }
    }
    load()
  }, [])

  return (
    <div className="portal-container">
      <div className="portal-card">
        <h1>Admin</h1>
        <div className="admin-actions">
          <Link className="portal-link" to="/admin/comptes-clients">
            Comptes clients
          </Link>
          <Link className="portal-link" to="/admin/projets/nouveau">
            Nouveau projet
          </Link>
          <button className="portal-button secondary" onClick={logout} type="button">
            Se deconnecter
          </button>
        </div>
      </div>

      <div className="portal-grid" style={{ marginTop: 24 }}>
        <div className="portal-card">
          <h3>Comptes clients</h3>
          <p>{clientCount} comptes</p>
        </div>
        <div className="portal-card">
          <h3>Projets</h3>
          <p>{projectCount} projets</p>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
