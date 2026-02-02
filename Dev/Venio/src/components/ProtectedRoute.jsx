import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, role, redirectTo }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />
  }

  if (role && user.role !== role) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}

export default ProtectedRoute
