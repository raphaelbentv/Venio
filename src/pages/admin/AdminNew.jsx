import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { ADMIN_ROLES, getPermissionsForRole, PERMISSIONS } from '../../lib/permissions'
import '../espace-client/ClientPortal.css'
import './AdminPortal.css'

const roleMeta = {
  SUPER_ADMIN: {
    label: 'Super admin',
    description: 'Accès total à l’administration et aux réglages sensibles.',
  },
  ADMIN: {
    label: 'Contributeur',
    description: 'Gestion des clients, projets, CRM, contenu et facturation.',
  },
  VIEWER: {
    label: 'Lecture seule',
    description: 'Consultation sans modification des données.',
  },
}

const permissionLabels = {
  [PERMISSIONS.MANAGE_ADMINS]: 'Gestion des administrateurs',
  [PERMISSIONS.MANAGE_CLIENTS]: 'Gestion des comptes clients',
  [PERMISSIONS.VIEW_CRM]: 'Lecture du CRM',
  [PERMISSIONS.MANAGE_CRM]: 'Gestion du CRM',
  [PERMISSIONS.VIEW_PROJECTS]: 'Lecture des projets',
  [PERMISSIONS.EDIT_PROJECTS]: 'Modification des projets',
  [PERMISSIONS.VIEW_CONTENT]: 'Lecture du contenu',
  [PERMISSIONS.EDIT_CONTENT]: 'Modification du contenu',
  [PERMISSIONS.VIEW_BILLING]: 'Lecture de la facturation',
  [PERMISSIONS.MANAGE_BILLING]: 'Gestion de la facturation',
}

const allPermissions = Object.values(PERMISSIONS)

const AdminNew = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ADMIN' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const availableRoles = useMemo(() => {
    return ADMIN_ROLES.filter((role) => role !== 'SUPER_ADMIN' || user?.role === 'SUPER_ADMIN')
  }, [user?.role])

  const selectedPermissions = useMemo(() => {
    if (form.role === 'SUPER_ADMIN') {
      return ['Tous les droits disponibles']
    }
    return getPermissionsForRole(form.role).map((permission) => permissionLabels[permission] || permission)
  }, [form.role])

  const missingPermissions = useMemo(() => {
    if (form.role === 'SUPER_ADMIN') {
      return []
    }
    const rolePermissions = new Set(getPermissionsForRole(form.role))
    return allPermissions
      .filter((permission) => !rolePermissions.has(permission))
      .map((permission) => permissionLabels[permission] || permission)
  }, [form.role])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiFetch('/api/admin/admins', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      navigate(`/admin/comptes-admin/${data.user._id}`)
    } catch (err) {
      setError(err.message || 'Erreur creation admin')
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
          <Link to="/admin/comptes-admin">Comptes admin</Link>
          <span>/</span>
          <span style={{ color: '#ffffff' }}>Nouvel administrateur</span>
        </div>
        <h1>Nouveau compte admin</h1>
      </div>

      <div className="portal-card" style={{ marginTop: 24 }}>
        <form className="portal-list" onSubmit={handleSubmit}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Nom complet
            </label>
            <input
              className="portal-input"
              placeholder="Nom complet"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Email
            </label>
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
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Mot de passe
            </label>
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
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Rôle
            </label>
            <select
              className="portal-input"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {roleMeta[role]?.label || role}
                </option>
              ))}
            </select>
            <p style={{ marginTop: 8, color: 'rgba(255, 255, 255, 0.6)', fontSize: 13 }}>
              {roleMeta[form.role]?.description || 'Sélectionnez un rôle.'}
            </p>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, letterSpacing: '0.04em', color: 'rgba(255, 255, 255, 0.5)' }}>
                Droits associés
              </div>
              <ul style={{ marginTop: 8, paddingLeft: 18, color: 'rgba(255, 255, 255, 0.75)', fontSize: 13 }}>
                {selectedPermissions.map((permission) => (
                  <li key={permission}>{permission}</li>
                ))}
              </ul>
            </div>
            {missingPermissions.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, letterSpacing: '0.04em', color: 'rgba(255, 255, 255, 0.5)' }}>
                  Droits non accordés
                </div>
                <ul style={{ marginTop: 8, paddingLeft: 18, color: 'rgba(255, 255, 255, 0.6)', fontSize: 13 }}>
                  {missingPermissions.map((permission) => (
                    <li key={permission}>{permission}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {error && <div className="admin-error">{error}</div>}
          <div className="admin-button-group">
            <button className="portal-button" type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
            <Link className="portal-button secondary" to="/admin/comptes-admin">
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminNew
