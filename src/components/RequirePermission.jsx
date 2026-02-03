import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hasPermission } from '../lib/permissions'

const RequirePermission = ({ children, permission, redirectTo = '/admin' }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!user || !permission) {
    return <Navigate to={redirectTo} replace />
  }

  if (!hasPermission(user, permission)) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}

export default RequirePermission
