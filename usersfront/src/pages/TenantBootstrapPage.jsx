import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { bootstrapTenant } from '../services/api'


function TenantBootstrapPage() {
  const navigate = useNavigate()

  const [tenantName, setTenantName] = useState('')
  const [tenantSlug, setTenantSlug] = useState('')
  const [adminDni, setAdminDni] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminPhone, setAdminPhone] = useState('')
  const [bootstrapKey, setBootstrapKey] = useState('')
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const manejarBootstrap = async (event) => {
    event.preventDefault()
    setError('')
    setResultado(null)
    setCargando(true)

    try {
      const respuesta = await bootstrapTenant(
        tenantName,
        tenantSlug,
        adminDni,
        adminName,
        adminEmail,
        adminPassword,
        adminPhone,
        bootstrapKey
      )

      setResultado(respuesta)
    } catch (errorApi) {
      setError(errorApi.message)
    } finally {
      setCargando(false)
    }
  }

  const irAlTenant = () => {
    if (resultado?.tenant_slug) {
      navigate(`/${resultado.tenant_slug}/login`, { replace: true })
    }
  }

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-4">
      <div className="card shadow border-0" style={{ width: '100%', maxWidth: '820px' }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="fs-1 mb-2">🏢</div>
            <h2 className="fw-bold mb-1">Bootstrap de Tenant</h2>
            <p className="text-muted mb-0">
              Pantalla técnica para provisionar una nueva empresa y su administrador inicial.
            </p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <strong>No fue posible completar el bootstrap.</strong>
              <div className="mt-1">{error}</div>
            </div>
          )}

          {resultado ? (
            <div>
              <div className="alert alert-success" role="alert">
                <h5 className="fw-bold mb-2">Bootstrap realizado correctamente</h5>
                <div>El tenant y su administrador inicial fueron creados.</div>
              </div>

              <div className="card border mb-4">
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="text-muted small">Tenant</div>
                      <div className="fw-semibold">{resultado.tenant_name}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted small">Slug</div>
                      <div className="fw-semibold">{resultado.tenant_slug}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted small">Administrador</div>
                      <div className="fw-semibold">{resultado.user_name}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted small">Correo</div>
                      <div className="fw-semibold text-break">{resultado.user_email}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted small">Rol</div>
                      <div className="fw-semibold">{resultado.role_name} ({resultado.role_code})</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted small">Tenant ID</div>
                      <div className="fw-semibold">{resultado.tenant_id}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-primary flex-grow-1"
                  onClick={irAlTenant}
                >
                  Ir al inicio de sesión
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => window.location.reload()}
                >
                  Nuevo bootstrap
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={manejarBootstrap}>
              <div className="alert alert-warning">
                <strong>Uso técnico.</strong><br />
                Esta operación crea un tenant, su usuario inicial, el rol ADMIN y sus permisos.
                La clave de bootstrap se utiliza únicamente para autorizar esta operación.
              </div>

              <h5 className="fw-bold mb-3">Empresa</h5>

              <div className="row g-3 mb-4">
                <div className="col-md-7">
                  <label className="form-label fw-semibold">Nombre del tenant</label>
                  <input
                    type="text"
                    className="form-control"
                    value={tenantName}
                    onChange={(event) => setTenantName(event.target.value)}
                    minLength={2}
                    maxLength={150}
                    required
                  />
                </div>

                <div className="col-md-5">
                  <label className="form-label fw-semibold">Slug</label>
                  <input
                    type="text"
                    className="form-control"
                    value={tenantSlug}
                    onChange={(event) => setTenantSlug(event.target.value.toLowerCase().trim())}
                    minLength={2}
                    maxLength={100}
                    required
                  />
                  <div className="form-text">Identificador utilizado en la URL.</div>
                </div>
              </div>

              <h5 className="fw-bold mb-3">Administrador inicial</h5>

              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">DNI</label>
                  <input
                    type="text"
                    className="form-control"
                    value={adminDni}
                    onChange={(event) => setAdminDni(event.target.value)}
                    minLength={5}
                    maxLength={20}
                    required
                  />
                </div>

                <div className="col-md-8">
                  <label className="form-label fw-semibold">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    value={adminName}
                    onChange={(event) => setAdminName(event.target.value)}
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Correo electrónico</label>
                  <input
                    type="email"
                    className="form-control"
                    value={adminEmail}
                    onChange={(event) => setAdminEmail(event.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Teléfono</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={adminPhone}
                    onChange={(event) => setAdminPhone(event.target.value)}
                    minLength={7}
                    maxLength={20}
                    placeholder="Opcional"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Contraseña inicial</label>
                  <input
                    type="password"
                    className="form-control"
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                    minLength={6}
                    required
                    autoComplete="new-password"
                  />
                  <div className="form-text">Mínimo 6 caracteres.</div>
                </div>
              </div>

              <h5 className="fw-bold mb-3">Autorización técnica</h5>

              <div className="mb-4">
                <label className="form-label fw-semibold">X-Bootstrap-Key</label>
                <input
                  type="password"
                  className="form-control"
                  value={bootstrapKey}
                  onChange={(event) => setBootstrapKey(event.target.value)}
                  required
                  autoComplete="off"
                />
                <div className="form-text">
                  Se envía únicamente en el header de la petición de bootstrap.
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={cargando}
              >
                {cargando ? 'Creando tenant...' : 'Crear tenant'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}


export default TenantBootstrapPage
