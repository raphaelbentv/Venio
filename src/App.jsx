import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import ServicesCommunication from './pages/ServicesCommunication'
import ServicesDeveloppement from './pages/ServicesDeveloppement'
import ServicesConseil from './pages/ServicesConseil'
import PolesPage from './pages/PolesPage'
import Realisations from './pages/Realisations'
import APropos from './pages/APropos'
import Contact from './pages/Contact'
import Legal from './pages/Legal'
import CGU from './pages/CGU'
import ClientLogin from './pages/espace-client/Login'
import ClientDashboard from './pages/espace-client/Dashboard'
import ClientProjectDetail from './pages/espace-client/ProjectDetail'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import ClientAccountList from './pages/admin/ClientAccountList'
import ClientAccountNew from './pages/admin/ClientAccountNew'
import ClientAccountDetail from './pages/admin/ClientAccountDetail'
import AdminList from './pages/admin/AdminList'
import AdminNew from './pages/admin/AdminNew'
import AdminEdit from './pages/admin/AdminEdit'
import ProjectForm from './pages/admin/ProjectForm'
import AdminProjectDetail from './pages/admin/ProjectDetail'
import CrmBoard from './pages/admin/CrmBoard'
import CrmSettings from './pages/admin/CrmSettings'
import RequirePermission from './components/RequirePermission'
import { ADMIN_ROLES, PERMISSIONS } from './lib/permissions'
import './App.css'

function App() {
  useEffect(() => {
    document.body.classList.add('gpu-off')
    localStorage.setItem('gpu-mode', 'false')
    return () => {
      document.body.classList.remove('gpu-off')
    }
  }, [])

  return (
    <>
      <Navbar />
      <Routes>
        {/* Site vitrine */}
        <Route path="/" element={<Home />} />
        <Route path="/services/communication" element={<ServicesCommunication />} />
        <Route path="/services/developpement" element={<ServicesDeveloppement />} />
        <Route path="/services/conseil" element={<ServicesConseil />} />
        <Route path="/poles" element={<PolesPage />} />
        <Route path="/realisations" element={<Realisations />} />
        <Route path="/a-propos" element={<APropos />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/cgu" element={<CGU />} />

        {/* Espace client */}
        <Route path="/espace-client/login" element={<ClientLogin />} />
        <Route
          path="/espace-client"
          element={
            <ProtectedRoute role="CLIENT" redirectTo="/espace-client/login">
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/espace-client/projets/:id"
          element={
            <ProtectedRoute role="CLIENT" redirectTo="/espace-client/login">
              <ClientProjectDetail />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role={ADMIN_ROLES} redirectTo="/admin/login">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/comptes-clients"
          element={
            <ProtectedRoute role={ADMIN_ROLES} redirectTo="/admin/login">
              <RequirePermission permission={PERMISSIONS.MANAGE_CLIENTS} redirectTo="/admin">
                <ClientAccountList />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/comptes-clients/nouveau"
          element={
            <ProtectedRoute role={ADMIN_ROLES} redirectTo="/admin/login">
              <RequirePermission permission={PERMISSIONS.MANAGE_CLIENTS} redirectTo="/admin">
                <ClientAccountNew />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/comptes-clients/:userId"
          element={
            <ProtectedRoute role={ADMIN_ROLES} redirectTo="/admin/login">
              <RequirePermission permission={PERMISSIONS.MANAGE_CLIENTS} redirectTo="/admin">
                <ClientAccountDetail />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/comptes-admin"
          element={
            <ProtectedRoute role={ADMIN_ROLES} redirectTo="/admin/login">
              <RequirePermission permission={PERMISSIONS.MANAGE_ADMINS} redirectTo="/admin">
                <AdminList />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/comptes-admin/nouveau"
          element={
            <ProtectedRoute role={ADMIN_ROLES} redirectTo="/admin/login">
              <RequirePermission permission={PERMISSIONS.MANAGE_ADMINS} redirectTo="/admin">
                <AdminNew />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/comptes-admin/:userId"
          element={
            <ProtectedRoute role={ADMIN_ROLES} redirectTo="/admin/login">
              <RequirePermission permission={PERMISSIONS.MANAGE_ADMINS} redirectTo="/admin">
                <AdminEdit />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/projets/nouveau"
          element={
            <ProtectedRoute role={ADMIN_ROLES} redirectTo="/admin/login">
              <RequirePermission permission={PERMISSIONS.EDIT_PROJECTS} redirectTo="/admin">
                <ProjectForm />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/projets/:id"
          element={
            <ProtectedRoute role={ADMIN_ROLES} redirectTo="/admin/login">
              <RequirePermission permission={PERMISSIONS.VIEW_PROJECTS} redirectTo="/admin">
                <AdminProjectDetail />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/crm"
          element={
            <ProtectedRoute role={ADMIN_ROLES} redirectTo="/admin/login">
              <RequirePermission permission={PERMISSIONS.VIEW_CRM} redirectTo="/admin">
                <CrmBoard />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/crm/settings"
          element={
            <ProtectedRoute role={ADMIN_ROLES} redirectTo="/admin/login">
              <RequirePermission permission={PERMISSIONS.MANAGE_CRM} redirectTo="/admin/crm">
                <CrmSettings />
              </RequirePermission>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Footer />
    </>
  )
}

export default App
