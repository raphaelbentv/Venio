import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import '../espace-client/ClientPortal.css'

const ProjectForm = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [clients, setClients] = useState([])
  const [form, setForm] = useState({
    clientId: searchParams.get('clientId') || '',
    name: '',
    description: '',
    status: 'EN_COURS',
  })
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const data = await apiFetch('/api/admin/projects', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      navigate(`/admin/projets/${data.project._id}`)
    } catch (err) {
      setError(err.message || 'Erreur creation projet')
    }
  }

  return (
    <div className="portal-container">
      <div className="portal-card">
        <h1>Nouveau projet</h1>
        <Link className="portal-link" to="/admin">
          Retour admin
        </Link>
      </div>

      <div className="portal-card" style={{ marginTop: 24 }}>
        <form className="portal-list" onSubmit={handleSubmit}>
          <select
            className="portal-input"
            value={form.clientId}
            onChange={(event) => setForm({ ...form, clientId: event.target.value })}
            required
          >
            <option value="">Choisir un compte client</option>
            {clients.map((client) => (
              <option key={client._id} value={client._id}>
                {client.name} - {client.email}
              </option>
            ))}
          </select>
          <input
            className="portal-input"
            placeholder="Nom du projet"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <input
            className="portal-input"
            placeholder="Description"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <select
            className="portal-input"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          >
            <option value="EN_COURS">En cours</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="TERMINE">Termine</option>
          </select>
          {error && <p>{error}</p>}
          <button className="portal-button" type="submit">
            Creer le projet
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProjectForm
