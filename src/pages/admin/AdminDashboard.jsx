import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { hasPermission, PERMISSIONS } from '../../lib/permissions'
import '../espace-client/ClientPortal.css'
import './AdminPortal.css'

const AdminDashboard = () => {
  const { logout, user } = useAuth()
  const [clientCount, setClientCount] = useState(0)
  const [projectCount, setProjectCount] = useState(0)
  const [allClients, setAllClients] = useState([])
  const [allProjects, setAllProjects] = useState([])
  const [adminCount, setAdminCount] = useState(0)
  const [crmLeadCount, setCrmLeadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const canManageAdmins = hasPermission(user, PERMISSIONS.MANAGE_ADMINS)
  const canManageClients = hasPermission(user, PERMISSIONS.MANAGE_CLIENTS)
  const canViewProjects = hasPermission(user, PERMISSIONS.VIEW_PROJECTS)
  const canEditProjects = hasPermission(user, PERMISSIONS.EDIT_PROJECTS)
  const canViewCrm = hasPermission(user, PERMISSIONS.VIEW_CRM)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        if (canManageClients) {
          const users = await apiFetch('/api/admin/users?role=CLIENT')
          setClientCount(users.users?.length || 0)
        }
        if (canViewProjects) {
          const projects = await apiFetch('/api/admin/projects?archived=false')
          setProjectCount(projects.projects?.length || 0)
        }
        if (isSuperAdmin) {
          const [clientsRes, projectsRes, adminsRes, leadsRes] = await Promise.all([
            apiFetch('/api/admin/users?role=CLIENT'),
            apiFetch('/api/admin/projects?archived=all&includeClient=true'),
            apiFetch('/api/admin/admins'),
            apiFetch('/api/admin/crm/leads').catch(() => ({ leads: [] })),
          ])
          setAllClients(clientsRes.users || [])
          setAllProjects(projectsRes.projects || [])
          setAdminCount(adminsRes.users?.length || 0)
          setCrmLeadCount(leadsRes.leads?.length || 0)
        }
      } catch (err) {
        // Silent for dashboard
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [canManageClients, canViewProjects, isSuperAdmin])

  const stats = React.useMemo(() => {
    const now = new Date()
    const archivedProjects = allProjects.filter((p) => p.isArchived)
    const activeProjects = allProjects.filter((p) => !p.isArchived)
    const byStatus = activeProjects.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1
        return acc
      },
      { EN_COURS: 0, EN_ATTENTE: 0, TERMINE: 0 }
    )
    const overdueReminders = activeProjects.filter((p) => p.reminderAt && new Date(p.reminderAt) < now)
    const overdueDeadlines = activeProjects.filter((p) =>
      Array.isArray(p.deadlines) && p.deadlines.some((d) => d.dueAt && new Date(d.dueAt) < now)
    )
    const highPriority = activeProjects.filter((p) => ['HAUTE', 'URGENTE'].includes(p.priority))
    return {
      totalClients: allClients.length,
      totalProjects: allProjects.length,
      activeProjects: activeProjects.length,
      archivedProjects: archivedProjects.length,
      statusCounts: byStatus,
      overdueReminders: overdueReminders.length,
      overdueDeadlines: overdueDeadlines.length,
      highPriority: highPriority.length,
    }
  }, [allClients, allProjects])

  return (
    <div className="portal-container">
      <div className="portal-card">
        <div className="admin-header">
          <h1>Tableau de bord Admin</h1>
          <div className="admin-actions">
            {canManageClients && (
              <Link className="portal-button" to="/admin/comptes-clients">
                Comptes clients
              </Link>
            )}
            {canManageAdmins && (
              <Link className="portal-button" to="/admin/comptes-admin">
                Comptes admin
              </Link>
            )}
            {canEditProjects && (
              <Link className="portal-button secondary" to="/admin/projets/nouveau">
                Nouveau projet
              </Link>
            )}
            {canViewCrm && (
              <Link className="portal-button" to="/admin/crm">
                CRM & Prospection
              </Link>
            )}
            <button className="portal-button secondary" onClick={logout} type="button">
              Se déconnecter
            </button>
          </div>
        </div>
      </div>

      <div className="admin-stats-grid" style={{ marginTop: 24 }}>
        {canManageClients && (
          <Link to="/admin/comptes-clients" style={{ textDecoration: 'none' }}>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Comptes clients</div>
              <div className="admin-stat-value">{clientCount}</div>
            </div>
          </Link>
        )}
        {canViewProjects && (
          <div className="admin-stat-card">
            <div className="admin-stat-label">Projets actifs</div>
            <div className="admin-stat-value">{projectCount}</div>
          </div>
        )}
      </div>

      {isSuperAdmin && (
        <>
          <div className="admin-widgets-grid">
            <Link to="/admin/comptes-clients" className="admin-widget">
              <div className="admin-widget-label">Clients</div>
              <div className="admin-widget-value">{stats.totalClients}</div>
            </Link>
            <Link to="/admin/comptes-admin" className="admin-widget">
              <div className="admin-widget-label">Admins</div>
              <div className="admin-widget-value">{adminCount}</div>
            </Link>
            <Link to="/admin/crm" className="admin-widget">
              <div className="admin-widget-label">Leads CRM</div>
              <div className="admin-widget-value">{crmLeadCount}</div>
            </Link>
            <div className="admin-widget">
              <div className="admin-widget-label">Projets totaux</div>
              <div className="admin-widget-value">{stats.totalProjects}</div>
            </div>
            <div className="admin-widget">
              <div className="admin-widget-label">Projets archivés</div>
              <div className="admin-widget-value">{stats.archivedProjects}</div>
            </div>
            <div className="admin-widget">
              <div className="admin-widget-label">En retard (deadlines)</div>
              <div className="admin-widget-value">{stats.overdueDeadlines}</div>
            </div>
            <div className="admin-widget">
              <div className="admin-widget-label">Relances dépassées</div>
              <div className="admin-widget-value">{stats.overdueReminders}</div>
            </div>
            <div className="admin-widget">
              <div className="admin-widget-label">Priorité haute</div>
              <div className="admin-widget-value">{stats.highPriority}</div>
            </div>
            <div className="admin-widget">
              <div className="admin-widget-label">Statut En cours</div>
              <div className="admin-widget-value">{stats.statusCounts.EN_COURS}</div>
            </div>
            <div className="admin-widget">
              <div className="admin-widget-label">Statut En attente</div>
              <div className="admin-widget-value">{stats.statusCounts.EN_ATTENTE}</div>
            </div>
            <div className="admin-widget">
              <div className="admin-widget-label">Statut Terminé</div>
              <div className="admin-widget-value">{stats.statusCounts.TERMINE}</div>
            </div>
          </div>

          <div className="portal-card" style={{ marginTop: 24 }}>
            <div className="admin-form-section" style={{ marginBottom: 0 }}>
              <h2>État des projets clients</h2>
              {loading ? (
                <div className="admin-loading">Chargement des projets...</div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Projet</th>
                        <th>Statut</th>
                        <th>Priorité</th>
                        <th>Responsable</th>
                        <th>Budget</th>
                        <th>Dates</th>
                        <th>Relance</th>
                        <th>Archivé</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allProjects.map((project) => (
                        <tr key={project._id}>
                          <td>{project.client?.name || '—'}</td>
                          <td>{project.name}</td>
                          <td>
                            <span className="admin-badge">{project.status}</span>
                          </td>
                          <td>{project.priority || '—'}</td>
                          <td>{project.responsible || '—'}</td>
                          <td>
                            {project.budget?.amount != null ? `${project.budget.amount} ${project.budget.currency || 'EUR'}` : '—'}
                          </td>
                          <td>
                            {project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'} →{' '}
                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : '—'}
                          </td>
                          <td>{project.reminderAt ? new Date(project.reminderAt).toLocaleDateString() : '—'}</td>
                          <td>{project.isArchived ? 'Oui' : 'Non'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminDashboard
