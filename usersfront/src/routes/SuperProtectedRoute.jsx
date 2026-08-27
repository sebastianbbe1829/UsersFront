import { Navigate } from 'react-router-dom'

function SuperProtectedRoute({ children }) {
  const token = localStorage.getItem('super_access_token')

  if (!token) {
    return <Navigate to="/super/login" replace />
  }

  return children
}

export default SuperProtectedRoute
