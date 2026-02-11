import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  archiveAdminClient,
  createAdminClientContact,
  createAdminClientNote,
  getAdminClient,
  getAdminClientBillingSummary,
  getAdminClientProgress,
  listAdminClientActivities,
  listAdminClientBillingDocuments,
  listAdminClientContacts,
  listAdminClientDeliverables,
  listAdminClientNotes,
  listAdminClientProjects,
  reactivateAdminClient,
  updateAdminClient,
  deleteAdminClientContact,
  deleteAdminClientNote,
} from '../../services/adminClients'
import {
  listCloudFiles,
  createCloudFolder,
  uploadCloudFile,
  getCloudDownloadUrl,
  deleteCloudItem,
} from '../../services/adminCloud'
import { getToken } from '../../lib/api'
import '../espace-client/ClientPortal.css'
import './AdminPortal.css'

const TABS = [
  { id: 'overview', label: "Vue d'ensemble" },
  { id: 'projects', label: 'Projets' },
  { id: 'deliverables', label: 'Livrables' },
  { id: 'cloud', label: 'Documents Cloud' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'notes', label: 'Notes & Activités' },
  { id: 'billing', label: 'Facturation' },
]

const STATUS_OPTIONS = ['PROSPECT', 'ACTIF', 'EN_PAUSE', 'CLOS', 'ARCHIVE']
const HEALTH_OPTIONS = ['BON', 'ATTENTION', 'CRITIQUE']

const ClientAccountDetail = () => {
  const { user } = useAuth()
  const { userId } = useParams()

  const [activeTab, setActiveTab] = useState('overview')
  const [client, setClient] = useState(null)
  const [projects, setProjects] = useState([])
  const [progress, setProgress] = useState(null)
  const [deliverables, setDeliverables] = useState([])
  const [contacts, setContacts] = useState([])
  const [notes, setNotes] = useState([])
  const [activities, setActivities] = useState([])
  const [billingSummary, setBillingSummary] = useState(null)
  const [billingDocuments, setBillingDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [contactDraft, setContactDraft] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [noteDraft, setNoteDraft] = useState('')

  // Cloud tab state
  const [cloudItems, setCloudItems] = useState([])
  const [cloudPath, setCloudPath] = useState('')
  const [cloudLoading, setCloudLoading] = useState(false)
  const [cloudError, setCloudError] = useState('')
  const [cloudSuccess, setCloudSuccess] = useState('')
  const [showCloudNewFolder, setShowCloudNewFolder] = useState(false)
  const [cloudNewFolderName, setCloudNewFolderName] = useState('')
  const [cloudCreating, setCloudCreating] = useState(false)
  const [cloudUploading, setCloudUploading] = useState(false)
  const [cloudConfirmDelete, setCloudConfirmDelete] = useState(null)
  const [cloudDeleting, setCloudDeleting] = useState(false)
  const cloudFileInputRef = useRef(null)

  const canArchive = user?.role === 'SUPER_ADMIN'

  const loadAll = async () => {
    setLoading(true)
    setError('')
    try {
      const [
        clientRes,
        projectsRes,
        progressRes,
        deliverablesRes,
        contactsRes,
        notesRes,
        activitiesRes,
        billingSummaryRes,
        billingDocumentsRes,
      ] = await Promise.all([
        getAdminClient(userId),
        listAdminClientProjects(userId),
        getAdminClientProgress(userId),
        listAdminClientDeliverables(userId),
        listAdminClientContacts(userId),
        listAdminClientNotes(userId),
        listAdminClientActivities(userId),
        getAdminClientBillingSummary(userId),
        listAdminClientBillingDocuments(userId),
      ])

      setClient(clientRes.client || null)
      setProjects(projectsRes.projects || [])
      setProgress(progressRes || null)
      setDeliverables(deliverablesRes.deliverables || [])
      setContacts(contactsRes.contacts || [])
      setNotes(notesRes.notes || [])
      setActivities(activitiesRes.activities || [])
      setBillingSummary(billingSummaryRes.summary || null)
      setBillingDocuments(billingDocumentsRes.documents || [])
    } catch (err) {
      setError(err.message || 'Erreur chargement compte')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [userId])

  const notesAndActivities = useMemo(() => {
    const fromNotes = notes.map((note) => ({
      _id: `note-${note._id}`,
      createdAt: note.createdAt,
      label: note.content,
      type: 'NOTE',
      actor: note.createdBy?.name || 'Admin',
      pinned: Boolean(note.pinned),
      rawId: note._id,
    }))

    const fromActivities = activities.map((activity) => ({
      _id: `activity-${activity._id}`,
      createdAt: activity.createdAt,
      label: activity.label,
      type: activity.type,
      actor: activity.actorId?.name || 'System',
      pinned: false,
      rawId: activity._id,
    }))

    return [...fromNotes, ...fromActivities].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [notes, activities])

  const saveClientPatch = async (patch) => {
    setSaving(true)
    setError('')
    try {
      const data = await updateAdminClient(userId, patch)
      setClient(data.client)
    } catch (err) {
      setError(err.message || 'Erreur mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const handleArchiveToggle = async () => {
    if (!canArchive) return
    setSaving(true)
    setError('')
    try {
      const data = client?.status === 'ARCHIVE' ? await reactivateAdminClient(userId) : await archiveAdminClient(userId)
      setClient(data.client)
      await loadAll()
    } catch (err) {
      setError(err.message || 'Erreur archivage')
    } finally {
      setSaving(false)
    }
  }

  const addContact = async (event) => {
    event.preventDefault()
    if (!contactDraft.firstName.trim()) return
    setSaving(true)
    setError('')
    try {
      await createAdminClientContact(userId, { ...contactDraft, isMain: contacts.length === 0 })
      setContactDraft({ firstName: '', lastName: '', email: '', phone: '' })
      const data = await listAdminClientContacts(userId)
      setContacts(data.contacts || [])
    } catch (err) {
      setError(err.message || 'Erreur ajout contact')
    } finally {
      setSaving(false)
    }
  }

  const removeContact = async (contactId) => {
    setSaving(true)
    setError('')
    try {
      await deleteAdminClientContact(userId, contactId)
      setContacts((current) => current.filter((contact) => contact._id !== contactId))
    } catch (err) {
      setError(err.message || 'Erreur suppression contact')
    } finally {
      setSaving(false)
    }
  }

  const addNote = async (event) => {
    event.preventDefault()
    if (!noteDraft.trim()) return
    setSaving(true)
    setError('')
    try {
      await createAdminClientNote(userId, { content: noteDraft.trim() })
      setNoteDraft('')
      const [notesRes, activitiesRes] = await Promise.all([
        listAdminClientNotes(userId),
        listAdminClientActivities(userId),
      ])
      setNotes(notesRes.notes || [])
      setActivities(activitiesRes.activities || [])
    } catch (err) {
      setError(err.message || 'Erreur ajout note')
    } finally {
      setSaving(false)
    }
  }

  const removeNote = async (noteId) => {
    setSaving(true)
    setError('')
    try {
      await deleteAdminClientNote(userId, noteId)
      setNotes((current) => current.filter((note) => note._id !== noteId))
    } catch (err) {
      setError(err.message || 'Erreur suppression note')
    } finally {
      setSaving(false)
    }
  }

  // Cloud helpers
  const clientCloudRoot = client ? (client.companyName || client.name || '').replace(/[\/\\:*?"<>|]/g, '_').trim() : ''

  const loadCloudFiles = useCallback(async (subPath) => {
    if (!clientCloudRoot) return
    setCloudLoading(true)
    setCloudError('')
    try {
      const fullPath = subPath ? `${clientCloudRoot}/${subPath}` : clientCloudRoot
      const data = await listCloudFiles(fullPath)
      setCloudItems(data.items || [])
    } catch (err) {
      if (err.message && err.message.includes('404')) {
        setCloudItems([])
      } else {
        setCloudError(err.message || 'Erreur chargement cloud')
        setCloudItems([])
      }
    } finally {
      setCloudLoading(false)
    }
  }, [clientCloudRoot])

  useEffect(() => {
    if (activeTab === 'cloud' && clientCloudRoot) {
      loadCloudFiles(cloudPath)
    }
  }, [activeTab, cloudPath, clientCloudRoot, loadCloudFiles])

  useEffect(() => {
    if (cloudSuccess) {
      const timer = setTimeout(() => setCloudSuccess(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [cloudSuccess])

  const handleCloudCreateFolder = async (e) => {
    e.preventDefault()
    if (!cloudNewFolderName.trim()) return
    setCloudCreating(true)
    setCloudError('')
    try {
      const folderPath = cloudPath
        ? `${clientCloudRoot}/${cloudPath}/${cloudNewFolderName.trim()}`
        : `${clientCloudRoot}/${cloudNewFolderName.trim()}`
      await createCloudFolder(folderPath)
      setCloudNewFolderName('')
      setShowCloudNewFolder(false)
      setCloudSuccess('Dossier créé')
      await loadCloudFiles(cloudPath)
    } catch (err) {
      setCloudError(err.message || 'Erreur création dossier')
    } finally {
      setCloudCreating(false)
    }
  }

  const handleCloudEnsureFolder = async () => {
    setCloudCreating(true)
    setCloudError('')
    try {
      await createCloudFolder(clientCloudRoot)
      setCloudSuccess('Dossier client créé')
      await loadCloudFiles(cloudPath)
    } catch (err) {
      if (err.message && err.message.includes('existe')) {
        await loadCloudFiles(cloudPath)
      } else {
        setCloudError(err.message || 'Erreur création dossier client')
      }
    } finally {
      setCloudCreating(false)
    }
  }

  const handleCloudUpload = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setCloudUploading(true)
    setCloudError('')
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const filePath = cloudPath
          ? `${clientCloudRoot}/${cloudPath}/${file.name}`
          : `${clientCloudRoot}/${file.name}`
        await uploadCloudFile(filePath, file)
      }
      setCloudSuccess(`${files.length} fichier(s) uploadé(s)`)
      await loadCloudFiles(cloudPath)
    } catch (err) {
      setCloudError(err.message || 'Erreur upload')
    } finally {
      setCloudUploading(false)
      if (cloudFileInputRef.current) cloudFileInputRef.current.value = ''
    }
  }

  const handleCloudDownload = async (item) => {
    const itemPath = cloudPath
      ? `${clientCloudRoot}/${cloudPath}/${item.name}`
      : `${clientCloudRoot}/${item.name}`
    const url = getCloudDownloadUrl(itemPath)
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!response.ok) throw new Error('Erreur téléchargement')
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = item.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      setCloudError(err.message || 'Erreur téléchargement')
    }
  }

  const handleCloudDelete = async () => {
    if (!cloudConfirmDelete) return
    setCloudDeleting(true)
    setCloudError('')
    try {
      const itemPath = cloudPath
        ? `${clientCloudRoot}/${cloudPath}/${cloudConfirmDelete.name}`
        : `${clientCloudRoot}/${cloudConfirmDelete.name}`
      await deleteCloudItem(itemPath)
      setCloudConfirmDelete(null)
      setCloudSuccess(`"${cloudConfirmDelete.name}" supprimé`)
      await loadCloudFiles(cloudPath)
    } catch (err) {
      setCloudError(err.message || 'Erreur suppression')
    } finally {
      setCloudDeleting(false)
    }
  }

  const cloudBreadcrumbs = cloudPath ? cloudPath.split('/').filter(Boolean) : []

  return (
    <div className="portal-container">
      <div className="portal-card">
        <div className="admin-breadcrumb">
          <Link to="/admin">Admin</Link>
          <span>/</span>
          <Link to="/admin/comptes-clients">Comptes clients</Link>
          <span>/</span>
          <span style={{ color: '#ffffff' }}>{client?.name || 'Chargement...'}</span>
        </div>

        {client && (
          <div className="admin-header" style={{ marginBottom: 16 }}>
            <div>
              <h1 style={{ marginBottom: 8 }}>{client.name}</h1>
              <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0 }}>{client.email}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: '6px 0 0 0' }}>{client.companyName || 'Société non renseignée'}</p>
            </div>
            <div className="admin-actions">
              <Link className="portal-button portal-action-link" to={`/admin/projets/nouveau?clientId=${userId}`} title="Ajouter un projet">
                <span className="portal-action-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                </span>
                <span className="portal-action-label">Ajouter un projet</span>
              </Link>
              {canArchive && (
                <button type="button" className="portal-button secondary" onClick={handleArchiveToggle} disabled={saving}>
                  {client.status === 'ARCHIVE' ? 'Réactiver' : 'Archiver'}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="admin-tabs" style={{ marginTop: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="admin-error" style={{ marginTop: 24 }}>{error}</div>}

      <div className="portal-card" style={{ marginTop: 24 }}>
        {loading ? (
          <p style={{ margin: 0, opacity: 0.7 }}>Chargement...</p>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="portal-list">
                <div className="portal-grid">
                  <div className="admin-stat-card">
                    <p className="admin-stat-label">Progression globale</p>
                    <p className="admin-stat-value">{progress?.progressPercent ?? 0}%</p>
                  </div>
                  <div className="admin-stat-card">
                    <p className="admin-stat-label">Projets actifs</p>
                    <p className="admin-stat-value">{projects.filter((project) => !project.isArchived).length}</p>
                  </div>
                  <div className="admin-stat-card">
                    <p className="admin-stat-label">Livrables</p>
                    <p className="admin-stat-value">{deliverables.length}</p>
                  </div>
                  <div className="admin-stat-card">
                    <p className="admin-stat-label">Factures impayées</p>
                    <p className="admin-stat-value">{billingSummary?.unpaidCount ?? 0}</p>
                  </div>
                </div>

                <div className="portal-grid">
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, opacity: 0.7 }}>Statut client</label>
                    <select
                      className="portal-input"
                      value={client?.status || 'ACTIF'}
                      onChange={(event) => saveClientPatch({ status: event.target.value })}
                      disabled={saving}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, opacity: 0.7 }}>Santé</label>
                    <select
                      className="portal-input"
                      value={client?.healthStatus || 'BON'}
                      onChange={(event) => saveClientPatch({ healthStatus: event.target.value })}
                      disabled={saving}
                    >
                      {HEALTH_OPTIONS.map((health) => (
                        <option key={health} value={health}>{health}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, opacity: 0.7 }}>Téléphone</label>
                    <input
                      className="portal-input"
                      value={client?.phone || ''}
                      onChange={(event) => setClient((current) => ({ ...current, phone: event.target.value }))}
                      onBlur={(event) => saveClientPatch({ phone: event.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, opacity: 0.7 }}>Site web</label>
                    <input
                      className="portal-input"
                      value={client?.website || ''}
                      onChange={(event) => setClient((current) => ({ ...current, website: event.target.value }))}
                      onBlur={(event) => saveClientPatch({ website: event.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="admin-list">
                {projects.length === 0 ? (
                  <div className="admin-empty-state">
                    <div className="admin-empty-state-icon">📁</div>
                    <p className="admin-empty-state-text">Aucun projet pour ce client</p>
                  </div>
                ) : (
                  projects.map((project) => (
                    <div key={project._id} className="admin-list-item">
                      <div className="admin-list-item-content">
                        <h3 className="admin-list-item-title">{project.name}</h3>
                        <p className="admin-list-item-subtitle">{project.status} • Progression {project.progressPercent ?? 0}%</p>
                      </div>
                      <div className="admin-list-item-actions">
                        <Link className="portal-button secondary" to={`/admin/projets/${project._id}`}>
                          Voir projet
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'deliverables' && (
              <div className="admin-list">
                {deliverables.length === 0 ? (
                  <div className="admin-empty-state">
                    <div className="admin-empty-state-icon">📦</div>
                    <p className="admin-empty-state-text">Aucun livrable</p>
                  </div>
                ) : (
                  deliverables.map((deliverable) => (
                    <div key={deliverable._id} className="admin-list-item">
                      <div className="admin-list-item-content">
                        <h3 className="admin-list-item-title">{deliverable.title}</h3>
                        <p className="admin-list-item-subtitle">{deliverable.projectName} • {deliverable.itemType}</p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          <span className="portal-badge">{deliverable.visibleToClient ? 'Visible client' : 'Admin only'}</span>
                          <span className="portal-badge">{deliverable.isDownloadable ? 'Téléchargeable' : 'Lecture seule'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'cloud' && (
              <div className="portal-list">
                {cloudError && <div className="admin-error">{cloudError}</div>}
                {cloudSuccess && <div className="admin-success">{cloudSuccess}</div>}

                {/* Cloud toolbar */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                  {cloudPath && (
                    <button type="button" className="portal-button secondary" onClick={() => {
                      const parts = cloudPath.split('/').filter(Boolean)
                      parts.pop()
                      setCloudPath(parts.join('/'))
                    }} style={{ fontSize: 13 }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      Retour
                    </button>
                  )}
                  <button type="button" className="portal-button secondary" onClick={() => setShowCloudNewFolder(!showCloudNewFolder)} style={{ fontSize: 13 }}>
                    + Dossier
                  </button>
                  <button type="button" className="portal-button" onClick={() => cloudFileInputRef.current?.click()} disabled={cloudUploading} style={{ fontSize: 13 }}>
                    {cloudUploading ? 'Upload...' : 'Uploader'}
                  </button>
                  <input ref={cloudFileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleCloudUpload} />
                  <Link className="portal-button secondary" to={`/admin/cloud-storage?path=${encodeURIComponent(clientCloudRoot)}`} style={{ fontSize: 13, textDecoration: 'none' }}>
                    Ouvrir dans Cloud Storage
                  </Link>
                </div>

                {/* Breadcrumb */}
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCloudPath('') }} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
                    {clientCloudRoot}
                  </a>
                  {cloudBreadcrumbs.map((part, i) => (
                    <React.Fragment key={i}>
                      <span> / </span>
                      {i === cloudBreadcrumbs.length - 1 ? (
                        <span style={{ color: '#fff' }}>{part}</span>
                      ) : (
                        <a href="#" onClick={(e) => { e.preventDefault(); setCloudPath(cloudBreadcrumbs.slice(0, i + 1).join('/')) }} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
                          {part}
                        </a>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* New folder form */}
                {showCloudNewFolder && (
                  <form onSubmit={handleCloudCreateFolder} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input className="portal-input" placeholder="Nom du dossier" value={cloudNewFolderName} onChange={(e) => setCloudNewFolderName(e.target.value)} autoFocus style={{ flex: 1 }} />
                    <button type="submit" className="portal-button" disabled={cloudCreating || !cloudNewFolderName.trim()} style={{ fontSize: 13 }}>
                      {cloudCreating ? 'Création...' : 'Créer'}
                    </button>
                    <button type="button" className="portal-button secondary" onClick={() => { setShowCloudNewFolder(false); setCloudNewFolderName('') }} style={{ fontSize: 13 }}>
                      Annuler
                    </button>
                  </form>
                )}

                {/* Delete confirmation */}
                {cloudConfirmDelete && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: 12, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fca5a5', fontSize: 13 }}>Supprimer "{cloudConfirmDelete.name}" ?</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="portal-button" style={{ background: 'rgba(239,68,68,0.3)', borderColor: 'rgba(239,68,68,0.5)', fontSize: 13 }} onClick={handleCloudDelete} disabled={cloudDeleting}>
                        {cloudDeleting ? 'Suppression...' : 'Supprimer'}
                      </button>
                      <button type="button" className="portal-button secondary" onClick={() => setCloudConfirmDelete(null)} style={{ fontSize: 13 }}>Annuler</button>
                    </div>
                  </div>
                )}

                {/* File listing */}
                {cloudLoading ? (
                  <div className="admin-loading">Chargement...</div>
                ) : cloudItems.length === 0 ? (
                  <div className="admin-empty-state">
                    <div className="admin-empty-state-icon">
                      <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                      </svg>
                    </div>
                    <p className="admin-empty-state-text">Aucun document cloud pour ce client</p>
                    <button type="button" className="portal-button" onClick={handleCloudEnsureFolder} disabled={cloudCreating} style={{ marginTop: 12 }}>
                      {cloudCreating ? 'Création...' : 'Créer le dossier client'}
                    </button>
                  </div>
                ) : (
                  <div className="cloud-file-list">
                    <div className="cloud-file-row cloud-file-header">
                      <div className="cloud-file-icon"></div>
                      <div className="cloud-file-name">Nom</div>
                      <div className="cloud-file-size">Taille</div>
                      <div className="cloud-file-date">Modifié</div>
                      <div className="cloud-file-actions">Actions</div>
                    </div>
                    {cloudItems.map((item) => (
                      <div
                        key={item.href || item.name}
                        className={`cloud-file-row ${item.isDirectory ? 'cloud-file-directory' : ''}`}
                        onDoubleClick={() => {
                          if (item.isDirectory) {
                            setCloudPath(cloudPath ? `${cloudPath}/${item.name}` : item.name)
                          }
                        }}
                      >
                        <div className="cloud-file-icon" style={{ color: item.isDirectory ? '#0ea5e9' : 'rgba(255,255,255,0.5)' }}>
                          {item.isDirectory ? (
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                          ) : (
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>
                          )}
                        </div>
                        <div className="cloud-file-name">
                          {item.isDirectory ? (
                            <a href="#" onClick={(e) => { e.preventDefault(); setCloudPath(cloudPath ? `${cloudPath}/${item.name}` : item.name) }} className="cloud-file-link">
                              {item.name}
                            </a>
                          ) : (
                            <span className="cloud-file-label">{item.name}</span>
                          )}
                        </div>
                        <div className="cloud-file-size">{item.isDirectory ? '—' : (item.size ? `${(item.size / 1024).toFixed(1)} Ko` : '—')}</div>
                        <div className="cloud-file-date">{item.lastModified ? new Date(item.lastModified).toLocaleDateString('fr-FR') : '—'}</div>
                        <div className="cloud-file-actions">
                          {!item.isDirectory && (
                            <button type="button" className="cloud-action-btn" onClick={() => handleCloudDownload(item)} title="Télécharger">
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                            </button>
                          )}
                          <button type="button" className="cloud-action-btn cloud-action-btn-danger" onClick={() => setCloudConfirmDelete(item)} title="Supprimer">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'contacts' && (
              <div className="portal-list">
                <form onSubmit={addContact} className="portal-grid">
                  <input className="portal-input" placeholder="Prénom" value={contactDraft.firstName} onChange={(event) => setContactDraft({ ...contactDraft, firstName: event.target.value })} required />
                  <input className="portal-input" placeholder="Nom" value={contactDraft.lastName} onChange={(event) => setContactDraft({ ...contactDraft, lastName: event.target.value })} />
                  <input className="portal-input" placeholder="Email" type="email" value={contactDraft.email} onChange={(event) => setContactDraft({ ...contactDraft, email: event.target.value })} />
                  <input className="portal-input" placeholder="Téléphone" value={contactDraft.phone} onChange={(event) => setContactDraft({ ...contactDraft, phone: event.target.value })} />
                  <button type="submit" className="portal-button" disabled={saving}>Ajouter</button>
                </form>

                <div className="admin-list">
                  {contacts.map((contact) => (
                    <div key={contact._id} className="admin-list-item">
                      <div className="admin-list-item-content">
                        <h3 className="admin-list-item-title">{contact.firstName} {contact.lastName}</h3>
                        <p className="admin-list-item-subtitle">{contact.email || 'Email non renseigné'}{contact.phone ? ` • ${contact.phone}` : ''}</p>
                      </div>
                      <div className="admin-list-item-actions">
                        <button type="button" className="portal-button secondary" onClick={() => removeContact(contact._id)} disabled={saving}>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="portal-list">
                <form onSubmit={addNote} style={{ display: 'grid', gap: 10 }}>
                  <textarea
                    className="portal-input"
                    placeholder="Ajouter une note interne"
                    rows={3}
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                  />
                  <button type="submit" className="portal-button" disabled={saving}>Ajouter une note</button>
                </form>

                <div className="admin-list">
                  {notesAndActivities.map((item) => (
                    <div key={item._id} className="admin-list-item">
                      <div className="admin-list-item-content">
                        <h3 className="admin-list-item-title">{item.label}</h3>
                        <p className="admin-list-item-subtitle">{item.actor} • {new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="admin-list-item-actions">
                        {item.type === 'NOTE' && (
                          <button type="button" className="portal-button secondary" onClick={() => removeNote(item.rawId)} disabled={saving}>
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="portal-list">
                <div className="portal-grid">
                  <div className="admin-stat-card">
                    <p className="admin-stat-label">Montant facturé</p>
                    <p className="admin-stat-value">{Math.round(billingSummary?.amountInvoiced || 0)} {billingSummary?.currency || 'EUR'}</p>
                  </div>
                  <div className="admin-stat-card">
                    <p className="admin-stat-label">Montant payé</p>
                    <p className="admin-stat-value">{Math.round(billingSummary?.amountPaid || 0)} {billingSummary?.currency || 'EUR'}</p>
                  </div>
                  <div className="admin-stat-card">
                    <p className="admin-stat-label">Montant impayé</p>
                    <p className="admin-stat-value">{Math.round(billingSummary?.amountUnpaid || 0)} {billingSummary?.currency || 'EUR'}</p>
                  </div>
                </div>

                <div className="admin-list">
                  {billingDocuments.map((document) => (
                    <div key={document._id} className="admin-list-item">
                      <div className="admin-list-item-content">
                        <h3 className="admin-list-item-title">{document.number} ({document.type})</h3>
                        <p className="admin-list-item-subtitle">
                          {document.project?.name || 'Projet'} • {document.status} • {Math.round(document.total || 0)} {document.currency || 'EUR'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ClientAccountDetail
