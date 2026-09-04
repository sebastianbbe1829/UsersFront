import { useCallback, useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

import { useAuth } from '../contexts/AuthContext'
import { obtenerPayloadToken } from '../services/api'
import {
  actualizarGlobalSuper,
  crearGlobalSuper,
  obtenerGlobalSuper,
  obtenerGlobalSuperMfaProvisioning,
  obtenerGlobalSupers,
} from '../services/globalSuperAdminApi'
import SuperMfaModal from '../components/SuperMfaModal'

const modalBackdrop = {
  backgroundColor: 'rgba(0,0,0,.65)',
  position: 'fixed',
  inset: 0,
  zIndex: 2050,
  overflowY: 'auto',
  padding: '1rem 0',
}

const modalDialog = {
  width: 'calc(100% - 2rem)',
  maxWidth: '500px',
  margin: 'auto',
  minHeight: 'calc(100% - 2rem)',
  display: 'flex',
  alignItems: 'center',
}

function GlobalSuperAdminPage() {
  const { token } = useAuth()
  const tokenRef = useRef(token)
  const payload = obtenerPayloadToken(token)
  const esSuper = payload?.user_type === 'SUPER'
  const miId = Number(payload?.global_user_id || payload?.sub)

  useEffect(() => {
    tokenRef.current = token
  }, [token])

  const [supers, setSupers] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [modal, setModal] = useState(null)
  const [editando, setEditando] = useState(null)
  const [datosPendientes, setDatosPendientes] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mfaProvisioning, setMfaProvisioning] = useState(null)
  const [cargandoQr, setCargandoQr] = useState(null)

  const cargarSupers = useCallback(async () => {
    const tokenActual = tokenRef.current

    if (!esSuper || !tokenActual) {
      setCargando(false)
      return
    }

    try {
      setCargando(true)
      setError('')
      const resultado = await obtenerGlobalSupers(tokenActual)
      setSupers(Array.isArray(resultado) ? resultado : [])
    } catch (err) {
      setError(err.message || 'No fue posible cargar los usuarios SUPER.')
    } finally {
      setCargando(false)
    }
  }, [esSuper])

  useEffect(() => {
    void cargarSupers()
  }, [cargarSupers])

  const abrirCrear = () => {
    setMensaje('')
    setError('')
    setMfaProvisioning(null)
    setModal('crear')
  }

  const abrirEditar = async (item) => {
    setMensaje('')
    setError('')
    setEditando(item)
    setModal('editar')

    try {
      const completo = await obtenerGlobalSuper(item.id, tokenRef.current)
      setEditando(completo)
    } catch (err) {
      setError(err.message || 'No fue posible consultar el usuario SUPER.')
      setModal(null)
    }
  }

  const visualizarQr = async (item) => {
    if (!item?.id || !item.is_active) return

    try {
      setError('')
      setMensaje('')
      setCargandoQr(item.id)
      const resultado = await obtenerGlobalSuperMfaProvisioning(item.id, tokenRef.current)
      setMfaProvisioning(resultado)
      setModal('qr')
    } catch (err) {
      setError(err.message || 'No fue posible obtener el QR de configuración MFA.')
    } finally {
      setCargandoQr(null)
    }
  }

  const cancelar = () => {
    if (guardando) return
    setModal(null)
    setEditando(null)
    setDatosPendientes(null)
    setMfaProvisioning(null)
  }

  const continuarCrear = (datos) => {
    setDatosPendientes({ tipo: 'crear', datos })
    setModal('otp')
  }

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
        const resultado = await crearGlobalSuper(datosPendientes.datos, otp, tokenRef.current)
        setMfaProvisioning({
          id: resultado.id,
          email: resultado.email,
          provisioning_uri: resultado.provisioning_uri,
        })
        setMensaje('Usuario SUPER creado correctamente. Entrega este QR al nuevo usuario para que lo configure en su Authenticator. El MFA se activará cuando el nuevo usuario realice su primer inicio de sesión con un código válido.')
        setDatosPendientes(null)
        setModal('qr')
      } else {
        await actualizarGlobalSuper(
          datosPendientes.superId,
          datosPendientes.datos,
          otp,
          tokenRef.current,
        )
        setMensaje('Usuario SUPER actualizado correctamente.')
        setModal(null)
        setEditando(null)
        setDatosPendientes(null)
        await cargarSupers()
      }
    } catch (err) {
      setError(err.message || 'No fue posible completar la operación.')
    } finally {
      setGuardando(false)
    }
  }

  const cerrarQr = () => {
    if (guardando) return
    setModal(null)
    setMfaProvisioning(null)
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
              <div className="text-muted">La consulta y visualización del QR están protegidas por la sesión SUPER.</div>
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
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            onClick={() => visualizarQr(item)}
                            disabled={!item.is_active || cargandoQr === item.id}
                            title={!item.is_active ? 'El usuario está inactivo' : 'Visualizar QR de configuración MFA'}
                          >
                            {cargandoQr === item.id ? 'Cargando…' : 'Ver QR'}
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => abrirEditar(item)}>Editar</button>
                        </div>
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
        <div className="modal d-block" style={modalBackdrop}>
          <div className="modal-dialog" style={modalDialog}>
            <div className="modal-content w-100">
              <form onSubmit={(event) => { event.preventDefault(); continuarCrear({ email: event.currentTarget.email.value, password: event.currentTarget.password.value }) }}>
                <div className="modal-header py-2 px-3">
                  <div>
                    <h5 className="modal-title mb-1">Nuevo usuario SUPER</h5>
                    <div className="text-muted small">Crear una nueva cuenta de acceso global.</div>
                  </div>
                  <button type="button" className="btn-close" onClick={cancelar} />
                </div>
                <div className="modal-body py-3 px-3">
                  <div className="alert alert-info py-2 mb-3">
                    Estás creando una cuenta nueva. La contraseña que registres será la <strong>contraseña inicial del nuevo usuario SUPER</strong>; no es tu contraseña de inicio de sesión.
                  </div>
                  <label className="form-label fw-semibold mb-1">Correo electrónico del nuevo usuario</label>
                  <input name="email" type="email" className="form-control mb-3" autoComplete="email" required />
                  <label className="form-label fw-semibold mb-1">Nueva contraseña</label>
                  <input name="password" type="password" className="form-control" autoComplete="new-password" minLength="12" maxLength="128" required />
                </div>
                <div className="modal-footer py-2 px-3">
                  <button type="button" className="btn btn-secondary" onClick={cancelar}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Crear usuario SUPER</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {modal === 'editar' && editando && (
        <div className="modal d-block" style={modalBackdrop}>
          <div className="modal-dialog" style={modalDialog}>
            <div className="modal-content w-100">
              <form onSubmit={(event) => {
                event.preventDefault()
                const datos = {
                  email: event.currentTarget.email.value || undefined,
                  password: event.currentTarget.password.value || undefined,
                  is_active: event.currentTarget.is_active.checked,
                }
                continuarEditar(datos)
              }}>
                <div className="modal-header py-2 px-3">
                  <div>
                    <h5 className="modal-title mb-1">Editar usuario SUPER</h5>
                    <div className="text-muted small">Actualiza los datos de la cuenta global.</div>
                  </div>
                  <button type="button" className="btn-close" onClick={cancelar} />
                </div>
                <div className="modal-body py-3 px-3">
                  <div className="alert alert-info py-2 mb-3">Los cambios se aplicarán después de confirmar la verificación MFA.</div>
                  <label className="form-label fw-semibold mb-1">Correo electrónico</label>
                  <input name="email" type="email" className="form-control mb-3" autoComplete="email" defaultValue={editando.email} required />
                  <label className="form-label fw-semibold mb-1">Nueva contraseña (opcional)</label>
                  <input name="password" type="password" className="form-control mb-3" autoComplete="new-password" minLength="12" maxLength="128" />
                  <div className="form-check"><input name="is_active" type="checkbox" className="form-check-input" id="superActivo" defaultChecked={editando.is_active} /><label className="form-check-label" htmlFor="superActivo">Usuario activo</label></div>
                </div>
                <div className="modal-footer py-2 px-3">
                  <button type="button" className="btn btn-secondary" onClick={cancelar}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Guardar cambios</button>
                </div>
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

      {modal === 'qr' && mfaProvisioning && (
        <div className="modal d-block" style={{ ...modalBackdrop, zIndex: 2200 }}>
          <div className="modal-dialog" style={{ ...modalDialog, maxWidth: '480px' }}>
            <div className="modal-content w-100">
              <div className="modal-header py-2 px-3">
                <div>
                  <h5 className="modal-title mb-1">Configuración MFA</h5>
                  <div className="text-muted small">{mfaProvisioning.email}</div>
                </div>
              </div>
              <div className="modal-body text-center py-2 px-3">
                <p className="mb-2">Escanea este código QR desde la aplicación Authenticator del nuevo usuario SUPER.</p>
                <div className="d-flex justify-content-center mb-3">
                  <div className="bg-white p-2 rounded border shadow-sm" style={{ maxWidth: 'min(260px, 65vw)' }}>
                    <QRCodeSVG value={mfaProvisioning.provisioning_uri} size={220} level="M" includeMargin style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                </div>
                <div className="alert alert-info text-start py-2 mb-2 small">
                  <strong>Activación:</strong> el nuevo usuario debe escanear este QR y usar el código de 6 dígitos durante su primer inicio de sesión. Al validar correctamente ese código, su MFA quedará activado automáticamente.
                </div>
                <div className="alert alert-warning text-start py-2 mb-0 small">
                  El QR contiene el secreto de enrolamiento MFA. Muéstralo únicamente a la persona autorizada y evita compartir capturas.
                </div>
              </div>
              <div className="modal-footer py-2 px-3">
                <button type="button" className="btn btn-primary" onClick={cerrarQr}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GlobalSuperAdminPage
