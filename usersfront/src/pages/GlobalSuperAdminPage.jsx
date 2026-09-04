import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { obtenerPayloadToken } from '../services/api'
import {
  actualizarGlobalSuper,
  crearGlobalSuper,
  obtenerGlobalSuper,
  obtenerGlobalSupers,
} from '../services/globalSuperAdminApi'
import SuperMfaModal from '../components/SuperMfaModal'

function GlobalSuperAdminPage() {
  const { token } = useAuth()
  const payload = obtenerPayloadToken(token)
  const esSuper = payload?.user_type === 'SUPER'
  const miId = Number(payload?.global_user_id || payload?.sub)

  const [supers, setSupers] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [modal, setModal] = useState(null)
  const [editando, setEditando] = useState(null)
  const [datosPendientes, setDatosPendientes] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [provisioningUri, setProvisioningUri] = useState('')

  const cargarSupers = useCallback(async () => {
    if (!esSuper || !token) {
      setCargando(false)
      return
    }

    try {
      setCargando(true)
      setError('')
      const resultado = await obtenerGlobalSupers(token)
      setSupers(Array.isArray(resultado) ? resultado : [])
    } catch (err) {
      setError(err.message || 'No fue posible cargar los usuarios SUPER.')
    } finally {
      setCargando(false)
    }
  }, [esSuper, token])

  useEffect(() => {
    void cargarSupers()
  }, [cargarSupers])

  const abrirCrear = () => {
    setMensaje('')
    setError('')
    setProvisioningUri('')
    setModal('crear')
  }

  const abrirEditar = async (item) => {
    setMensaje('')
    setError('')
    setEditando(item)
    setModal('editar')

    try {
      const completo = await obtenerGlobalSuper(item.id, token)
      setEditando(completo)
    } catch (err) {
      setError(err.message || 'No fue posible consultar el usuario SUPER.')
      setModal(null)
    }
  }

  const cancelar = () => {
    if (guardando) return
    setModal(null)
    setEditando(null)
    setDatosPendientes(null)
    setProvisioningUri('')
  }

  // El MFA se solicita únicamente después de completar y enviar el formulario.
  const continuarCrear = (datos) => {
    setDatosPendientes({ tipo: 'crear', datos })
    setModal('otp')
  }

  // El MFA se solicita únicamente después de completar y enviar el formulario.
  const continuarEditar = (datos) => {
    setDatosPendientes({ tipo: 'editar', datos, superId: editando.id })
    setModal('otp')
  }

  const confirmarOtp = async (otp) => {
    if (!datosPendientes) return

    try {
      setGuardando(true)
      setError('')

      if (datosPendientes.tipo === 'crear') {
        const resultado = await crearGlobalSuper(datosPendientes.datos, otp, token)
        setProvisioningUri(resultado?.provisioning_uri || '')
        setMensaje('Usuario SUPER creado correctamente. Debe configurar su autenticador antes de iniciar sesión.')
        setModal('provisionamiento')
      } else {
        await actualizarGlobalSuper(
          datosPendientes.superId,
          datosPendientes.datos,
          otp,
          token,
        )
        setMensaje('Usuario SUPER actualizado correctamente.')
        setModal(null)
        setEditando(null)
        setDatosPendientes(null)
        await cargarSupers()
      }
    } finally {
      setGuardando(false)
    }
  }

  if (!esSuper) {
    return <div className="alert alert-danger">No tienes privilegios SUPER para administrar usuarios globales.</div>
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="fw-bold mb-1">👑 Usuarios SUPER</h3>
        <p className="text-muted mb-0">Administración global de usuarios con privilegios SUPER.</p>
      </div>

      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
            <div>
              <h5 className="fw-bold mb-1">Usuarios globales</h5>
              <div className="text-muted">La consulta no requiere una nueva verificación MFA.</div>
            </div>
            <button type="button" className="btn btn-success text-nowrap" onClick={abrirCrear}>+ Crear SUPER</button>
          </div>

          {cargando ? (
            <div className="text-center py-5"><div className="spinner-border" role="status" /><div className="mt-3 text-muted">Cargando usuarios SUPER...</div></div>
          ) : supers.length === 0 ? (
            <div className="alert alert-warning mb-0">No hay usuarios SUPER registrados.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr><th>ID</th><th>Correo</th><th>Estado</th><th>MFA</th><th>Último acceso</th><th className="text-end">Acciones</th></tr>
                </thead>
                <tbody>
                  {supers.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td className="fw-semibold">{item.email}{item.id === miId && <span className="badge text-bg-primary ms-2">Yo</span>}</td>
                      <td><span className={`badge ${item.is_active ? 'text-bg-success' : 'text-bg-secondary'}`}>{item.is_active ? 'Activo' : 'Inactivo'}</span></td>
                      <td><span className={`badge ${item.mfa_verified_at ? 'text-bg-success' : 'text-bg-warning'}`}>{item.mfa_verified_at ? 'Verificado' : 'Pendiente'}</span></td>
                      <td>{item.last_login_at ? new Date(item.last_login_at).toLocaleString() : 'Nunca'}</td>
                      <td className="text-end">
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => abrirEditar(item)}>Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal === 'crear' && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,.65)', position: 'fixed', inset: 0, zIndex: 2050 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
            <div className="modal-content">
              <form onSubmit={(event) => { event.preventDefault(); continuarCrear({ email: event.currentTarget.email.value, password: event.currentTarget.password.value }) }}>
                <div className="modal-header"><h5 className="modal-title">Crear usuario SUPER</h5><button type="button" className="btn-close" onClick={cancelar} /></div>
                <div className="modal-body">
                  <div className="alert alert-info">Completa toda la información del usuario. Al pulsar «Crear SUPER» se solicitará la verificación MFA del SUPER que realiza la operación.</div>
                  <label className="form-label fw-semibold">Correo</label>
                  <input name="email" type="email" className="form-control mb-3" required />
                  <label className="form-label fw-semibold">Contraseña inicial</label>
                  <input name="password" type="password" className="form-control" minLength="12" maxLength="128" required />
                </div>
                <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={cancelar}>Cancelar</button><button type="submit" className="btn btn-primary">Crear SUPER</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {modal === 'editar' && editando && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,.65)', position: 'fixed', inset: 0, zIndex: 2050 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
            <div className="modal-content">
              <form onSubmit={(event) => {
                event.preventDefault()
                const datos = {
                  email: event.currentTarget.email.value || undefined,
                  password: event.currentTarget.password.value || undefined,
                  is_active: event.currentTarget.is_active.checked,
                }
                continuarEditar(datos)
              }}>
                <div className="modal-header"><h5 className="modal-title">Editar usuario SUPER</h5><button type="button" className="btn-close" onClick={cancelar} /></div>
                <div className="modal-body">
                  <div className="alert alert-info">Completa todos los cambios primero. Al pulsar «Guardar cambios» se solicitará la verificación MFA.</div>
                  <label className="form-label fw-semibold">Correo</label>
                  <input name="email" type="email" className="form-control mb-3" defaultValue={editando.email} required />
                  <label className="form-label fw-semibold">Nueva contraseña (opcional)</label>
                  <input name="password" type="password" className="form-control mb-3" minLength="12" maxLength="128" />
                  <div className="form-check"><input name="is_active" type="checkbox" className="form-check-input" id="superActivo" defaultChecked={editando.is_active} /><label className="form-check-label" htmlFor="superActivo">Usuario activo</label></div>
                </div>
                <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={cancelar}>Cancelar</button><button type="submit" className="btn btn-primary">Guardar cambios</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {modal === 'otp' && (
        <SuperMfaModal
          onConfirmar={confirmarOtp}
          onCancelar={() => { if (!guardando) setModal(datosPendientes?.tipo || null) }}
          guardando={guardando}
        />
      )}

      {modal === 'provisionamiento' && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,.65)', position: 'fixed', inset: 0, zIndex: 2200 }}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">Configuración MFA del nuevo SUPER</h5></div>
            <div className="modal-body">
              <p>Entrega esta información al nuevo usuario SUPER para registrarla en su aplicación Authenticator.</p>
              <label className="form-label fw-semibold">Provisioning URI</label>
              <textarea className="form-control" rows="5" readOnly value={provisioningUri} />
              <div className="alert alert-warning mt-3 mb-0">Esta información contiene el secreto de enrolamiento MFA. No la compartas con personas no autorizadas.</div>
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-primary" onClick={() => { setModal(null); setDatosPendientes(null); setProvisioningUri(''); void cargarSupers() }}>Cerrar</button></div>
          </div></div>
        </div>
      )}
    </div>
  )
}

export default GlobalSuperAdminPage
