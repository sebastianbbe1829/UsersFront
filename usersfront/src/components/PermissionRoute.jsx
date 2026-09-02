import { Navigate } from 'react-router-dom'
import { obtenerPayloadToken } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

function PermissionRoute({ permission, children }) {
  const { token, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <div className="text-muted">Validando permisos...</div>
        </div>
      </div>
    )
  }

  const payload = obtenerPayloadToken(token)
  const esSuper = payload?.user_type === 'SUPER'
  const permisos = Array.isArray(payload?.permissions)
    ? payload.permissions
    : []

  if (esSuper || permisos.includes(permission)) {
    return children
  }

  const tenant = payload?.tenant_slug
  return <Navigate to={tenant ? `/${tenant}` : '/'} replace />
}

export default PermissionRoute
