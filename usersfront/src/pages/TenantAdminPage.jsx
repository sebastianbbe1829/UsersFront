import {
  useEffect,
  useState,
} from 'react'

import {
  useAuth,
} from '../contexts/AuthContext'

import {
  obtenerPayloadToken,
} from '../services/api'

import {
  actualizarTenantComoSuper,
  crearTenantComoSuper,
  obtenerTodosLosTenants,
} from '../services/tenantAdminApi'


const formularioCrearInicial = {
  tenant_name: '',
  tenant_slug: '',
  admin_dni: '',
  admin_name: '',
  admin_email: '',
  admin_password: '',
  admin_phone: '',
}


function TenantAdminPage() {

  const {
    tenant,
    token,
  } = useAuth()

  const [tenants, setTenants] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [modo, setModo] = useState(null)
  const [tenantEditando, setTenantEditando] = useState(null)
  const [formEditar, setFormEditar] = useState({
    name: '',
    slug: '',
    status: 1,
  })

  const [formCrear, setFormCrear] = useState(formularioCrearInicial)

  const [otpModalAbierto, setOtpModalAbierto] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')

  const payload = obtenerPayloadToken(token)
  const esSuper = payload?.user_type === 'SUPER'
  const tenantActualId = Number(payload?.tenant_id)


  const cargarTenants = async () => {
    if (!esSuper || !token) {
      setCargando(false)
      return
    }

    try {
      setCargando(true)
      setError('')

      const resultado = await obtenerTodosLosTenants(token)
      setTenants(Array.isArray(resultado) ? resultado : [])
    } catch (err) {
      setError(err.message || 'No fue posible cargar los tenants.')
    } finally {
      setCargando(false)
    }
  }


  useEffect(() => {
    cargarTenants()
  }, [esSuper, token])


  const tenantActual = tenants.find(
    (item) => item.id === tenantActualId
  )


  const abrirEdicion = (item) => {
    setTenantEditando(item)
    setFormEditar({
      name: item.name || '',
      slug: item.slug || '',
      status: item.status ?? 1,
    })
    setModo('editar')
    setMensaje('')
    setError('')
  }


  const abrirCreacion = () => {
    setFormCrear(formularioCrearInicial)
    setModo('crear')
    setMensaje('')
    setError('')
  }


  const cerrarFormulario = () => {
    if (guardando) return

    setModo(null)
    setTenantEditando(null)
    setFormCrear(formularioCrearInicial)
    setError('')
  }


  const abrirVerificacionOtp = (event) => {
    event.preventDefault()
    setOtp('')
    setOtpError('')
    setOtpModalAbierto(true)
  }


  const cerrarVerificacionOtp = () => {
    if (guardando) return

    setOtpModalAbierto(false)
    setOtp('')
    setOtpError('')
  }


  const confirmarOperacion = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setOtpError('Ingresa un código OTP válido de 6 dígitos.')
      return
    }

    try {
      setGuardando(true)
      setOtpError('')
      setError('')

      if (modo === 'crear') {
        await crearTenantComoSuper(
          formCrear,
          otp,
          token
        )

        setMensaje('Tenant creado y provisionado correctamente.')
        setModo(null)
        setFormCrear(formularioCrearInicial)
      }

      if (modo === 'editar' && tenantEditando) {
        await actualizarTenantComoSuper(
          tenantEditando.id,
          formEditar,
          otp,
          token
        )

        setMensaje('Tenant actualizado correctamente.')
        setModo(null)
        setTenantEditando(null)
      }

      setOtpModalAbierto(false)
      setOtp('')
      await cargarTenants()

    } catch (err) {
      setOtpError(err.message || 'No fue posible completar la operación.')
    } finally {
      setGuardando(false)
    }
  }


  const handleCrearChange = (event) => {
    const { name, value } = event.target

    setFormCrear((actual) => ({
      ...actual,
      [name]: value,
    }))

    setError('')
  }


  const handleEditarChange = (event) => {
    const { name, value } = event.target

    setFormEditar((actual) => ({
      ...actual,
      [name]: name === 'status' ? Number(value) : value,
    }))

    setError('')
  }


  if (!esSuper) {
    return (
      <div className="alert alert-danger">
        No tienes permisos para administrar tenants globalmente.
      </div>
    )
  }


  return (
    <div>

      <div className="mb-4">
        <h3 className="fw-bold mb-1">
          Administración de tenants
        </h3>

        <p className="text-muted mb-0">
          Como SUPER puedes consultar, crear y actualizar cualquier tenant del sistema.
        </p>
      </div>


      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h5 className="fw-bold mb-3">
            Tenant seleccionado
          </h5>

          <div className="fs-5">
            🏢 {tenant}
          </div>

          <div className="alert alert-info mb-0 mt-3">
            <strong>Sesión SUPER activa.</strong>
            <br />
            Las operaciones de creación y actualización requieren una nueva verificación OTP.
          </div>
        </div>
      </div>


      {mensaje && (
        <div className="alert alert-success">
          {mensaje}
        </div>
      )}


      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}


      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
            <div>
              <h5 className="fw-bold mb-1">
                Tenants del sistema
              </h5>
              <div className="text-muted">
                Administración global de empresas.
              </div>
            </div>

            <button
              type="button"
              className="btn btn-success text-nowrap"
              onClick={abrirCreacion}
            >
              + Crear tenant
            </button>
          </div>


          {cargando ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status" />
              <div className="mt-3 text-muted">
                Cargando tenants...
              </div>
            </div>
          ) : tenants.length === 0 ? (
            <div className="alert alert-warning mb-0">
              No hay tenants disponibles.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Slug</th>
                    <th>Estado</th>
                    <th>Creado por</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td className="fw-semibold">
                        {item.name}
                        {item.id === tenantActualId && (
                          <span className="badge text-bg-primary ms-2">
                            Actual
                          </span>
                        )}
                      </td>
                      <td>{item.slug}</td>
                      <td>
                        <span className={`badge ${item.status === 1 ? 'text-bg-success' : 'text-bg-secondary'}`}>
                          {item.status === 1 ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>{item.created_by}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => abrirEdicion(item)}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>


      {tenantActual && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h5 className="fw-bold mb-3">
              Tenant actual
            </h5>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label fw-semibold">ID</label>
                <input className="form-control" value={tenantActual.id} disabled />
              </div>
              <div className="col-md-5">
                <label className="form-label fw-semibold">Nombre</label>
                <input className="form-control" value={tenantActual.name} disabled />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Slug</label>
                <input className="form-control" value={tenantActual.slug} disabled />
              </div>
            </div>
          </div>
        </div>
      )}


      {modo === 'crear' && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold mb-1">Crear tenant</h5>
                <div className="text-muted">
                  Provisiona el tenant y su administrador inicial.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={cerrarFormulario}
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={abrirVerificacionOtp}>
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label fw-semibold">Nombre del tenant</label>
                  <input
                    name="tenant_name"
                    className="form-control"
                    value={formCrear.tenant_name}
                    onChange={handleCrearChange}
                    minLength="2"
                    maxLength="150"
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Slug</label>
                  <input
                    name="tenant_slug"
                    className="form-control"
                    value={formCrear.tenant_slug}
                    onChange={handleCrearChange}
                    minLength="2"
                    maxLength="100"
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">DNI administrador</label>
                  <input
                    name="admin_dni"
                    className="form-control"
                    value={formCrear.admin_dni}
                    onChange={handleCrearChange}
                    minLength="5"
                    maxLength="20"
                    required
                  />
                </div>

                <div className="col-md-8">
                  <label className="form-label fw-semibold">Nombre administrador</label>
                  <input
                    name="admin_name"
                    className="form-control"
                    value={formCrear.admin_name}
                    onChange={handleCrearChange}
                    minLength="2"
                    maxLength="100"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Correo administrador</label>
                  <input
                    type="email"
                    name="admin_email"
                    className="form-control"
                    value={formCrear.admin_email}
                    onChange={handleCrearChange}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Teléfono</label>
                  <input
                    name="admin_phone"
                    className="form-control"
                    value={formCrear.admin_phone}
                    onChange={handleCrearChange}
                    minLength="7"
                    maxLength="20"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Contraseña inicial</label>
                  <input
                    type="password"
                    name="admin_password"
                    className="form-control"
                    value={formCrear.admin_password}
                    onChange={handleCrearChange}
                    minLength="6"
                    required
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end mt-4">
                <button type="submit" className="btn btn-primary">
                  Continuar y verificar OTP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {modo === 'editar' && tenantEditando && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold mb-1">Editar tenant</h5>
                <div className="text-muted">
                  Tenant #{tenantEditando.id} · {tenantEditando.slug}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={cerrarFormulario}
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={abrirVerificacionOtp}>
              <div className="row g-3">
                <div className="col-md-7">
                  <label className="form-label fw-semibold">Nombre</label>
                  <input
                    name="name"
                    className="form-control"
                    value={formEditar.name}
                    onChange={handleEditarChange}
                    minLength="2"
                    maxLength="150"
                    required
                  />
                </div>

                <div className="col-md-5">
                  <label className="form-label fw-semibold">Slug</label>
                  <input
                    name="slug"
                    className="form-control"
                    value={formEditar.slug}
                    onChange={handleEditarChange}
                    minLength="2"
                    maxLength="100"
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Estado</label>
                  <select
                    name="status"
                    className="form-select"
                    value={formEditar.status}
                    onChange={handleEditarChange}
                  >
                    <option value={1}>Activo</option>
                    <option value={0}>Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="d-flex justify-content-end mt-4">
                <button type="submit" className="btn btn-primary">
                  Continuar y verificar OTP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {otpModalAbierto && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  Verificación SUPER
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={cerrarVerificacionOtp}
                  disabled={guardando}
                />
              </div>

              <div className="modal-body">
                <p className="text-muted">
                  Esta operación es sensible. Ingresa el código OTP actual de tu autenticador para continuar.
                </p>

                <label className="form-label fw-semibold">
                  Código OTP
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg text-center"
                  value={otp}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                    setOtpError('')
                  }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength="6"
                  placeholder="000000"
                  autoFocus
                />

                {otpError && (
                  <div className="alert alert-danger mt-3 mb-0">
                    {otpError}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={cerrarVerificacionOtp}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={confirmarOperacion}
                  disabled={guardando || otp.length !== 6}
                >
                  {guardando ? 'Verificando...' : 'Verificar y continuar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}


export default TenantAdminPage
