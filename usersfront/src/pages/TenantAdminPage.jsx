import { useEffect, useState } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { obtenerPayloadToken } from '../services/api'
import {
  actualizarTenantComoSuper,
  crearTenantComoSuper,
  obtenerTodosLosTenants,
} from '../services/tenantAdminApi'
import TenantForm from '../components/TenantForm'
import EditTenantForm from '../components/EditTenantForm'
import SuperMfaModal from '../components/SuperMfaModal'

function TenantAdminPage() {
  const { tenant, token } = useAuth()

  const [tenants, setTenants] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [modal, setModal] = useState(null)
  const [tenantEditando, setTenantEditando] = useState(null)
  const [datosPendientes, setDatosPendientes] = useState(null)
  const [guardando, setGuardando] = useState(false)

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

  const abrirCrear = () => {
    setMensaje('')
    setError('')
    setModal('crear')
  }

  const abrirEditar = (item) => {
    setMensaje('')
    setError('')
    setTenantEditando(item)
    setModal('editar')
  }

  const cancelarFormulario = () => {
    if (guardando) return
    setModal(null)
    setTenantEditando(null)
    setDatosPendientes(null)
  }

  const continuarCrear = (datos) => {
    setDatosPendientes({ tipo: 'crear', datos })
    setModal('otp')
  }

  const continuarEditar = (datos) => {
    setDatosPendientes({ tipo: 'editar', datos, tenantId: tenantEditando.id })
    setModal('otp')
  }

  const confirmarOtp = async (otp) => {
    if (!datosPendientes) return

    try {
      setGuardando(true)
      setError('')

      if (datosPendientes.tipo === 'crear') {
        await crearTenantComoSuper(datosPendientes.datos, otp, token)
        setMensaje('Tenant creado y provisionado correctamente.')
      } else {
        await actualizarTenantComoSuper(
          datosPendientes.tenantId,
          datosPendientes.datos,
          otp,
          token,
        )
        setMensaje('Tenant actualizado correctamente.')
      }

      setModal(null)
      setTenantEditando(null)
      setDatosPendientes(null)
      await cargarTenants()
    } catch (err) {
      throw err
    } finally {
      setGuardando(false)
    }
  }

  if (!esSuper) {
    return (
      <div className="alert alert-danger">
        No tienes permisos para administrar tenants globalmente.
      </div>
    )
  }

  const tenantActual = tenants.find((item) => item.id === tenantActualId)

  return (
    <div>
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Administración de tenants</h3>
        <p className="text-muted mb-0">
          Como SUPER puedes consultar, crear y actualizar cualquier tenant del sistema.
        </p>
      </div>

      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
            <div>
              <h5 className="fw-bold mb-1">Tenants del sistema</h5>
              <div className="text-muted">Administración global de empresas.</div>
            </div>

            <button type="button" className="btn btn-success text-nowrap" onClick={abrirCrear}>
              + Crear tenant
            </button>
          </div>

          {cargando ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status" />
              <div className="mt-3 text-muted">Cargando tenants...</div>
            </div>
          ) : tenants.length === 0 ? (
            <div className="alert alert-warning mb-0">No hay tenants disponibles.</div>
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
                          <span className="badge text-bg-primary ms-2">Actual</span>
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
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => abrirEditar(item)}>
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
            <h5 className="fw-bold mb-3">Tenant seleccionado</h5>
            <div className="fs-5">🏢 {tenant}</div>
            <div className="alert alert-info mb-0 mt-3">
              <strong>Sesión SUPER activa.</strong>
              <br />
              Las operaciones de creación y actualización requieren una nueva verificación OTP.
            </div>
          </div>
        </div>
      )}

      {modal === 'crear' && (
        <TenantForm
          onContinuar={continuarCrear}
          onCancelar={cancelarFormulario}
        />
      )}

      {modal === 'editar' && tenantEditando && (
        <EditTenantForm
          tenant={tenantEditando}
          onContinuar={continuarEditar}
          onCancelar={cancelarFormulario}
        />
      )}

      {modal === 'otp' && (
        <SuperMfaModal
          onConfirmar={confirmarOtp}
          onCancelar={() => {
            if (guardando) return
            setModal(datosPendientes?.tipo || null)
          }}
          guardando={guardando}
        />
      )}
    </div>
  )
}

export default TenantAdminPage
