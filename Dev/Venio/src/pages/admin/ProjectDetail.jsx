import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch, getToken } from '../../lib/api'
import '../espace-client/ClientPortal.css'
import './AdminPortal.css'

const AdminProjectDetail = () => {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [documents, setDocuments] = useState([])
  const [updates, setUpdates] = useState([])
  const [form, setForm] = useState({ name: '', description: '', status: '' })
  const [updateForm, setUpdateForm] = useState({ title: '', description: '' })
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [projectRes, documentsRes, updatesRes] = await Promise.all([
        apiFetch(`/api/admin/projects/${id}`),
        apiFetch(`/api/admin/projects/${id}/documents`),
        apiFetch(`/api/admin/projects/${id}/updates`),
      ])
      setProject(projectRes.project)
      setDocuments(documentsRes.documents || [])
      setUpdates(updatesRes.updates || [])
      setForm({
        name: projectRes.project.name,
        description: projectRes.project.description || '',
        status: projectRes.project.status,
      })
    } catch (err) {
      setError(err.message || 'Erreur chargement projet')
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const handleSave = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const data = await apiFetch(`/api/admin/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      })
      setProject(data.project)
    } catch (err) {
      setError(err.message || 'Erreur mise a jour')
    }
  }

  const handleAddUpdate = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await apiFetch(`/api/admin/projects/${id}/updates`, {
        method: 'POST',
        body: JSON.stringify(updateForm),
      })
      setUpdateForm({ title: '', description: '' })
      await load()
    } catch (err) {
      setError(err.message || 'Erreur ajout mise a jour')
    }
  }

  const handleUpload = async (event) => {
    event.preventDefault()
    setError('')
    const formData = new FormData(event.target)
    try {
      const token = getToken()
      const response = await fetch(`/api/admin/projects/${id}/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur upload')
      }
      await load()
      event.target.reset()
    } catch (err) {
      setError(err.message || 'Erreur upload')
    }
  }

  return (
    <div className="portal-container">
      <div className="portal-card">
        <Link className="portal-link" to="/admin">
          Retour admin
        </Link>
        {project && <h1>{project.name}</h1>}
      </div>

      {error && (
        <div className="portal-card" style={{ marginTop: 24 }}>
          <p>{error}</p>
        </div>
      )}

      <div className="portal-grid" style={{ marginTop: 24 }}>
        <div className="portal-card">
          <h2>Details projet</h2>
          <form className="portal-list" onSubmit={handleSave}>
            <input
              className="portal-input"
              placeholder="Nom"
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
            <button className="portal-button" type="submit">
              Enregistrer
            </button>
          </form>
        </div>

        <div className="portal-card">
          <h2>Ajouter une mise a jour</h2>
          <form className="portal-list" onSubmit={handleAddUpdate}>
            <input
              className="portal-input"
              placeholder="Titre"
              value={updateForm.title}
              onChange={(event) => setUpdateForm({ ...updateForm, title: event.target.value })}
              required
            />
            <input
              className="portal-input"
              placeholder="Description"
              value={updateForm.description}
              onChange={(event) => setUpdateForm({ ...updateForm, description: event.target.value })}
            />
            <button className="portal-button secondary" type="submit">
              Ajouter
            </button>
          </form>
          <div className="portal-list" style={{ marginTop: 16 }}>
            {updates.length === 0 && <p>Aucune mise a jour.</p>}
            {updates.map((update) => (
              <div key={update._id}>
                <strong>{update.title}</strong>
                <p>{update.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="portal-card">
          <h2>Documents</h2>
          <form className="portal-list" onSubmit={handleUpload}>
            <select className="portal-input" name="type" required>
              <option value="">Type document</option>
              <option value="DEVIS">Devis</option>
              <option value="FACTURE">Facture</option>
              <option value="FICHIER_PROJET">Fichier projet</option>
            </select>
            <input className="portal-input" type="file" name="file" required />
            <button className="portal-button secondary" type="submit">
              Televerser
            </button>
          </form>
          <div className="portal-list" style={{ marginTop: 16 }}>
            {documents.map((doc) => (
              <div key={doc._id}>
                <strong>{doc.originalName}</strong>
                <p>{doc.type}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminProjectDetail
