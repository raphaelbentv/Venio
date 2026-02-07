import React, { useEffect, useMemo, useState } from 'react'
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
import '../espace-client/ClientPortal.css'
import './AdminPortal.css'

const TABS = [
  { id: 'overview', label: "Vue d'ensemble" },
  { id: 'projects', label: 'Projets' },
  { id: 'deliverables', label: 'Livrables' },
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
