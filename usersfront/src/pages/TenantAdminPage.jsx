import {
  useAuth,
} from '../contexts/AuthContext'


function TenantAdminPage() {

  const {
    tenant,
    token,
  } = useAuth()

  const esSuper =
    (() => {
      try {
        const partes = token?.split('.')

        if (!token || partes?.length !== 3) {
          return false
        }

        const payload = JSON.parse(
          atob(
            partes[1]
              .replace(/-/g, '+')
              .replace(/_/g, '/')
          )
        )

        return payload?.user_type === 'SUPER'
      } catch {
        return false
      }
    })()


  if (!esSuper) {

    return (
      <div className="alert alert-danger">
        No tienes permisos para administrar este tenant.
      </div>
    )

  }


  return (

    <div>

      <div className="mb-4">
        <h3 className="fw-bold mb-1">
          Administración del tenant
        </h3>

        <p className="text-muted mb-0">
          Administración global de la empresa seleccionada.
        </p>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body">

          <h5 className="fw-bold">
            Tenant seleccionado
          </h5>

          <div className="fs-5 mb-3">
            🏢 {tenant}
          </div>

          <div className="alert alert-info mb-0">
            <strong>Sesión SUPER activa.</strong>
            <br />
            Desde esta sección se implementarán las operaciones
            administrativas globales del tenant.
          </div>

        </div>
      </div>

    </div>

  )

}


export default TenantAdminPage
