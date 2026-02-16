import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  role?: string | string[]
  redirectTo: string
}

const ProtectedRoute = ({ children, role, redirectTo }: ProtectedRouteProps) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="portal-spinner" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />
  }

  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role]
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to={redirectTo} replace />
    }
  }

  return children
}

export default ProtectedRoute
