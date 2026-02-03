import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { hasPermission, PERMISSIONS } from '../../lib/permissions'
import { toDateTimeLocal } from '../../lib/formatUtils'
import '../espace-client/ClientPortal.css'
import './AdminPortal.css'

const CRM_STATUSES = [
  { key: 'LEAD', label: 'Lead' },
  { key: 'QUALIFIED', label: 'Qualifié' },
  { key: 'CONTACTED', label: 'Contacté' },
  { key: 'DEMO', label: 'Démo' },
  { key: 'PROPOSAL', label: 'Proposition' },
  { key: 'WON', label: 'Gagné' },
  { key: 'LOST', label: 'Perdu' },
]

const CRM_SOURCES = ['Ads', 'Site', 'Referral', 'Réseaux sociaux', 'Email', 'Autre']

const CrmBoard = () => {
  const { user } = useAuth()
  const canManageCrm = hasPermission(user, PERMISSIONS.MANAGE_CRM)
  const [columns, setColumns] = useState([])
  const [admins, setAdmins] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
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

  const handleDrop = async (event, status) => {
    event.preventDefault()
    const leadId = event.dataTransfer.getData('text/plain')
    if (!leadId) return
    await handleUpdateLead(leadId, { status })
  }

  const handleDragStart = (event, leadId) => {
    event.dataTransfer.setData('text/plain', leadId)
  }

  const renderColumn = (column) => {
    const statusLabel = CRM_STATUSES.find((s) => s.key === column.status)?.label || column.status
    return (
      <div key={column.status} className="crm-column" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, column.status)}>
        <div className="crm-column-header">
          <span className="crm-column-title">{statusLabel}</span>
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
          <div className="admin-actions">
            <Link className="portal-button secondary" to="/admin/comptes-admin">
              Comptes admin
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-error" style={{ marginTop: 24 }}>
          {error}
        </div>
      )}

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
              <select
                className="portal-input"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              >
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
              <select
                className="portal-input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="BASSE">Priorité basse</option>
                <option value="NORMALE">Priorité normale</option>
                <option value="HAUTE">Priorité haute</option>
                <option value="URGENTE">Priorité urgente</option>
              </select>
              <select
                className="portal-input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {CRM_STATUSES.map((status) => (
                  <option key={status.key} value={status.key}>
                    {status.label}
                  </option>
                ))}
              </select>
              <select
                className="portal-input"
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              >
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

      <div className="portal-card" style={{ marginTop: 24 }}>
        {loading ? (
          <div className="admin-loading">Chargement du pipeline...</div>
        ) : (
          <div className="crm-board">{columns.map(renderColumn)}</div>
        )}
      </div>
    </div>
  )
}

export default CrmBoard
