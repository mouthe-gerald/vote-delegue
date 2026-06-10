import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/connexion" replace />

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/connexion" replace />
  }

  return children
}

export default ProtectedRoute