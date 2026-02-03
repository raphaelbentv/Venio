import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import '../espace-client/ClientPortal.css'
import './AdminPortal.css'

const ClientAccountList = () => {
  const [clients, setClients] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/api/admin/users?role=CLIENT')
        setClients(data.users || [])
      } catch (err) {
        setError(err.message || 'Erreur chargement comptes')
      }
    }
    load()
  }, [])

  return (
    <div className="portal-container">
      <div className="portal-card">
        <div className="admin-breadcrumb">
          <Link to="/admin">Admin</Link>
          <span>/</span>
          <span style={{ color: '#ffffff' }}>Comptes clients</span>
        </div>
        <div className="admin-header">
          <h1>Comptes clients</h1>
          <div className="admin-actions">
            <Link className="portal-button" to="/admin/comptes-clients/nouveau">
              + Nouveau compte
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
        {clients.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-state-icon">👥</div>
            <p className="admin-empty-state-text">Aucun compte client</p>
          </div>
        ) : (
          <div className="admin-list">
            {clients.map((client) => (
              <div key={client._id} className="admin-list-item">
                <div className="admin-list-item-content">
                  <h3 className="admin-list-item-title">{client.name}</h3>
                  <p className="admin-list-item-subtitle">{client.email}</p>
                </div>
                <div className="admin-list-item-actions">
                  <Link className="portal-button secondary" to={`/admin/comptes-clients/${client._id}`}>
                    Voir détails
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

export default ClientAccountList
