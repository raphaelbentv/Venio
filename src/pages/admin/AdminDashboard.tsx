import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { hasPermission, PERMISSIONS } from '../../lib/permissions'
import type { User } from '../../types/auth.types'
import type { Project } from '../../types/project.types'
import type { CrmAlerts } from '../../types/crm.types'
import '../espace-client/ClientPortal.css'
import './AdminPortal.css'

const AdminDashboard = () => {
  const { logout, user } = useAuth()
  const [clientCount, setClientCount] = useState<number>(0)
  const [projectCount, setProjectCount] = useState<number>(0)
  const [allClients, setAllClients] = useState<User[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [adminCount, setAdminCount] = useState<number>(0)
  const [crmLeadCount, setCrmLeadCount] = useState<number>(0)
  const [crmAlerts, setCrmAlerts] = useState<CrmAlerts>({ coldLeads: [], overdueLeads: [], staleLeads: [] })
  const [loading, setLoading] = useState<boolean>(false)
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
          const users = await apiFetch<{ users?: User[] }>('/api/admin/users?role=CLIENT')
          setClientCount(users.users?.length || 0)
        }
        if (canViewProjects) {
          const projects = await apiFetch<{ projects?: Project[] }>('/api/admin/projects?archived=false')
          setProjectCount(projects.projects?.length || 0)
        }
        if (isSuperAdmin) {
          const [clientsRes, projectsRes, adminsRes, leadsRes, alertsRes] = await Promise.all([
            apiFetch<{ users?: User[] }>('/api/admin/users?role=CLIENT'),
            apiFetch<{ projects?: Project[] }>('/api/admin/projects?archived=all&includeClient=true'),
            apiFetch<{ users?: User[] }>('/api/admin/admins'),
            apiFetch<{ leads?: unknown[] }>('/api/admin/crm/leads').catch(() => ({ leads: [] })),
            apiFetch<CrmAlerts>('/api/admin/crm/alerts').catch(() => ({ coldLeads: [], overdueLeads: [], staleLeads: [] })),
          ])
          setAllClients(clientsRes.users || [])
          setAllProjects(projectsRes.projects || [])
          setAdminCount(adminsRes.users?.length || 0)
          setCrmLeadCount(leadsRes.leads?.length || 0)
          setCrmAlerts(alertsRes || { coldLeads: [], overdueLeads: [], staleLeads: [] })
        }
      } catch (err: unknown) {
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
      { EN_COURS: 0, EN_ATTENTE: 0, TERMINE: 0 } as Record<string, number>
    )
    const overdueReminders = activeProjects.filter((p) => p.reminderAt && new Date(p.reminderAt) < now)
    const overdueDeadlines = activeProjects.filter((p) =>
      Array.isArray(p.deadlines) && p.deadlines.some((d) => d.dueAt && new Date(d.dueAt) < now)
    )
    const highPriority = activeProjects.filter((p) => ['HAUTE', 'URGENTE'].includes(p.priority || ''))
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
          <div className="admin-actions portal-actions-reveal">
            {canManageClients && (
              <Link className="portal-button portal-action-link" to="/admin/comptes-clients" title="Comptes clients">
                <span className="portal-action-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </span>
                <span className="portal-action-label">Comptes clients</span>
              </Link>
            )}
            {canManageAdmins && (
              <Link className="portal-button portal-action-link" to="/admin/comptes-admin" title="Comptes admin">
                <span className="portal-action-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </span>
                <span className="portal-action-label">Comptes admin</span>
              </Link>
            )}
            {canEditProjects && (
              <Link className="portal-button secondary portal-action-link" to="/admin/projets/nouveau" title="Nouveau projet">
                <span className="portal-action-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                </span>
                <span className="portal-action-label">Nouveau projet</span>
              </Link>
            )}
            {canViewCrm && (
              <Link className="portal-button portal-action-link" to="/admin/crm" title="CRM & Prospection">
                <span className="portal-action-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                </span>
                <span className="portal-action-label">CRM & Prospection</span>
              </Link>
            )}
            <button className="portal-button secondary portal-action-link" onClick={logout} type="button" title="Se déconnecter">
              <span className="portal-action-icon" aria-hidden>
                <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              </span>
              <span className="portal-action-label">Se déconnecter</span>
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
            {/* CRM Alerts Widgets */}
            <Link to="/admin/crm" className="admin-widget admin-widget-alert admin-widget-alert-cold">
              <div className="admin-widget-label">Leads froids</div>
              <div className="admin-widget-value">{crmAlerts.coldLeads?.length || 0}</div>
            </Link>
            <Link to="/admin/crm" className="admin-widget admin-widget-alert admin-widget-alert-overdue">
              <div className="admin-widget-label">Actions CRM en retard</div>
              <div className="admin-widget-value">{crmAlerts.overdueLeads?.length || 0}</div>
            </Link>
            <Link to="/admin/crm" className="admin-widget admin-widget-alert admin-widget-alert-stale">
              <div className="admin-widget-label">Leads bloqués</div>
              <div className="admin-widget-value">{crmAlerts.staleLeads?.length || 0}</div>
            </Link>
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
