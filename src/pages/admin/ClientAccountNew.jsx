import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { createAdminClient } from '../../services/adminClients'
import '../espace-client/ClientPortal.css'

const SOURCE_OPTIONS = ['REFERRAL', 'INBOUND', 'OUTBOUND', 'PARTNER', 'AUTRE']

const ClientAccountNew = () => {
  const navigate = useNavigate()
  const [admins, setAdmins] = useState([])
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    phone: '',
    website: '',
    source: 'AUTRE',
    ownerAdminId: '',
    tagsRaw: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const data = await apiFetch('/api/admin/admins')
        setAdmins(data.users || [])
      } catch {
        setAdmins([])
      }
    }
    loadAdmins()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        companyName: form.companyName,
        phone: form.phone,
        website: form.website,
        source: form.source,
        ownerAdminId: form.ownerAdminId || null,
        tags: form.tagsRaw
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      }
      const data = await createAdminClient(payload)
      navigate(`/admin/comptes-clients/${data.client._id}`)
    } catch (err) {
      setError(err.message || 'Erreur creation compte')
    } finally {
      setLoading(false)
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
          <span style={{ color: '#ffffff' }}>Nouveau compte</span>
        </div>
        <h1>Nouveau compte client</h1>
      </div>

      <div className="portal-card" style={{ marginTop: 24 }}>
        <form className="portal-list" onSubmit={handleSubmit}>
          <div className="portal-grid">
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'rgba(255, 255, 255, 0.7)' }}>Nom du client</label>
              <input
                className="portal-input"
                placeholder="Nom complet"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'rgba(255, 255, 255, 0.7)' }}>Email</label>
              <input
                className="portal-input"
                type="email"
                placeholder="email@exemple.com"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'rgba(255, 255, 255, 0.7)' }}>Mot de passe</label>
              <input
                className="portal-input"
                type="password"
                placeholder="Mot de passe sécurisé"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'rgba(255, 255, 255, 0.7)' }}>Société</label>
              <input
                className="portal-input"
                placeholder="Nom de la société"
                value={form.companyName}
                onChange={(event) => setForm({ ...form, companyName: event.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'rgba(255, 255, 255, 0.7)' }}>Téléphone</label>
              <input
                className="portal-input"
                placeholder="+33 ..."
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'rgba(255, 255, 255, 0.7)' }}>Site web</label>
              <input
                className="portal-input"
                placeholder="https://..."
                value={form.website}
                onChange={(event) => setForm({ ...form, website: event.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'rgba(255, 255, 255, 0.7)' }}>Source</label>
              <select className="portal-input" value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}>
                {SOURCE_OPTIONS.map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'rgba(255, 255, 255, 0.7)' }}>Owner interne</label>
              <select className="portal-input" value={form.ownerAdminId} onChange={(event) => setForm({ ...form, ownerAdminId: event.target.value })}>
                <option value="">Non assigné</option>
                {admins.map((admin) => (
                  <option key={admin._id} value={admin._id}>{admin.name} ({admin.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'rgba(255, 255, 255, 0.7)' }}>Tags (séparés par des virgules)</label>
              <input
                className="portal-input"
                placeholder="premium, urgent, saas"
                value={form.tagsRaw}
                onChange={(event) => setForm({ ...form, tagsRaw: event.target.value })}
              />
            </div>
          </div>

          {error && <div className="admin-error">{error}</div>}
          <div className="admin-button-group">
            <button className="portal-button" type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
            <Link className="portal-button secondary" to="/admin/comptes-clients">
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClientAccountNew
