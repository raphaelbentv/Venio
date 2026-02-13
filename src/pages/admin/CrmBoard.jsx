import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { hasPermission, PERMISSIONS } from '../../lib/permissions'
import { toDateTimeLocal } from '../../lib/formatUtils'
import '../espace-client/ClientPortal.css'
import './AdminPortal.css'

const CRM_STATUSES = [
  { key: 'LEAD', label: 'Lead', color: '#6366f1' },
  { key: 'QUALIFIED', label: 'Qualifié', color: '#0ea5e9' },
  { key: 'CONTACTED', label: 'Contacté', color: '#8b5cf6' },
  { key: 'DEMO', label: 'Démo', color: '#f59e0b' },
  { key: 'PROPOSAL', label: 'Proposition', color: '#f97316' },
  { key: 'WON', label: 'Gagné', color: '#22c55e' },
  { key: 'LOST', label: 'Perdu', color: '#ef4444' },
]

const CRM_PRIORITIES = [
  { key: 'BASSE', label: 'Basse', color: '#64748b' },
  { key: 'NORMALE', label: 'Normale', color: '#0ea5e9' },
  { key: 'HAUTE', label: 'Haute', color: '#f59e0b' },
  { key: 'URGENTE', label: 'Urgente', color: '#ef4444' },
]

const CRM_SOURCES = ['Ads', 'Site', 'Referral', 'Réseaux sociaux', 'Email', 'Autre']

const STATUS_MAP = Object.fromEntries(CRM_STATUSES.map((s) => [s.key, s]))
const PRIORITY_MAP = Object.fromEntries(CRM_PRIORITIES.map((p) => [p.key, p]))

const CrmBoard = () => {
  const { user } = useAuth()
  const canManageCrm = hasPermission(user, PERMISSIONS.MANAGE_CRM)
  const [columns, setColumns] = useState([])
  const [admins, setAdmins] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('table')
  const [showForm, setShowForm] = useState(false)

  // Table view state
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [sortField, setSortField] = useState('updatedAt')
  const [sortDir, setSortDir] = useState('desc')
  const [collapsedGroups, setCollapsedGroups] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const [form, setForm] = useState({
    company: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    source: '',
    budget: '',
    priority: 'NORMALE',
    status: 'LEAD',
    nextActionAt: '',
    notes: '',
    assignedTo: '',
  })

  const adminsById = useMemo(() => {
    const map = {}
    admins.forEach((admin) => {
      map[admin._id] = admin
    })
    return map
  }, [admins])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [pipelineRes, adminRes] = await Promise.all([
        apiFetch('/api/admin/crm/pipeline'),
        apiFetch('/api/admin/admins'),
      ])
      setColumns(pipelineRes.columns || [])
      setAdmins(adminRes.users || [])
    } catch (err) {
      setError(err.message || 'Erreur chargement CRM')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Flatten all leads from columns
  const allLeads = useMemo(() => {
    const leads = []
    columns.forEach((col) => {
      ;(col.leads || []).forEach((lead) => leads.push(lead))
    })
    return leads
  }, [columns])

  // Filtered & sorted leads for table view
  const filteredLeads = useMemo(() => {
    let leads = [...allLeads]

    if (search) {
      const q = search.toLowerCase()
      leads = leads.filter(
        (l) =>
          (l.company || '').toLowerCase().includes(q) ||
          (l.contactName || '').toLowerCase().includes(q) ||
          (l.contactEmail || '').toLowerCase().includes(q)
      )
    }
    if (filterStatus) leads = leads.filter((l) => l.status === filterStatus)
    if (filterPriority) leads = leads.filter((l) => l.priority === filterPriority)
    if (filterAssignee) leads = leads.filter((l) => l.assignedTo === filterAssignee)

    leads.sort((a, b) => {
      let va = a[sortField]
      let vb = b[sortField]
      if (sortField === 'budget') {
        va = va ?? -1
        vb = vb ?? -1
      }
      if (sortField === 'status') {
        va = CRM_STATUSES.findIndex((s) => s.key === va)
        vb = CRM_STATUSES.findIndex((s) => s.key === vb)
      }
      if (sortField === 'priority') {
        va = CRM_PRIORITIES.findIndex((p) => p.key === va)
        vb = CRM_PRIORITIES.findIndex((p) => p.key === vb)
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return leads
  }, [allLeads, search, filterStatus, filterPriority, filterAssignee, sortField, sortDir])

  // Group leads by status for Monday.com style
  const groupedLeads = useMemo(() => {
    const groups = []
    CRM_STATUSES.forEach((status) => {
      const leads = filteredLeads.filter((l) => l.status === status.key)
      if (leads.length > 0 || !filterStatus) {
        groups.push({ ...status, leads })
      }
    })
    return groups
  }, [filteredLeads, filterStatus])

  const handleCreateLead = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const payload = {
        company: form.company,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        source: form.source,
        budget: form.budget === '' ? null : Number(form.budget),
        priority: form.priority,
        status: form.status,
        nextActionAt: form.nextActionAt ? new Date(form.nextActionAt).toISOString() : null,
        notes: form.notes,
        assignedTo: form.assignedTo || null,
      }
      await apiFetch('/api/admin/crm/leads', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setForm({
        company: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        source: '',
        budget: '',
        priority: 'NORMALE',
        status: 'LEAD',
        nextActionAt: '',
        notes: '',
        assignedTo: '',
      })
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err.message || 'Erreur création lead')
    }
  }

  const handleUpdateLead = async (leadId, patch) => {
    setError('')
    try {
      await apiFetch(`/api/admin/crm/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      await load()
    } catch (err) {
      setError(err.message || 'Erreur mise à jour lead')
    }
  }

  const handleDeleteLead = async (leadId) => {
    setError('')
    try {
      await apiFetch(`/api/admin/crm/leads/${leadId}`, { method: 'DELETE' })
      setDeleteConfirm(null)
      await load()
    } catch (err) {
      setError(err.message || 'Erreur suppression lead')
    }
  }

  const handleDrop = async (event, status) => {
    event.preventDefault()
    const leadId = event.dataTransfer.getData('text/plain')
    if (!leadId) return
    await handleUpdateLead(leadId, { status })
  }

  const handleDragStart = (event, leadId) => {
    event.dataTransfer.setData('text/plain', leadId)
  }

  const toggleSort = useCallback(
    (field) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortDir('asc')
      }
    },
    [sortField]
  )

  const toggleGroup = useCallback((statusKey) => {
    setCollapsedGroups((prev) => ({ ...prev, [statusKey]: !prev[statusKey] }))
  }, [])

  const totalLeads = allLeads.length
  const activeFilters = [filterStatus, filterPriority, filterAssignee, search].filter(Boolean).length

  // Sort indicator
  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="crm-sort-icon">↕</span>
    return <span className="crm-sort-icon active">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  // ── Kanban View ──
  const renderColumn = (column) => {
    const status = STATUS_MAP[column.status]
    return (
      <div
        key={column.status}
        className="crm-column"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, column.status)}
        style={{ '--column-color': status?.color || '#0ea5e9' }}
      >
        <div className="crm-column-header">
          <span className="crm-column-title">{status?.label || column.status}</span>
          <span className="crm-column-count">{column.leads?.length || 0}</span>
        </div>
        {(column.leads || []).map((lead) => {
          const isOverdue = lead.nextActionAt && new Date(lead.nextActionAt) < new Date()
          const assigned = adminsById[lead.assignedTo]
          return (
            <div
              key={lead._id}
              className={`crm-card ${isOverdue ? 'crm-overdue' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, lead._id)}
            >
              <p className="crm-card-title">{lead.company}</p>
              <p className="crm-card-meta">{lead.contactName || 'Contact non renseigné'}</p>
              <div className="crm-card-row">
                {lead.priority && <span className="crm-badge">{lead.priority}</span>}
                {lead.source && <span className="crm-badge">{lead.source}</span>}
                {lead.budget != null && <span className="crm-badge">{lead.budget} €</span>}
              </div>
              <div className="crm-card-row" style={{ marginTop: 8 }}>
                <select
                  className="portal-input"
                  value={lead.assignedTo || ''}
                  onChange={(e) => handleUpdateLead(lead._id, { assignedTo: e.target.value || null })}
                  disabled={!canManageCrm}
                  style={{ fontSize: 12, padding: '6px 8px' }}
                >
                  <option value="">Non assigné</option>
                  {admins.map((admin) => (
                    <option key={admin._id} value={admin._id}>
                      {admin.name}
                    </option>
                  ))}
                </select>
                {assigned && (
                  <span className="crm-card-meta" style={{ margin: 0 }}>
                    {assigned.name}
                  </span>
                )}
              </div>
              {lead.nextActionAt && (
                <p className="crm-card-meta" style={{ marginTop: 8 }}>
                  Prochaine action : {new Date(lead.nextActionAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ── Table View ──
  const renderTableView = () => (
    <div className="crm-table-container">
      {/* Toolbar */}
      <div className="crm-table-toolbar">
        <div className="crm-table-search-wrap">
          <svg className="crm-table-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="crm-table-search"
            placeholder="Rechercher un lead..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="crm-table-search-clear" onClick={() => setSearch('')} title="Effacer">
              ×
            </button>
          )}
        </div>
        <div className="crm-table-filters">
          <select className="crm-table-filter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tous les statuts</option>
            {CRM_STATUSES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <select className="crm-table-filter" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">Toutes priorités</option>
            {CRM_PRIORITIES.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <select className="crm-table-filter" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
            <option value="">Tous les commerciaux</option>
            {admins.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>
          {activeFilters > 0 && (
            <button
              className="crm-table-filter-clear"
              onClick={() => {
                setSearch('')
                setFilterStatus('')
                setFilterPriority('')
                setFilterAssignee('')
              }}
            >
              Effacer les filtres ({activeFilters})
            </button>
          )}
        </div>
        <div className="crm-table-stats">
          <span>{filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}</span>
          {filteredLeads.length !== totalLeads && <span className="crm-table-stats-total">/ {totalLeads} total</span>}
        </div>
      </div>

      {/* Grouped Table */}
      <div className="crm-table-scroll">
        <table className="crm-table">
          <thead>
            <tr>
              <th className="crm-th crm-th-company" onClick={() => toggleSort('company')}>
                Entreprise <SortIcon field="company" />
              </th>
              <th className="crm-th crm-th-contact" onClick={() => toggleSort('contactName')}>
                Contact <SortIcon field="contactName" />
              </th>
              <th className="crm-th crm-th-email">Email</th>
              <th className="crm-th crm-th-phone">Téléphone</th>
              <th className="crm-th crm-th-source" onClick={() => toggleSort('source')}>
                Source <SortIcon field="source" />
              </th>
              <th className="crm-th crm-th-priority" onClick={() => toggleSort('priority')}>
                Priorité <SortIcon field="priority" />
              </th>
              <th className="crm-th crm-th-budget" onClick={() => toggleSort('budget')}>
                Budget <SortIcon field="budget" />
              </th>
              <th className="crm-th crm-th-assignee">Commercial</th>
              <th className="crm-th crm-th-date" onClick={() => toggleSort('nextActionAt')}>
                Prochaine action <SortIcon field="nextActionAt" />
              </th>
              <th className="crm-th crm-th-date" onClick={() => toggleSort('updatedAt')}>
                Mis à jour <SortIcon field="updatedAt" />
              </th>
              {canManageCrm && <th className="crm-th crm-th-actions"></th>}
            </tr>
          </thead>
          <tbody>
            {groupedLeads.map((group) => {
              const isCollapsed = collapsedGroups[group.key]
              return (
                <React.Fragment key={group.key}>
                  {/* Group header row */}
                  <tr className="crm-group-row" onClick={() => toggleGroup(group.key)}>
                    <td colSpan={canManageCrm ? 11 : 10}>
                      <div className="crm-group-header" style={{ '--group-color': group.color }}>
                        <span className={`crm-group-chevron ${isCollapsed ? '' : 'open'}`}>▶</span>
                        <span className="crm-group-color-bar" style={{ background: group.color }} />
                        <span className="crm-group-label">{group.label}</span>
                        <span className="crm-group-count">{group.leads.length} lead{group.leads.length !== 1 ? 's' : ''}</span>
                      </div>
                    </td>
                  </tr>
                  {/* Lead rows */}
                  {!isCollapsed &&
                    group.leads.map((lead) => {
                      const isOverdue = lead.nextActionAt && new Date(lead.nextActionAt) < new Date()
                      const assigned = adminsById[lead.assignedTo]
                      const priorityInfo = PRIORITY_MAP[lead.priority]
                      return (
                        <tr key={lead._id} className={`crm-table-row ${isOverdue ? 'crm-row-overdue' : ''}`}>
                          <td className="crm-td crm-td-company">
                            <span className="crm-row-color-indicator" style={{ background: group.color }} />
                            {lead.company}
                          </td>
                          <td className="crm-td">{lead.contactName || '—'}</td>
                          <td className="crm-td crm-td-email">
                            {lead.contactEmail ? (
                              <a href={`mailto:${lead.contactEmail}`} className="crm-email-link">
                                {lead.contactEmail}
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="crm-td">{lead.contactPhone || '—'}</td>
                          <td className="crm-td">
                            {lead.source ? <span className="crm-table-badge">{lead.source}</span> : '—'}
                          </td>
                          <td className="crm-td">
                            {canManageCrm ? (
                              <select
                                className="crm-inline-select"
                                value={lead.priority || 'NORMALE'}
                                onChange={(e) => handleUpdateLead(lead._id, { priority: e.target.value })}
                                style={{ '--select-color': priorityInfo?.color || '#0ea5e9' }}
                              >
                                {CRM_PRIORITIES.map((p) => (
                                  <option key={p.key} value={p.key}>
                                    {p.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="crm-priority-badge" style={{ '--priority-color': priorityInfo?.color || '#0ea5e9' }}>
                                {priorityInfo?.label || lead.priority}
                              </span>
                            )}
                          </td>
                          <td className="crm-td crm-td-budget">
                            {lead.budget != null ? `${lead.budget.toLocaleString('fr-FR')} €` : '—'}
                          </td>
                          <td className="crm-td">
                            {canManageCrm ? (
                              <select
                                className="crm-inline-select crm-inline-assignee"
                                value={lead.assignedTo || ''}
                                onChange={(e) => handleUpdateLead(lead._id, { assignedTo: e.target.value || null })}
                              >
                                <option value="">Non assigné</option>
                                {admins.map((admin) => (
                                  <option key={admin._id} value={admin._id}>
                                    {admin.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span>{assigned?.name || 'Non assigné'}</span>
                            )}
                          </td>
                          <td className={`crm-td ${isOverdue ? 'crm-td-overdue' : ''}`}>
                            {lead.nextActionAt ? new Date(lead.nextActionAt).toLocaleDateString('fr-FR') : '—'}
                            {isOverdue && <span className="crm-overdue-tag">En retard</span>}
                          </td>
                          <td className="crm-td crm-td-date">
                            {lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString('fr-FR') : '—'}
                          </td>
                          {canManageCrm && (
                            <td className="crm-td crm-td-actions">
                              <div className="crm-row-actions">
                                {/* Status change dropdown */}
                                <select
                                  className="crm-inline-select crm-inline-status"
                                  value={lead.status}
                                  onChange={(e) => handleUpdateLead(lead._id, { status: e.target.value })}
                                  title="Changer le statut"
                                  style={{ '--select-color': STATUS_MAP[lead.status]?.color || '#0ea5e9' }}
                                >
                                  {CRM_STATUSES.map((s) => (
                                    <option key={s.key} value={s.key}>
                                      → {s.label}
                                    </option>
                                  ))}
                                </select>
                                {/* Delete button */}
                                {deleteConfirm === lead._id ? (
                                  <div className="crm-delete-confirm">
                                    <button className="crm-btn-confirm-delete" onClick={() => handleDeleteLead(lead._id)}>
                                      Oui
                                    </button>
                                    <button className="crm-btn-cancel-delete" onClick={() => setDeleteConfirm(null)}>
                                      Non
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className="crm-btn-delete"
                                    onClick={() => setDeleteConfirm(lead._id)}
                                    title="Supprimer"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
        {filteredLeads.length === 0 && (
          <div className="crm-table-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p>Aucun lead trouvé</p>
            {activeFilters > 0 && <p className="crm-table-empty-sub">Essayez de modifier vos filtres</p>}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="portal-container">
      <div className="portal-card">
        <div className="admin-breadcrumb">
          <Link to="/admin">Admin</Link>
          <span>/</span>
          <span style={{ color: '#ffffff' }}>CRM & Prospection</span>
        </div>
        <div className="admin-header">
          <div>
            <h1>CRM & Prospection</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '8px 0 0 0', fontSize: '15px' }}>
              Pipeline commercial avec attribution, relances et automatisations
            </p>
          </div>
          <div className="admin-actions portal-actions-reveal" style={{ gap: 8 }}>
            {/* View toggle */}
            <div className="crm-view-toggle">
              <button
                className={`crm-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Vue tableau"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
              </button>
              <button
                className={`crm-view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                onClick={() => setViewMode('kanban')}
                title="Vue Kanban"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="6" height="18" rx="1" />
                  <rect x="9" y="3" width="6" height="12" rx="1" />
                  <rect x="16" y="3" width="6" height="15" rx="1" />
                </svg>
              </button>
            </div>
            {canManageCrm && (
              <button className="portal-button" onClick={() => setShowForm((v) => !v)}>
                {showForm ? 'Masquer le formulaire' : '+ Nouveau lead'}
              </button>
            )}
            <Link className="portal-button secondary portal-action-link" to="/admin/comptes-admin" title="Comptes admin">
              <span className="portal-action-icon" aria-hidden>
                <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke="currentColor">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <span className="portal-action-label">Comptes admin</span>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-error" style={{ marginTop: 24 }}>
          {error}
        </div>
      )}

      {/* Lead creation form (collapsible) */}
      {showForm && canManageCrm && (
        <div className="portal-card" style={{ marginTop: 24 }}>
          <form onSubmit={handleCreateLead} className="portal-list">
            <div className="admin-form-section" style={{ marginBottom: 0 }}>
              <h2>Nouveau lead</h2>
              <div className="crm-form-grid">
                <input
                  className="portal-input"
                  placeholder="Entreprise *"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  required
                />
                <input
                  className="portal-input"
                  placeholder="Contact (nom)"
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                />
                <input
                  className="portal-input"
                  placeholder="Email"
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                />
                <input
                  className="portal-input"
                  placeholder="Téléphone"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                />
                <select className="portal-input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                  <option value="">Source</option>
                  {CRM_SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
                <input
                  className="portal-input"
                  placeholder="Budget estimé"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                />
                <select className="portal-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="BASSE">Priorité basse</option>
                  <option value="NORMALE">Priorité normale</option>
                  <option value="HAUTE">Priorité haute</option>
                  <option value="URGENTE">Priorité urgente</option>
                </select>
                <select className="portal-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {CRM_STATUSES.map((status) => (
                    <option key={status.key} value={status.key}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <select className="portal-input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value="">Commercial (optionnel)</option>
                  {admins.map((admin) => (
                    <option key={admin._id} value={admin._id}>
                      {admin.name}
                    </option>
                  ))}
                </select>
                <input
                  className="portal-input"
                  type="datetime-local"
                  value={form.nextActionAt ? toDateTimeLocal(form.nextActionAt) : ''}
                  onChange={(e) => setForm({ ...form, nextActionAt: e.target.value })}
                />
                <input
                  className="portal-input"
                  placeholder="Notes internes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="crm-inline-actions" style={{ marginTop: 12 }}>
                <button className="portal-button" type="submit" disabled={!canManageCrm}>
                  Créer le lead
                </button>
                <button
                  className="portal-button secondary"
                  type="button"
                  onClick={() =>
                    setForm({
                      company: '',
                      contactName: '',
                      contactEmail: '',
                      contactPhone: '',
                      source: '',
                      budget: '',
                      priority: 'NORMALE',
                      status: 'LEAD',
                      nextActionAt: '',
                      notes: '',
                      assignedTo: '',
                    })
                  }
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Main content area */}
      <div className="portal-card" style={{ marginTop: 24, padding: viewMode === 'table' ? 0 : undefined, overflow: 'visible' }}>
        {loading ? (
          <div className="admin-loading" style={{ padding: 32 }}>Chargement du pipeline...</div>
        ) : viewMode === 'kanban' ? (
          <div className="crm-board">{columns.map(renderColumn)}</div>
        ) : (
          renderTableView()
        )}
      </div>
    </div>
  )
}

export default CrmBoard
