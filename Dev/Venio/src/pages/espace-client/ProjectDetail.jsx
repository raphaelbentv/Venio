import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch, getToken } from '../../lib/api'
import './ClientPortal.css'

const ClientProjectDetail = () => {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [documents, setDocuments] = useState([])
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch(`/api/projects/${id}`)
        setProject(data.project)
        setDocuments(data.documents || [])
        setUpdates(data.updates || [])
      } catch (err) {
        setError(err.message || 'Erreur chargement projet')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const downloadDocument = async (doc) => {
    try {
      const token = getToken()
      const response = await fetch(`/api/documents/${doc._id}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Telechargement impossible')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = doc.originalName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message || 'Telechargement impossible')
    }
  }

  return (
    <div className="portal-container">
      <div className="portal-card">
        <Link className="portal-link" to="/espace-client">
          Retour
        </Link>
        {loading && <p>Chargement...</p>}
        {error && <p>{error}</p>}
        {project && (
          <>
            <h1>{project.name}</h1>
            <p>{project.description || 'Aucune description'}</p>
            <span className="portal-badge">{project.status}</span>
          </>
        )}
      </div>

      <div className="portal-grid" style={{ marginTop: 24 }}>
        <div className="portal-card">
          <h2>Mises a jour</h2>
          {updates.length === 0 && <p>Aucune mise a jour pour le moment.</p>}
          <div className="portal-list">
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
          {documents.length === 0 && <p>Aucun document pour le moment.</p>}
          <div className="portal-list">
            {documents.map((doc) => (
              <div key={doc._id}>
                <strong>{doc.originalName}</strong>
                <p>{doc.type}</p>
                <button
                  className="portal-button secondary"
                  type="button"
                  onClick={() => downloadDocument(doc)}
                >
                  Telecharger
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientProjectDetail
