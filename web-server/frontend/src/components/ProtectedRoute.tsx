import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AppRoutes } from '@/enums/AppRoutes'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn, isLoading } = useAuth()
  const location = useLocation()

  // Si está cargando, no redirigir todavía
  if (isLoading) {
    return null // o un componente de loading si lo prefieres
  }

  if (!isLoggedIn) {
    // Redirect to login page but save the attempted URL
    return <Navigate to={AppRoutes.LOGIN} state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute 