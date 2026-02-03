import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import {
  formatCurrency,
  parseCurrency,
  toDateTimeLocal,
  fromDateTimeLocal,
  SUGGESTIONS_SERVICE_TYPES,
  SUGGESTIONS_DELIVERABLE_TYPES,
  SUGGESTIONS_TAGS,
} from '../../lib/formatUtils'
import '../espace-client/ClientPortal.css'
import './AdminPortal.css'

const ProjectForm = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [clients, setClients] = useState([])
  const [form, setForm] = useState({
    clientId: searchParams.get('clientId') || '',
    name: '',
    description: '',
    status: 'EN_COURS',
    projectNumber: '',
    startDate: '',
    endDate: '',
    deliveredAt: '',
    priority: 'NORMALE',
    responsible: '',
    summary: '',
    internalNotes: '',
    serviceTypes: [],
    deliverableTypes: [],
    deadlines: [],
    budget: { amount: '', currency: 'EUR', note: '' },
    tags: [],
    billing: { amountInvoiced: '', billingStatus: 'NON_FACTURE', quoteReference: '' },
    reminderAt: '',
    isArchived: false,
  })
  const [serviceTypeInput, setServiceTypeInput] = useState('')
  const [deliverableTypeInput, setDeliverableTypeInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/api/admin/users?role=CLIENT')
        setClients(data.users || [])
      } catch (err) {
        setError(err.message || 'Erreur chargement comptes')
      }
    }
    load()
  }, [])

  const addServiceType = () => {
    const v = serviceTypeInput.trim()
    if (v && !form.serviceTypes.includes(v)) {
      setForm({ ...form, serviceTypes: [...form.serviceTypes, v] })
      setServiceTypeInput('')
    }
  }

  const removeServiceType = (index) => {
    setForm({ ...form, serviceTypes: form.serviceTypes.filter((_, i) => i !== index) })
  }

  const addDeliverableType = () => {
    const v = deliverableTypeInput.trim()
    if (v && !form.deliverableTypes.includes(v)) {
      setForm({ ...form, deliverableTypes: [...form.deliverableTypes, v] })
      setDeliverableTypeInput('')
    }
  }

  const removeDeliverableType = (index) => {
    setForm({ ...form, deliverableTypes: form.deliverableTypes.filter((_, i) => i !== index) })
  }

  const addDeadline = () => {
    setForm({
      ...form,
      deadlines: [...form.deadlines, { label: '', dueAt: '' }],
    })
  }

  const updateDeadline = (index, field, value) => {
    const next = [...form.deadlines]
    next[index] = { ...next[index], [field]: value }
    setForm({ ...form, deadlines: next })
  }

  const deadlineDueAtDisplay = (dueAt) => (dueAt ? toDateTimeLocal(dueAt) : '')

  const removeDeadline = (index) => {
    setForm({ ...form, deadlines: form.deadlines.filter((_, i) => i !== index) })
  }

  const addTag = () => {
    const v = tagInput.trim()
    if (v && !form.tags.includes(v)) {
      setForm({ ...form, tags: [...form.tags, v] })
      setTagInput('')
    }
  }

  const removeTag = (index) => {
    setForm({ ...form, tags: form.tags.filter((_, i) => i !== index) })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const payload = {
        clientId: form.clientId,
        name: form.name,
        description: form.description,
        status: form.status,
        projectNumber: form.projectNumber || '',
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        deliveredAt: form.deliveredAt ? new Date(form.deliveredAt).toISOString() : null,
        priority: form.priority,
        responsible: form.responsible || '',
        summary: form.summary || '',
        internalNotes: form.internalNotes || '',
        serviceTypes: form.serviceTypes,
        deliverableTypes: form.deliverableTypes,
        deadlines: form.deadlines
          .filter((d) => d.label?.trim() || d.dueAt)
          .map((d) => ({
            label: d.label || '',
            dueAt: d.dueAt ? new Date(d.dueAt).toISOString() : null,
          })),
        budget: {
          amount: form.budget.amount === '' ? null : Number(form.budget.amount),
          currency: form.budget.currency || 'EUR',
          note: form.budget.note || '',
        },
        tags: form.tags,
        billing: {
          amountInvoiced: form.billing.amountInvoiced === '' ? null : Number(form.billing.amountInvoiced),
          billingStatus: form.billing.billingStatus || 'NON_FACTURE',
          quoteReference: form.billing.quoteReference || '',
        },
        reminderAt: form.reminderAt ? new Date(form.reminderAt).toISOString() : null,
        isArchived: form.isArchived,
      }
      if (Number.isNaN(payload.budget.amount)) payload.budget.amount = null
      if (Number.isNaN(payload.billing.amountInvoiced)) payload.billing.amountInvoiced = null
      const data = await apiFetch('/api/admin/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      navigate(`/admin/projets/${data.project._id}`)
    } catch (err) {
      setError(err.message || 'Erreur creation projet')
    }
  }

  return (
    <div className="portal-container">
      <div className="portal-card">
        <div className="admin-breadcrumb">
          <Link to="/admin">Admin</Link>
          <span>/</span>
          <span style={{ color: '#ffffff' }}>Nouveau projet</span>
        </div>
        <div className="admin-header">
          <div>
            <h1>Créer un nouveau projet</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '8px 0 0 0', fontSize: '15px' }}>
              Configurez tous les paramètres du projet pour une gestion optimale
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="project-form-container">
          {/* Section 1: Informations de base */}
          <div className="project-form-section">
            <div className="project-form-section-header">
              <div className="project-form-section-icon">📋</div>
              <div>
                <h2 className="project-form-section-title">Informations de base</h2>
                <p className="project-form-section-subtitle">Client, nom et description du projet</p>
              </div>
            </div>
            <div className="portal-list">
              <div className="project-form-field">
                <label className="project-form-label">
                  <span className="project-form-label-icon">👤</span>
                  Client
                </label>
                <select
                  className="portal-input"
                  value={form.clientId}
                  onChange={(event) => setForm({ ...form, clientId: event.target.value })}
                  required
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name} - {client.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="project-form-field">
                <label className="project-form-label">
                  <span className="project-form-label-icon">📝</span>
                  Nom du projet
                </label>
                <input
                  className="portal-input"
                  placeholder="Ex: Site web corporate"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </div>

              <div className="project-form-field">
                <label className="project-form-label">
                  <span className="project-form-label-icon">💬</span>
                  Résumé
                </label>
                <input
                  className="portal-input"
                  placeholder="Résumé en une phrase"
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                />
              </div>

              <div className="project-form-field">
                <label className="project-form-label">
                  <span className="project-form-label-icon">📄</span>
                  Description détaillée
                </label>
                <textarea
                  className="portal-input"
                  placeholder="Description complète du projet"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  rows="4"
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div className="project-form-grid">
                <div className="project-form-field">
                  <label className="project-form-label">
                    <span className="project-form-label-icon">📊</span>
                    Statut
                  </label>
                  <select
                    className="portal-input"
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value })}
                  >
                    <option value="EN_COURS">En cours</option>
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="TERMINE">Terminé</option>
                  </select>
                </div>

                <div className="project-form-field">
                  <label className="project-form-label">
                    <span className="project-form-label-icon">🔢</span>
                    Numéro de projet
                  </label>
                  <input
                    className="portal-input"
                    placeholder="Laissé vide = généré auto (ex: PROJ-0001)"
                    value={form.projectNumber}
                    onChange={(e) => setForm({ ...form, projectNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Planning */}
          <div className="project-form-section">
            <div className="project-form-section-header">
              <div className="project-form-section-icon">📅</div>
              <div>
                <h2 className="project-form-section-title">Planning & Dates</h2>
                <p className="project-form-section-subtitle">Dates clés et jalons du projet</p>
              </div>
            </div>
            <div className="portal-list">
              <div className="project-form-grid">
                <div className="project-form-field">
                  <label className="project-form-label">
                    <span className="project-form-label-icon">🚀</span>
                    Date de début
                  </label>
                  <input
                    className="portal-input"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>

                <div className="project-form-field">
                  <label className="project-form-label">
                    <span className="project-form-label-icon">🎯</span>
                    Fin prévue
                  </label>
                  <input
                    className="portal-input"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>

                <div className="project-form-field">
                  <label className="project-form-label">
                    <span className="project-form-label-icon">✅</span>
                    Livraison réelle
                  </label>
                  <input
                    className="portal-input"
                    type="date"
                    value={form.deliveredAt}
                    onChange={(e) => setForm({ ...form, deliveredAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="project-form-field">
                <label className="project-form-label">
                  <span className="project-form-label-icon">⏰</span>
                  Deadlines & Jalons
                </label>
                {form.deadlines.map((d, i) => (
                  <div key={i} className="deadline-row">
                    <input
                      className="portal-input"
                      placeholder="Libellé du jalon"
                      value={d.label}
                      onChange={(e) => updateDeadline(i, 'label', e.target.value)}
                      style={{ flex: 1, margin: 0 }}
                    />
                    <input
                      className="portal-input"
                      type="datetime-local"
                      value={deadlineDueAtDisplay(d.dueAt)}
                      onChange={(e) => updateDeadline(i, 'dueAt', e.target.value || '')}
                      style={{ width: 200, margin: 0 }}
                    />
                    <button
                      type="button"
                      className="portal-button secondary"
                      onClick={() => removeDeadline(i)}
                      style={{ padding: '10px 14px' }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="portal-button secondary"
                  onClick={addDeadline}
                  style={{ marginTop: 8 }}
                >
                  + Ajouter un jalon
                </button>
              </div>

              <div className="project-form-field">
                <label className="project-form-label">
                  <span className="project-form-label-icon">🔔</span>
                  Date de rappel
                </label>
                <input
                  className="portal-input"
                  type="datetime-local"
                  value={toDateTimeLocal(form.reminderAt)}
                  onChange={(e) => setForm({ ...form, reminderAt: e.target.value || '' })}
                  style={{ maxWidth: 260 }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Gestion */}
          <div className="project-form-section">
            <div className="project-form-section-header">
              <div className="project-form-section-icon">⚙️</div>
              <div>
                <h2 className="project-form-section-title">Gestion & Organisation</h2>
                <p className="project-form-section-subtitle">Priorité, responsable et suivi</p>
              </div>
            </div>
            <div className="portal-list">
              <div className="project-form-grid">
                <div className="project-form-field">
                  <label className="project-form-label">
                    <span className="project-form-label-icon">🎚️</span>
                    Priorité
                  </label>
                  <select
                    className="portal-input"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="BASSE">🟢 Basse</option>
                    <option value="NORMALE">🔵 Normale</option>
                    <option value="HAUTE">🟡 Haute</option>
                    <option value="URGENTE">🔴 Urgente</option>
                  </select>
                </div>

                <div className="project-form-field">
                  <label className="project-form-label">
                    <span className="project-form-label-icon">👨‍💼</span>
                    Responsable
                  </label>
                  <input
                    className="portal-input"
                    placeholder="Nom du responsable"
                    value={form.responsible}
                    onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                  />
                </div>
              </div>

              <div className="project-form-field">
                <label className="project-form-label">
                  <span className="project-form-label-icon">📝</span>
                  Notes internes
                </label>
                <textarea
                  className="portal-input"
                  placeholder="Notes privées, non visibles par le client"
                  value={form.internalNotes}
                  onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
                  rows="3"
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div className="project-form-field">
                <label className="project-form-label">
                  <span className="project-form-label-icon">🏷️</span>
                  Tags
                </label>
                <datalist id="tags-suggestions">
                  {SUGGESTIONS_TAGS.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                <div className="project-form-input-group">
                  <input
                    className="portal-input"
                    list="tags-suggestions"
                    placeholder="Ex: urgent, refonte (suggestions ou libre)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="portal-button secondary" onClick={addTag}>
                    Ajouter
                  </button>
                </div>
                {form.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    {form.tags.map((t, i) => (
                      <span key={i} className="admin-tag">
                        {t}
                        <button type="button" onClick={() => removeTag(i)} aria-label="Retirer">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                <input
                  type="checkbox"
                  checked={form.isArchived}
                  onChange={(e) => setForm({ ...form, isArchived: e.target.checked })}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>📦 Projet archivé</span>
              </label>
            </div>
          </div>

          {/* Section 4: Types & Modules */}
          <div className="project-form-section">
            <div className="project-form-section-header">
              <div className="project-form-section-icon">🎨</div>
              <div>
                <h2 className="project-form-section-title">Types & Modules</h2>
                <p className="project-form-section-subtitle">Prestations et livrables du projet</p>
              </div>
            </div>
            <div className="portal-list">
              <div className="project-form-field">
                <label className="project-form-label">
                  <span className="project-form-label-icon">🛠️</span>
                  Types de prestation
                </label>
                <datalist id="service-types-suggestions">
                  {SUGGESTIONS_SERVICE_TYPES.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <div className="project-form-input-group">
                  <input
                    className="portal-input"
                    list="service-types-suggestions"
                    placeholder="Choisir ou saisir (ex: Design, Développement)"
                    value={serviceTypeInput}
                    onChange={(e) => setServiceTypeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addServiceType())}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="portal-button secondary" onClick={addServiceType}>
                    Ajouter
                  </button>
                </div>
                {form.serviceTypes.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    {form.serviceTypes.map((s, i) => (
                      <span key={i} className="admin-tag">
                        {s}
                        <button type="button" onClick={() => removeServiceType(i)} aria-label="Retirer">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="project-form-field">
                <label className="project-form-label">
                  <span className="project-form-label-icon">📦</span>
                  Types de livrables
                </label>
                <datalist id="deliverable-types-suggestions">
                  {SUGGESTIONS_DELIVERABLE_TYPES.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <div className="project-form-input-group">
                  <input
                    className="portal-input"
                    list="deliverable-types-suggestions"
                    placeholder="Choisir ou saisir (ex: Maquettes, Code source)"
                    value={deliverableTypeInput}
                    onChange={(e) => setDeliverableTypeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDeliverableType())}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="portal-button secondary" onClick={addDeliverableType}>
                    Ajouter
                  </button>
                </div>
                {form.deliverableTypes.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    {form.deliverableTypes.map((s, i) => (
                      <span key={i} className="admin-tag">
                        {s}
                        <button type="button" onClick={() => removeDeliverableType(i)} aria-label="Retirer">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Budget & Facturation */}
          <div className="project-form-section">
            <div className="project-form-section-header">
              <div className="project-form-section-icon">💰</div>
              <div>
                <h2 className="project-form-section-title">Budget & Facturation</h2>
                <p className="project-form-section-subtitle">Gestion financière du projet</p>
              </div>
            </div>
            <div className="portal-list">
              <div className="project-form-field">
                <label className="project-form-label">
                  <span className="project-form-label-icon">💵</span>
                  Budget estimé
                </label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input
                    className="portal-input"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={form.budget.amount !== '' && form.budget.amount != null ? formatCurrency(form.budget.amount) : ''}
                    onChange={(e) => {
                      const parsed = parseCurrency(e.target.value)
                      setForm({ ...form, budget: { ...form.budget, amount: parsed === '' ? '' : parsed } })
                    }}
                    style={{ width: 160 }}
                  />
                  <select
                    className="portal-input"
                    value={form.budget.currency}
                    onChange={(e) => setForm({ ...form, budget: { ...form.budget, currency: e.target.value } })}
                    style={{ width: 100 }}
                  >
                    <option value="EUR">EUR €</option>
                    <option value="USD">USD $</option>
                    <option value="CHF">CHF</option>
                  </select>
                </div>
                <input
                  className="portal-input"
                  placeholder="Note sur le budget"
                  value={form.budget.note}
                  onChange={(e) => setForm({ ...form, budget: { ...form.budget, note: e.target.value } })}
                  style={{ marginTop: 8 }}
                />
              </div>

              <div className="project-form-field">
                <label className="project-form-label">
                  <span className="project-form-label-icon">🧾</span>
                  Facturation
                </label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    className="portal-input"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={form.billing.amountInvoiced !== '' && form.billing.amountInvoiced != null ? formatCurrency(form.billing.amountInvoiced) : ''}
                    onChange={(e) => {
                      const parsed = parseCurrency(e.target.value)
                      setForm({ ...form, billing: { ...form.billing, amountInvoiced: parsed === '' ? '' : parsed } })
                    }}
                    style={{ width: 160 }}
                  />
                  <select
                    className="portal-input"
                    value={form.billing.billingStatus}
                    onChange={(e) => setForm({ ...form, billing: { ...form.billing, billingStatus: e.target.value } })}
                    style={{ width: 160 }}
                  >
                    <option value="NON_FACTURE">Non facturé</option>
                    <option value="PARTIEL">Partiel</option>
                    <option value="FACTURE">Facturé</option>
                  </select>
                </div>
                <input
                  className="portal-input"
                  placeholder="Référence devis (ex: DEV-2026-001)"
                  value={form.billing.quoteReference}
                  onChange={(e) => setForm({ ...form, billing: { ...form.billing, quoteReference: e.target.value } })}
                  style={{ marginTop: 8 }}
                />
              </div>
            </div>
          </div>
        </div>

        {error && <div className="admin-error" style={{ marginTop: 24 }}>{error}</div>}

        {/* Submit Section */}
        <div className="project-form-submit">
          <div className="admin-button-group" style={{ justifyContent: 'center' }}>
            <button className="portal-button" type="submit" style={{ minWidth: 200, fontSize: 16, padding: '14px 32px' }}>
              ✨ Créer le projet
            </button>
            <Link className="portal-button secondary" to="/admin" style={{ minWidth: 120, fontSize: 16, padding: '14px 32px' }}>
              Annuler
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ProjectForm
