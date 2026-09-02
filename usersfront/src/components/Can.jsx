import { useAuth } from '../contexts/AuthContext'

export default function Can({ permission, permissions = [], mode = 'any', children, fallback = null }) {
  const { hasPermission } = useAuth()

  const requiredPermissions = permission
    ? [permission]
    : permissions

  const autorizado = mode === 'all'
    ? requiredPermissions.every(hasPermission)
    : requiredPermissions.some(hasPermission)

  return autorizado ? children : fallback
}
