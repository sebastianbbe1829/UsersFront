import {
  useEffect,
  useState,
} from 'react'

import {
  useAuth,
} from '../contexts/AuthContext'

import {
  actualizarTenant,
  obtenerPayloadToken,
  obtenerTenantActual,
} from '../services/api'


function TenantAdminPage() {

  const {
    tenant,
    token,
  } = useAuth()

  const [tenantData, setTenantData] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [form, setForm] = useState({
    name: '',
    slug: '',
    status: 1,
  })

  const payload = obtenerPayloadToken(token)
  const esSuper = payload?.user_type === 'SUPER'


  useEffect(() => {

    const cargarTenant = async () => {

      if (!esSuper || !token) {
        setCargando(false)
        return
      }

      try {
        setCargando(true)
        setError('')

        const resultado = await obtenerTenantActual(token)

        if (!resultado) {
          throw new Error('No fue posible obtener la información del tenant.')
        }

        setTenantData(resultado)
        setForm({
          name: resultado.name || '',
          slug: resultado.slug || '',
          status: resultado.status ?? 1,
        })

      } catch (err) {
        setError(err.message || 'No fue posible cargar el tenant.')
      } finally {
        setCargando(false)
      }
    }

    cargarTenant()

  }, [esSuper, token])


  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((actual) => ({
      ...actual,
      [name]: name === 'status' ? Number(value) : value,
    }))

    setMensaje('')
  }


  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!tenantData) {
      return
    }

    try {
      setGuardando(true)
      setError('')
      setMensaje('')

      const actualizado = await actualizarTenant(
        tenantData.id,
        {
          name: form.name.trim(),
          slug: form.slug.trim(),
          status: form.status,
        },
        token
      )

      setTenantData(actualizado)
      setForm({
        name: actualizado.name || '',
        slug: actualizado.slug || '',
        status: actualizado.status ?? 1,
      })

      setMensaje('Información del tenant actualizada correctamente.')

    } catch (err) {
      setError(err.message || 'No fue posible actualizar el tenant.')
    } finally {
      setGuardando(false)
    }
  }


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
          Consulta y actualiza la información de la empresa seleccionada.
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
            Esta administración corresponde únicamente al tenant del contexto actual.
          </div>

        </div>
      </div>


      {cargando && (
        <div className="card shadow-sm border-0">
          <div className="card-body text-center py-5">
            <div className="spinner-border" role="status" />
            <div className="mt-3 text-muted">
              Cargando información del tenant...
            </div>
          </div>
        </div>
      )}


      {!cargando && error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}


      {!cargando && tenantData && (
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">

            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">
                Información del tenant
              </h5>

              <span className={`badge ${form.status === 1 ? 'text-bg-success' : 'text-bg-secondary'}`}>
                {form.status === 1 ? 'Activo' : 'Inactivo'}
              </span>
            </div>


            {mensaje && (
              <div className="alert alert-success">
                {mensaje}
              </div>
            )}


            <form onSubmit={handleSubmit}>

              <div className="row g-3">

                <div className="col-md-3">
                  <label className="form-label fw-semibold">
                    ID
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={tenantData.id}
                    disabled
                  />
                </div>


                <div className="col-md-9">
                  <label className="form-label fw-semibold">
                    Nombre
                  </label>

                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={form.name}
                    onChange={handleChange}
                    minLength="2"
                    maxLength="150"
                    required
                  />
                </div>


                <div className="col-md-8">
                  <label className="form-label fw-semibold">
                    Slug
                  </label>

                  <input
                    type="text"
                    name="slug"
                    className="form-control"
                    value={form.slug}
                    onChange={handleChange}
                    minLength="2"
                    maxLength="100"
                    required
                  />

                  <div className="form-text">
                    Identificador utilizado en la URL del tenant.
                  </div>
                </div>


                <div className="col-md-4">
                  <label className="form-label fw-semibold">
                    Estado
                  </label>

                  <select
                    name="status"
                    className="form-select"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value={1}>Activo</option>
                    <option value={0}>Inactivo</option>
                  </select>
                </div>


                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Creado el
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={tenantData.created_at ? new Date(tenantData.created_at).toLocaleString() : ''}
                    disabled
                  />
                </div>


                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Creado por
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={tenantData.created_by || ''}
                    disabled
                  />
                </div>

              </div>


              <div className="d-flex justify-content-end mt-4">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}


export default TenantAdminPage
