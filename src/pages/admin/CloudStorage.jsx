import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  listCloudFiles,
  createCloudFolder,
  uploadCloudFile,
  getCloudDownloadUrl,
  deleteCloudItem,
  moveCloudItem,
} from '../../services/adminCloud'
import { getToken } from '../../lib/api'
import '../espace-client/ClientPortal.css'
import './AdminPortal.css'

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '—'
  const units = ['o', 'Ko', 'Mo', 'Go']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getFileIcon(item) {
  if (item.isDirectory) {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    )
  }
  const ext = item.name.split('.').pop().toLowerCase()
  const ct = item.contentType || ''
  if (ct.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
      </svg>
    )
  }
  if (['pdf'].includes(ext) || ct === 'application/pdf') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
    </svg>
  )
}

const CloudStorage = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialPath = searchParams.get('path') || ''

  const [currentPath, setCurrentPath] = useState(initialPath)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creating, setCreating] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef(null)

  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [renaming, setRenaming] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameSaving, setRenameSaving] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')

  const loadFiles = useCallback(async (path) => {
    setLoading(true)
    setError('')
    try {
      const data = await listCloudFiles(path)
      setItems(data.items || [])
    } catch (err) {
      setError(err.message || 'Erreur chargement des fichiers')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFiles(currentPath)
  }, [currentPath, loadFiles])

  useEffect(() => {
    if (currentPath) {
      setSearchParams({ path: currentPath })
    } else {
      setSearchParams({})
    }
  }, [currentPath, setSearchParams])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const navigateTo = (path) => {
    setCurrentPath(path)
    setSearchQuery('')
  }

  const navigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    navigateTo(parts.join('/'))
  }

  const breadcrumbs = currentPath ? currentPath.split('/').filter(Boolean) : []

  const handleCreateFolder = async (e) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    setCreating(true)
    setError('')
    try {
      const folderPath = currentPath ? `${currentPath}/${newFolderName.trim()}` : newFolderName.trim()
      await createCloudFolder(folderPath)
      setNewFolderName('')
      setShowNewFolder(false)
      setSuccess('Dossier créé avec succès')
      await loadFiles(currentPath)
    } catch (err) {
      setError(err.message || 'Erreur création dossier')
    } finally {
      setCreating(false)
    }
  }

  const handleUpload = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    setError('')
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(`Upload ${i + 1}/${files.length}: ${file.name}`)
        const filePath = currentPath ? `${currentPath}/${file.name}` : file.name
        await uploadCloudFile(filePath, file)
      }
      setSuccess(`${files.length} fichier(s) uploadé(s) avec succès`)
      await loadFiles(currentPath)
    } catch (err) {
      setError(err.message || 'Erreur upload')
    } finally {
      setUploading(false)
      setUploadProgress('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDownload = async (item) => {
    const path = item.relativePath || (currentPath ? `${currentPath}/${item.name}` : item.name)
    const url = getCloudDownloadUrl(path)
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
      setError(err.message || 'Erreur téléchargement')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    setError('')
    try {
      const path = confirmDelete.relativePath || (currentPath ? `${currentPath}/${confirmDelete.name}` : confirmDelete.name)
      await deleteCloudItem(path)
      setConfirmDelete(null)
      setSuccess(`"${confirmDelete.name}" supprimé avec succès`)
      await loadFiles(currentPath)
    } catch (err) {
      setError(err.message || 'Erreur suppression')
    } finally {
      setDeleting(false)
    }
  }

  const handleRename = async (e) => {
    e.preventDefault()
    if (!renaming || !renameValue.trim()) return
    setRenameSaving(true)
    setError('')
    try {
      const fromPath = renaming.relativePath || (currentPath ? `${currentPath}/${renaming.name}` : renaming.name)
      const toPath = currentPath ? `${currentPath}/${renameValue.trim()}` : renameValue.trim()
      await moveCloudItem(fromPath, toPath)
      setRenaming(null)
      setRenameValue('')
      setSuccess('Renommé avec succès')
      await loadFiles(currentPath)
    } catch (err) {
      setError(err.message || 'Erreur renommage')
    } finally {
      setRenameSaving(false)
    }
  }

  const filteredItems = searchQuery
    ? items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items

  const dirCount = filteredItems.filter((i) => i.isDirectory).length
  const fileCount = filteredItems.filter((i) => !i.isDirectory).length

  return (
    <div className="portal-container">
      <div className="portal-card">
        <div className="admin-breadcrumb">
          <Link to="/admin">Admin</Link>
          <span>/</span>
          {breadcrumbs.length === 0 ? (
            <span style={{ color: '#ffffff' }}>Cloud Storage</span>
          ) : (
            <>
              <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('') }} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
                Cloud Storage
              </a>
              {breadcrumbs.map((part, i) => (
                <React.Fragment key={i}>
                  <span>/</span>
                  {i === breadcrumbs.length - 1 ? (
                    <span style={{ color: '#ffffff' }}>{part}</span>
                  ) : (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        navigateTo(breadcrumbs.slice(0, i + 1).join('/'))
                      }}
                      style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}
                    >
                      {part}
                    </a>
                  )}
                </React.Fragment>
              ))}
            </>
          )}
        </div>

        <div className="admin-header" style={{ marginBottom: 16 }}>
          <div>
            <h1>Cloud Storage</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: '6px 0 0 0', fontSize: 14 }}>
              Nextcloud &middot; /Venio{currentPath ? `/${currentPath}` : ''}
            </p>
          </div>
          <div className="admin-actions portal-actions-reveal">
            {currentPath && (
              <button type="button" className="portal-button secondary portal-action-link" onClick={navigateUp} title="Dossier parent">
                <span className="portal-action-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </span>
                <span className="portal-action-label">Retour</span>
              </button>
            )}
            <button
              type="button"
              className="portal-button portal-action-link"
              onClick={() => setShowNewFolder(!showNewFolder)}
              title="Nouveau dossier"
            >
              <span className="portal-action-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
                </svg>
              </span>
              <span className="portal-action-label">Nouveau dossier</span>
            </button>
            <button
              type="button"
              className="portal-button portal-action-link"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Uploader des fichiers"
            >
              <span className="portal-action-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>
              </span>
              <span className="portal-action-label">Uploader</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
            <button
              type="button"
              className="portal-button secondary portal-action-link"
              onClick={() => loadFiles(currentPath)}
              title="Rafraîchir"
            >
              <span className="portal-action-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </span>
              <span className="portal-action-label">Rafraîchir</span>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ marginBottom: 16 }}>
          <input
            className="portal-input"
            type="text"
            placeholder="Rechercher dans ce dossier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          <span>{dirCount} dossier{dirCount !== 1 ? 's' : ''}</span>
          <span>{fileCount} fichier{fileCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {error && <div className="admin-error" style={{ marginTop: 16 }}>{error}</div>}
      {success && <div className="admin-success" style={{ marginTop: 16 }}>{success}</div>}
      {uploading && uploadProgress && <div className="admin-info" style={{ marginTop: 16 }}>{uploadProgress}</div>}

      {/* New folder form */}
      {showNewFolder && (
        <div className="portal-card" style={{ marginTop: 16 }}>
          <form onSubmit={handleCreateFolder} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              className="portal-input"
              placeholder="Nom du nouveau dossier"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
              style={{ flex: 1 }}
            />
            <button type="submit" className="portal-button" disabled={creating || !newFolderName.trim()}>
              {creating ? 'Création...' : 'Créer'}
            </button>
            <button type="button" className="portal-button secondary" onClick={() => { setShowNewFolder(false); setNewFolderName('') }}>
              Annuler
            </button>
          </form>
        </div>
      )}

      {/* Rename form */}
      {renaming && (
        <div className="portal-card" style={{ marginTop: 16 }}>
          <form onSubmit={handleRename} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, whiteSpace: 'nowrap' }}>
              Renommer "{renaming.name}" :
            </span>
            <input
              className="portal-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
              style={{ flex: 1 }}
            />
            <button type="submit" className="portal-button" disabled={renameSaving || !renameValue.trim()}>
              {renameSaving ? 'Renommage...' : 'Renommer'}
            </button>
            <button type="button" className="portal-button secondary" onClick={() => { setRenaming(null); setRenameValue('') }}>
              Annuler
            </button>
          </form>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="portal-card" style={{ marginTop: 16, borderColor: 'rgba(239, 68, 68, 0.5)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#fca5a5', fontSize: 14 }}>
              Supprimer "{confirmDelete.name}" {confirmDelete.isDirectory ? '(et tout son contenu)' : ''} ?
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="portal-button" style={{ background: 'rgba(239, 68, 68, 0.3)', borderColor: 'rgba(239, 68, 68, 0.5)' }} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
              <button type="button" className="portal-button secondary" onClick={() => setConfirmDelete(null)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File listing */}
      <div className="portal-card" style={{ marginTop: 16 }}>
        {loading ? (
          <div className="admin-loading">Chargement...</div>
        ) : filteredItems.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-state-icon">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="admin-empty-state-text">
              {searchQuery ? 'Aucun résultat pour cette recherche' : 'Ce dossier est vide'}
            </p>
          </div>
        ) : (
          <div className="cloud-file-list">
            {/* Table header */}
            <div className="cloud-file-row cloud-file-header">
              <div className="cloud-file-icon"></div>
              <div className="cloud-file-name">Nom</div>
              <div className="cloud-file-size">Taille</div>
              <div className="cloud-file-date">Modifié</div>
              <div className="cloud-file-actions">Actions</div>
            </div>

            {filteredItems.map((item) => (
              <div
                key={item.href || item.name}
                className={`cloud-file-row ${item.isDirectory ? 'cloud-file-directory' : ''}`}
                onDoubleClick={() => {
                  if (item.isDirectory) {
                    const path = item.relativePath || (currentPath ? `${currentPath}/${item.name}` : item.name)
                    navigateTo(path)
                  }
                }}
              >
                <div className="cloud-file-icon" style={{ color: item.isDirectory ? '#0ea5e9' : 'rgba(255,255,255,0.5)' }}>
                  {getFileIcon(item)}
                </div>
                <div className="cloud-file-name">
                  {item.isDirectory ? (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        const path = item.relativePath || (currentPath ? `${currentPath}/${item.name}` : item.name)
                        navigateTo(path)
                      }}
                      className="cloud-file-link"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <span className="cloud-file-label">{item.name}</span>
                  )}
                </div>
                <div className="cloud-file-size">{item.isDirectory ? '—' : formatFileSize(item.size)}</div>
                <div className="cloud-file-date">{formatDate(item.lastModified)}</div>
                <div className="cloud-file-actions">
                  {!item.isDirectory && (
                    <button
                      type="button"
                      className="cloud-action-btn"
                      onClick={() => handleDownload(item)}
                      title="Télécharger"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    className="cloud-action-btn"
                    onClick={() => {
                      setRenaming(item)
                      setRenameValue(item.name)
                    }}
                    title="Renommer"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="cloud-action-btn cloud-action-btn-danger"
                    onClick={() => setConfirmDelete(item)}
                    title="Supprimer"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CloudStorage
