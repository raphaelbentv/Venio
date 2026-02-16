import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTabState } from '../../hooks/useTabState'
import { apiFetch, getToken } from '../../lib/api'
import type { Project, ProjectSection, ProjectItem, ProjectUpdate, ProjectDocument } from '../../types/project.types'
import ItemCard from '../../components/ItemCard'
import './ClientPortal.css'

const statusClass: Record<string, string> = {
  EN_COURS: 'client-status-active',
  TERMINE: 'client-status-done',
  EN_ATTENTE: 'client-status-pending',
  ANNULE: 'client-status-cancelled',
}

const ClientProjectDetail = () => {
  const { id } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [updates, setUpdates] = useState<ProjectUpdate[]>([])
  const [sections, setSections] = useState<ProjectSection[]>([])
  const [items, setItems] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useTabState('content')

  useEffect(() => {
    const load = async () => {
      try {
        const [projectData, sectionsData, itemsData] = await Promise.all([
          apiFetch<{ project: Project; documents?: ProjectDocument[]; updates?: ProjectUpdate[] }>(`/api/projects/${id}`),
          apiFetch<{ sections: ProjectSection[] }>(`/api/projects/${id}/sections`),
          apiFetch<{ items: ProjectItem[] }>(`/api/projects/${id}/items`),
        ])
        setProject(projectData.project)
        setDocuments(projectData.documents || [])
        setUpdates(projectData.updates || [])
        setSections(sectionsData.sections || [])
        setItems(itemsData.items || [])
      } catch (err: unknown) {
        setError((err as Error).message || 'Erreur chargement projet')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const downloadDocument = async (doc: ProjectDocument) => {
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
    } catch (err: unknown) {
      setError((err as Error).message || 'Telechargement impossible')
    }
  }

  const downloadItem = async (itemId: string, fileName: string) => {
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
    } catch (err: unknown) {
      setError((err as Error).message || 'Téléchargement impossible')
    }
  }

  const getStatusLabel = (status: string) => {
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

  const getItemsBySection = (sectionId: string) => {
    return items.filter((item) => {
      const sec = item.section
      if (!sec) return false
      if (typeof sec === 'string') return sec === sectionId
      return sec._id === sectionId
    })
  }

  const getItemsWithoutSection = () => {
    return items.filter((item) => !item.section)
  }

  return (
    <div className="portal-container client-project-detail">
      {/* Header avec breadcrumb */}
      <div className="client-project-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <Link to="/espace-client" className="client-project-back">
          <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Mes projets</span>
        </Link>
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>/</span>
        <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>
          {project?.name || '...'}
        </span>
      </div>

      {loading && (
        <div className="client-dashboard-loading">
          <div className="client-dashboard-spinner" />
          <p>Chargement du projet…</p>
        </div>
      )}

      {error && (
        <div className="client-dashboard-error">
          <span className="client-dashboard-error-icon">!</span>
          <p>{error}</p>
        </div>
      )}

      {project && (
        <>
          {/* Hero du projet */}
          <div className="client-project-hero">
            <div className="client-project-hero-content">
              <div className="client-project-hero-header">
                <span className="client-project-hero-icon">◈</span>
                <span className={`client-project-hero-badge ${statusClass[project.status] || 'client-status-pending'}`}>
                  {getStatusLabel(project.status)}
                </span>
              </div>
              <h1 className="client-project-hero-title">{project.name}</h1>
              {project.description && (
                <p className="client-project-hero-description">{project.description}</p>
              )}
            </div>
          </div>

          {/* Onglets modernes */}
          <div className="client-project-tabs">
            <button
              className={`client-project-tab ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
            >
              <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
              <span>Contenu</span>
            </button>
            <button
              className={`client-project-tab ${activeTab === 'updates' ? 'active' : ''}`}
              onClick={() => setActiveTab('updates')}
            >
              <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <span>Mises à jour</span>
            </button>
            <button
              className={`client-project-tab ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>Documents</span>
            </button>
          </div>
        </>
      )}

      {/* Contenu des onglets */}
      {activeTab === 'content' && (
        <div className="client-project-content">
          {/* Items sans section */}
          {getItemsWithoutSection().length > 0 && (
            <div className="client-project-section">
              <div className="client-project-items">
                {getItemsWithoutSection().map((item) => (
                  <ItemCard key={item._id} item={item} onDownload={downloadItem} />
                ))}
              </div>
            </div>
          )}

          {/* Sections avec leurs items */}
          {sections.map((section) => (
            <div key={section._id} className="client-project-section">
              <div className="client-project-section-header">
                <h2 className="client-project-section-title">{section.title}</h2>
                {section.description && (
                  <p className="client-project-section-description">{section.description}</p>
                )}
              </div>
              {getItemsBySection(section._id).length === 0 ? (
                <div className="client-project-empty">
                  <span className="client-project-empty-icon">📭</span>
                  <p>Aucun élément dans cette section</p>
                </div>
              ) : (
                <div className="client-project-items">
                  {getItemsBySection(section._id).map((item) => (
                    <ItemCard key={item._id} item={item} onDownload={downloadItem} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {sections.length === 0 && getItemsWithoutSection().length === 0 && (
            <div className="client-project-empty-state">
              <div className="client-project-empty-state-icon">📁</div>
              <h3>Aucun contenu disponible</h3>
              <p>Le contenu du projet sera ajouté ici par votre équipe.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'updates' && (
        <div className="client-project-content">
          {updates.length === 0 ? (
            <div className="client-project-empty-state">
              <div className="client-project-empty-state-icon">📢</div>
              <h3>Aucune mise à jour</h3>
              <p>Les dernières nouvelles de votre projet apparaîtront ici.</p>
            </div>
          ) : (
            <div className="client-project-updates">
              {updates.map((update) => (
                <div key={update._id} className="client-project-update">
                  <div className="client-project-update-date">
                    {new Date(update.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="client-project-update-content">
                    <h3 className="client-project-update-title">{update.title}</h3>
                    <p className="client-project-update-description">{update.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="client-project-content">
          {documents.length === 0 ? (
            <div className="client-project-empty-state">
              <div className="client-project-empty-state-icon">📄</div>
              <h3>Aucun document</h3>
              <p>Les documents liés à votre projet seront disponibles ici.</p>
            </div>
          ) : (
            <div className="client-project-documents">
              {documents.map((doc) => (
                <div key={doc._id} className="client-project-document">
                  <div className="client-project-document-icon">
                    <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div className="client-project-document-info">
                    <h3 className="client-project-document-name">{doc.originalName}</h3>
                    <span className="client-project-document-type">{doc.type}</span>
                  </div>
                  <button
                    className="client-project-document-button"
                    type="button"
                    onClick={() => downloadDocument(doc)}
                  >
                    <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Télécharger
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ClientProjectDetail
