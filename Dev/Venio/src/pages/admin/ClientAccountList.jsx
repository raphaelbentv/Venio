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
        <h1>Comptes clients</h1>
        <div className="admin-actions">
          <Link className="portal-link" to="/admin/comptes-clients/nouveau">
            Nouveau compte client
          </Link>
          <Link className="portal-link" to="/admin">
            Retour admin
          </Link>
        </div>
      </div>

      <div className="portal-card" style={{ marginTop: 24 }}>
        {error && <p>{error}</p>}
        <div className="portal-list">
          {clients.map((client) => (
            <div key={client._id}>
              <strong>{client.name}</strong>
              <p>{client.email}</p>
              <Link className="portal-link" to={`/admin/comptes-clients/${client._id}`}>
                Voir compte
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ClientAccountList
