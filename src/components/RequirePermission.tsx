import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hasPermission } from '../lib/permissions'

interface RequirePermissionProps {
  children: React.ReactNode
  permission: string
  redirectTo?: string
}

const RequirePermission = ({ children, permission, redirectTo = '/admin' }: RequirePermissionProps) => {
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
