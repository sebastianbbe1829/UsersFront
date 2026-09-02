import { useAuth } from '../contexts/AuthContext'
import { obtenerPayloadToken } from '../services/api'

export default function Can({
  permission,
  permissions = [],
  mode = 'any',
  children,
  fallback = null,
  allowSuper = true,
}) {
  const { hasPermission, token } = useAuth()
  const payload = obtenerPayloadToken(token)
  const esSuper = payload?.user_type === 'SUPER'

  const requiredPermissions = permission
    ? [permission]
    : permissions

  const autorizadoPorPermiso = mode === 'all'
    ? requiredPermissions.every(hasPermission)
    : requiredPermissions.some(hasPermission)

  const autorizado = (allowSuper && esSuper) || autorizadoPorPermiso

  return autorizado ? children : fallback
}
