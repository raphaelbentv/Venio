import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTabState } from '../../hooks/useTabState'
import { useAuth } from '../../context/AuthContext'
import {
  archiveAdminClient,
  createAdminClientContact,
  createAdminClientNote,
  getAdminClient,
  getAdminClientBillingSummary,
  getAdminClientCloud,
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
import { CRM_SERVICE_TYPES } from '../../lib/formatUtils'
import type { Client, Contact, ContactDraft, Note, Activity, BillingSummary, BillingDocument, Deliverable, CloudInfo } from '../../types/client.types'
import type { Project } from '../../types/project.types'
import '../espace-client/ClientPortal.css'
import './AdminPortal.css'

const TABS = [
  { id: 'overview', label: "Vue d'ensemble" },
  { id: 'cloud', label: 'Cloud' },
  { id: 'projects', label: 'Projets' },
  { id: 'deliverables', label: 'Livrables' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'notes', label: 'Notes & Activités' },
  { id: 'billing', label: 'Facturation' },
]

const FOLDER_ICONS: Record<string, string> = {
  Contrats: '📄',
  Devis: '📋',
  Factures: '🧾',
  Livrables: '📦',
  Communication: '💬',
  Briefs: '📝',
  Assets: '🎨',
}

const STATUS_OPTIONS = ['PROSPECT', 'ACTIF', 'EN_PAUSE', 'CLOS', 'ARCHIVE']
const HEALTH_OPTIONS = ['BON', 'ATTENTION', 'CRITIQUE']

interface NoteOrActivity {
  _id: string
  createdAt: string
  label: string
  type: string
  actor: string
  pinned: boolean
  rawId: string
}

const ClientAccountDetail = () => {
  const { user } = useAuth()
  const { userId } = useParams<{ userId: string }>()

  const [activeTab, setActiveTab] = useTabState('overview')
  const [client, setClient] = useState<Client | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [progress, setProgress] = useState<{ progressPercent?: number } | null>(null)
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null)
  const [billingDocuments, setBillingDocuments] = useState<BillingDocument[]>([])
  const [cloudInfo, setCloudInfo] = useState<CloudInfo | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)

  const [contactDraft, setContactDraft] = useState<ContactDraft>({ firstName: '', lastName: '', email: '', phone: '' })
  const [noteDraft, setNoteDraft] = useState<string>('')

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
        cloudRes,
      ] = await Promise.all([
        getAdminClient(userId!),
        listAdminClientProjects(userId!),
        getAdminClientProgress(userId!),
        listAdminClientDeliverables(userId!),
        listAdminClientContacts(userId!),
        listAdminClientNotes(userId!),
        listAdminClientActivities(userId!),
        getAdminClientBillingSummary(userId!),
        listAdminClientBillingDocuments(userId!),
        getAdminClientCloud(userId!).catch(() => ({ cloud: null })),
      ]) as [
        Record<string, unknown>,
        Record<string, unknown>,
        Record<string, unknown>,
        Record<string, unknown>,
        Record<string, unknown>,
        Record<string, unknown>,
        Record<string, unknown>,
        Record<string, unknown>,
        Record<string, unknown>,
        Record<string, unknown>,
      ]

      setClient((clientRes.client as Client) || null)
      setProjects((projectsRes.projects as Project[]) || [])
      setProgress((progressRes as { progressPercent?: number }) || null)
      setDeliverables((deliverablesRes.deliverables as Deliverable[]) || [])
      setContacts((contactsRes.contacts as Contact[]) || [])
      setNotes((notesRes.notes as Note[]) || [])
      setActivities((activitiesRes.activities as Activity[]) || [])
      setBillingSummary((billingSummaryRes.summary as BillingSummary) || null)
      setBillingDocuments((billingDocumentsRes.documents as BillingDocument[]) || [])
      setCloudInfo((cloudRes.cloud as CloudInfo) || null)
    } catch (err: unknown) {
      setError((err as Error).message || 'Erreur chargement compte')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [userId])

  const notesAndActivities = useMemo<NoteOrActivity[]>(() => {
    const fromNotes: NoteOrActivity[] = notes.map((note) => ({
      _id: `note-${note._id}`,
      createdAt: note.createdAt,
      label: note.content,
      type: 'NOTE',
      actor: note.createdBy?.name || 'Admin',
      pinned: Boolean(note.pinned),
      rawId: note._id,
    }))

    const fromActivities: NoteOrActivity[] = activities.map((activity) => ({
      _id: `activity-${activity._id}`,
      createdAt: activity.createdAt,
      label: activity.label,
      type: activity.type,
      actor: activity.actorId?.name || 'System',
      pinned: false,
      rawId: activity._id,
    }))

    return [...fromNotes, ...fromActivities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [notes, activities])

  const saveClientPatch = async (patch: Record<string, unknown>) => {
    setSaving(true)
    setError('')
    try {
      const data = await updateAdminClient(userId!, patch) as Record<string, unknown>
      setClient(data.client as Client)
    } catch (err: unknown) {
      setError((err as Error).message || 'Erreur mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const handleArchiveToggle = async () => {
    if (!canArchive) return
    setSaving(true)
    setError('')
    try {
      const data = (client?.status === 'ARCHIVE' ? await reactivateAdminClient(userId!) : await archiveAdminClient(userId!)) as Record<string, unknown>
      setClient(data.client as Client)
      await loadAll()
    } catch (err: unknown) {
      setError((err as Error).message || 'Erreur archivage')
    } finally {
      setSaving(false)
    }
  }

  const addContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!contactDraft.firstName.trim()) return
    setSaving(true)
    setError('')
    try {
      await createAdminClientContact(userId!, { ...contactDraft, isMain: contacts.length === 0 })
      setContactDraft({ firstName: '', lastName: '', email: '', phone: '' })
      const data = await listAdminClientContacts(userId!) as Record<string, unknown>
      setContacts((data.contacts as Contact[]) || [])
    } catch (err: unknown) {
      setError((err as Error).message || 'Erreur ajout contact')
    } finally {
      setSaving(false)
    }
  }

  const removeContact = async (contactId: string) => {
    setSaving(true)
    setError('')
    try {
      await deleteAdminClientContact(userId!, contactId)
      setContacts((current) => current.filter((contact) => contact._id !== contactId))
    } catch (err: unknown) {
      setError((err as Error).message || 'Erreur suppression contact')
    } finally {
      setSaving(false)
    }
  }

  const addNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!noteDraft.trim()) return
    setSaving(true)
    setError('')
    try {
      await createAdminClientNote(userId!, { content: noteDraft.trim() })
      setNoteDraft('')
      const [notesRes, activitiesRes] = await Promise.all([
        listAdminClientNotes(userId!),
        listAdminClientActivities(userId!),
      ]) as [Record<string, unknown>, Record<string, unknown>]
      setNotes((notesRes.notes as Note[]) || [])
      setActivities((activitiesRes.activities as Activity[]) || [])
    } catch (err: unknown) {
      setError((err as Error).message || 'Erreur ajout note')
    } finally {
      setSaving(false)
    }
  }

  const removeNote = async (noteId: string) => {
    setSaving(true)
    setError('')
    try {
      await deleteAdminClientNote(userId!, noteId)
      setNotes((current) => current.filter((note) => note._id !== noteId))
    } catch (err: unknown) {
      setError((err as Error).message || 'Erreur suppression note')
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
          <span style={{ color: '#ffffff' }}>{client?.companyName || client?.name || 'Chargement...'}</span>
        </div>

        {client && (
          <div className="admin-header" style={{ marginBottom: 16 }}>
            <div>
              <h1 style={{ marginBottom: 8 }}>{client.companyName || client.name || 'Société non renseignée'}</h1>
              {client.serviceType && (
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 4px 0', fontWeight: 600 }}>Service : {client.serviceType}</p>
              )}
              <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0 }}>Contact : {client.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0 0' }}>{client.email}</p>
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
                    <label style={{ display: 'block', marginBottom: 8, opacity: 0.7 }}>Société</label>
                    <input
                      className="portal-input"
                      value={client?.companyName || ''}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => setClient((current) => current ? { ...current, companyName: event.target.value } : current)}
                      onBlur={(event: React.FocusEvent<HTMLInputElement>) => saveClientPatch({ companyName: event.target.value })}
                      placeholder="Nom de l'entreprise"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, opacity: 0.7 }}>Service (pour lequel le client paie)</label>
                    <select
                      className="portal-input"
                      value={client?.serviceType || ''}
                      onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                        const v = event.target.value
                        setClient((current) => current ? { ...current, serviceType: v } : current)
                        saveClientPatch({ serviceType: v })
                      }}
                      disabled={saving}
                    >
                      <option value="">—</option>
                      {CRM_SERVICE_TYPES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, opacity: 0.7 }}>Statut client</label>
                    <select
                      className="portal-input"
                      value={client?.status || 'ACTIF'}
                      onChange={(event: React.ChangeEvent<HTMLSelectElement>) => saveClientPatch({ status: event.target.value })}
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
                      onChange={(event: React.ChangeEvent<HTMLSelectElement>) => saveClientPatch({ healthStatus: event.target.value })}
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
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => setClient((current) => current ? { ...current, phone: event.target.value } : current)}
                      onBlur={(event: React.FocusEvent<HTMLInputElement>) => saveClientPatch({ phone: event.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, opacity: 0.7 }}>Site web</label>
                    <input
                      className="portal-input"
                      value={client?.website || ''}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => setClient((current) => current ? { ...current, website: event.target.value } : current)}
                      onBlur={(event: React.FocusEvent<HTMLInputElement>) => saveClientPatch({ website: event.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cloud' && (
              <div className="portal-list">
                {!cloudInfo || !cloudInfo.enabled ? (
                  <div className="admin-empty-state">
                    <div className="admin-empty-state-icon">☁️</div>
                    <p className="admin-empty-state-text">Nextcloud non configuré</p>
                    <p style={{ opacity: 0.5, fontSize: 13 }}>Configurez les variables NEXTCLOUD_* dans le backend pour activer l'intégration cloud.</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <p style={{ margin: 0, opacity: 0.7, fontSize: 14 }}>
                        Dossier client : <strong>{cloudInfo.clientFolder}</strong>
                      </p>
                      <a
                        href={cloudInfo.webUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="portal-button secondary"
                        style={{ fontSize: 13, textDecoration: 'none' }}
                      >
                        Ouvrir le dossier racine
                      </a>
                    </div>
                    <div className="cloud-folders-grid">
                      {(cloudInfo.folders || []).map((folder) => (
                        <a
                          key={folder.name}
                          href={folder.webUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cloud-folder-card"
                        >
                          <span className="cloud-folder-icon">{FOLDER_ICONS[folder.name] || '📁'}</span>
                          <span className="cloud-folder-name">{folder.name}</span>
                          <span className="cloud-folder-open">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </span>
                        </a>
                      ))}
                    </div>
                  </>
                )}
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
                  <input className="portal-input" placeholder="Prénom" value={contactDraft.firstName} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setContactDraft({ ...contactDraft, firstName: event.target.value })} required />
                  <input className="portal-input" placeholder="Nom" value={contactDraft.lastName} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setContactDraft({ ...contactDraft, lastName: event.target.value })} />
                  <input className="portal-input" placeholder="Email" type="email" value={contactDraft.email} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setContactDraft({ ...contactDraft, email: event.target.value })} />
                  <input className="portal-input" placeholder="Téléphone" value={contactDraft.phone} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setContactDraft({ ...contactDraft, phone: event.target.value })} />
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
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setNoteDraft(event.target.value)}
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
