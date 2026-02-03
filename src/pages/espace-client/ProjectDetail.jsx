import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch, getToken } from '../../lib/api'
import './ClientPortal.css'
import '../admin/AdminPortal.css'

const ClientProjectDetail = () => {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [documents, setDocuments] = useState([])
  const [updates, setUpdates] = useState([])
  const [sections, setSections] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('content')

  useEffect(() => {
    const load = async () => {
      try {
        const [projectData, sectionsData, itemsData] = await Promise.all([
          apiFetch(`/api/projects/${id}`),
          apiFetch(`/api/projects/${id}/sections`),
          apiFetch(`/api/projects/${id}/items`),
        ])
        setProject(projectData.project)
        setDocuments(projectData.documents || [])
        setUpdates(projectData.updates || [])
        setSections(sectionsData.sections || [])
        setItems(itemsData.items || [])
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

  const downloadItem = async (itemId, fileName) => {
    try {
      const token = getToken()
      const response = await fetch(`/api/projects/${id}/items/${itemId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Téléchargement impossible')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message || 'Téléchargement impossible')
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'EN_COURS':
        return 'En cours'
      case 'EN_ATTENTE':
        return 'En attente'
      case 'TERMINE':
        return 'Terminé'
      default:
        return status
    }
  }

  const getItemTypeLabel = (type) => {
    const labels = {
      LIVRABLE: 'Livrable',
      DEVIS: 'Devis',
      FACTURE: 'Facture',
      CONTRAT: 'Contrat',
      CAHIER_DES_CHARGES: 'Cahier des charges',
      MAQUETTE: 'Maquette',
      DOCUMENTATION: 'Documentation',
      LIEN: 'Lien',
      NOTE: 'Note',
      AUTRE: 'Autre',
    }
    return labels[type] || type
  }

  const getItemsBySection = (sectionId) => {
    return items.filter((item) => item.section?._id === sectionId || item.section === sectionId)
  }

  const getItemsWithoutSection = () => {
    return items.filter((item) => !item.section)
  }

  const getItemIcon = (type) => {
    const icons = {
      LIVRABLE: '📦',
      DEVIS: '💰',
      FACTURE: '🧾',
      CONTRAT: '📝',
      CAHIER_DES_CHARGES: '📋',
      MAQUETTE: '🎨',
      DOCUMENTATION: '📚',
      LIEN: '🔗',
      NOTE: '📌',
      AUTRE: '📄',
    }
    return icons[type] || '📄'
  }

  const normalizeUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    return `https://${url}`
  }

  return (
    <div className="portal-container">
      <div className="portal-card">
        <div className="admin-breadcrumb">
          <Link to="/espace-client">Mes projets</Link>
          <span>/</span>
          <span style={{ color: '#ffffff' }}>{project?.name || 'Projet'}</span>
        </div>
        {loading && <p>Chargement...</p>}
        {error && <div className="admin-error">{error}</div>}
        {project && (
          <>
            <h1 style={{ marginBottom: '8px' }}>{project.name}</h1>
            {project.description && (
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '12px' }}>
                {project.description}
              </p>
            )}
            <span className="portal-badge">{getStatusLabel(project.status)}</span>
          </>
        )}
      </div>

      {/* Onglets */}
      <div className="admin-tabs" style={{ marginTop: 24 }}>
        <button
          className={`admin-tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          Contenu du projet
        </button>
        <button
          className={`admin-tab ${activeTab === 'updates' ? 'active' : ''}`}
          onClick={() => setActiveTab('updates')}
        >
          Mises à jour
        </button>
        <button
          className={`admin-tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'content' && (
        <div style={{ marginTop: 24 }}>
          {/* Items sans section */}
          {getItemsWithoutSection().length > 0 && (
            <div className="portal-card" style={{ marginBottom: 24 }}>
              <div className="portal-list">
                    {getItemsWithoutSection().map((item) => (
                  <div key={item._id} className="admin-list-item">
                    <div className="admin-list-item-content">
                      <h3 className="admin-list-item-title">
                        {getItemIcon(item.type)} {item.title}
                      </h3>
                      {item.description && (
                        <p className="admin-list-item-subtitle">{item.description}</p>
                      )}
                          {item.type === 'NOTE' && item.content && (
                            <p className="admin-list-item-subtitle" style={{ marginTop: '8px' }}>
                              {item.content}
                            </p>
                          )}
                      <div style={{ marginTop: '8px' }}>
                        <span className="portal-badge">{getItemTypeLabel(item.type)}</span>
                      </div>
                    </div>
                        <div className="admin-list-item-actions">
                          {item.type === 'LIEN' && item.url && (
                            <a
                              className="portal-button"
                              href={normalizeUrl(item.url)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              🔗 Ouvrir
                            </a>
                          )}
                          {item.file && item.isDownloadable && (
                            <button
                              className="portal-button"
                              onClick={() => downloadItem(item._id, item.file.originalName)}
                            >
                              📥 Télécharger
                            </button>
                          )}
                        </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sections avec leurs items */}
          {sections.map((section) => (
            <div key={section._id} className="portal-card" style={{ marginBottom: 24 }}>
              <h2 style={{ marginBottom: '8px' }}>{section.title}</h2>
              {section.description && (
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 16 }}>
                  {section.description}
                </p>
              )}
              <div className="portal-list">
                {getItemsBySection(section._id).length === 0 ? (
                  <div className="admin-empty-state" style={{ padding: '24px' }}>
                    <p className="admin-empty-state-text">Aucun élément dans cette section</p>
                  </div>
                ) : (
                  getItemsBySection(section._id).map((item) => (
                    <div key={item._id} className="admin-list-item">
                      <div className="admin-list-item-content">
                        <h3 className="admin-list-item-title">
                          {getItemIcon(item.type)} {item.title}
                        </h3>
                        {item.description && (
                          <p className="admin-list-item-subtitle">{item.description}</p>
                        )}
                        {item.type === 'NOTE' && item.content && (
                          <p className="admin-list-item-subtitle" style={{ marginTop: '8px' }}>
                            {item.content}
                          </p>
                        )}
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="portal-badge">{getItemTypeLabel(item.type)}</span>
                          {item.file && (
                            <span className="portal-badge">
                              📎 {item.file.originalName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="admin-list-item-actions">
                        {item.type === 'LIEN' && item.url && (
                          <a
                            className="portal-button"
                            href={normalizeUrl(item.url)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            🔗 Ouvrir
                          </a>
                        )}
                        {item.file && item.isDownloadable && (
                          <button
                            className="portal-button"
                            onClick={() => downloadItem(item._id, item.file.originalName)}
                          >
                            📥 Télécharger
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}

          {sections.length === 0 && getItemsWithoutSection().length === 0 && (
            <div className="portal-card">
              <div className="admin-empty-state" style={{ padding: '48px' }}>
                <div className="admin-empty-state-icon">📁</div>
                <p className="admin-empty-state-text">Aucun contenu disponible pour le moment</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'updates' && (
        <div className="portal-card" style={{ marginTop: 24 }}>
          <h2>Mises à jour du projet</h2>
          <div className="portal-list" style={{ marginTop: 16 }}>
            {updates.length === 0 ? (
              <div className="admin-empty-state" style={{ padding: '24px' }}>
                <p className="admin-empty-state-text">Aucune mise à jour pour le moment</p>
              </div>
            ) : (
              updates.map((update) => (
                <div key={update._id} className="admin-update-item">
                  <strong>{update.title}</strong>
                  <p>{update.description}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '8px' }}>
                    {new Date(update.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="portal-card" style={{ marginTop: 24 }}>
          <h2>Documents</h2>
          <div className="portal-list" style={{ marginTop: 16 }}>
            {documents.length === 0 ? (
              <div className="admin-empty-state" style={{ padding: '24px' }}>
                <p className="admin-empty-state-text">Aucun document pour le moment</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc._id} className="admin-document-item">
                  <div style={{ flex: 1 }}>
                    <strong>{doc.originalName}</strong>
                    <p>
                      <span className="portal-badge">{doc.type}</span>
                    </p>
                  </div>
                  <button
                    className="portal-button secondary"
                    type="button"
                    onClick={() => downloadDocument(doc)}
                  >
                    📥 Télécharger
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientProjectDetail
