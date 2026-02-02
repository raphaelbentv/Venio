import React from 'react'
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
import ClientLogin from './pages/espace-client/Login'
import ClientDashboard from './pages/espace-client/Dashboard'
import ClientProjectDetail from './pages/espace-client/ProjectDetail'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import ClientAccountList from './pages/admin/ClientAccountList'
import ClientAccountNew from './pages/admin/ClientAccountNew'
import ClientAccountDetail from './pages/admin/ClientAccountDetail'
import ProjectForm from './pages/admin/ProjectForm'
import AdminProjectDetail from './pages/admin/ProjectDetail'
import './App.css'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services/communication" element={<ServicesCommunication />} />
        <Route path="/services/developpement" element={<ServicesDeveloppement />} />
        <Route path="/services/conseil" element={<ServicesConseil />} />
        <Route path="/poles" element={<PolesPage />} />
        <Route path="/realisations" element={<Realisations />} />
        <Route path="/a-propos" element={<APropos />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/legal" element={<Legal />} />
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
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="ADMIN" redirectTo="/admin/login">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/comptes-clients"
          element={
            <ProtectedRoute role="ADMIN" redirectTo="/admin/login">
              <ClientAccountList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/comptes-clients/nouveau"
          element={
            <ProtectedRoute role="ADMIN" redirectTo="/admin/login">
              <ClientAccountNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/comptes-clients/:userId"
          element={
            <ProtectedRoute role="ADMIN" redirectTo="/admin/login">
              <ClientAccountDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/projets/nouveau"
          element={
            <ProtectedRoute role="ADMIN" redirectTo="/admin/login">
              <ProjectForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/projets/:id"
          element={
            <ProtectedRoute role="ADMIN" redirectTo="/admin/login">
              <AdminProjectDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Footer />
    </>
  )
}

export default App
