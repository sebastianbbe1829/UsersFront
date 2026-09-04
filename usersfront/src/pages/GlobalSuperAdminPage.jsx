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
  backgroundColor: 'rgba(0,0,0,.65)', position: 'fixed', inset: 0, zIndex: 2050,
  overflowY: 'auto', padding: '1rem 0',
}

const modalDialog = {
  width: 'calc(100% - 2rem)', maxWidth: '560px', margin: 'auto',
  minHeight: 'calc(100% - 2rem)', display: 'flex', alignItems: 'center',
}

function GlobalSuperAdminPage() {
  const { token } = useAuth()
  const tokenRef = useRef(token)
  const payload = obtenerPayloadToken(token)
  const esSuper = payload?.user_type === 'SUPER'
  const miId = Number(payload?.global_user_id || payload?.sub)

  useEffect(() => { tokenRef.current = token }, [token])

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
    if (!esSuper || !tokenActual) { setCargando(false); return }
    try {
      setCargando(true); setError('')
      const resultado = await obtenerGlobalSupers(tokenActual)
      setSupers(Array.isArray(resultado) ? resultado : [])
    } catch (err) {
      setError(err.message || 'No fue posible cargar los usuarios SUPER.')
    } finally { setCargando(false) }
  }, [esSuper])

  useEffect(() => { void cargarSupers() }, [cargarSupers])

  const abrirCrear = () => {
    setMensaje(''); setError(''); setMfaProvisioning(null); setModal('crear')
  }

  const abrirEditar = async (item) => {
    setMensaje(''); setError(''); setEditando(item); setModal('editar')
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
      setError(''); setMensaje(''); setCargandoQr(item.id)
      const resultado = await obtenerGlobalSuperMfaProvisioning(item.id, tokenRef.current)
      setMfaProvisioning(resultado); setModal('qr')
    } catch (err) {
      setError(err.message || 'No fue posible obtener el QR de configuración MFA.')
    } finally { setCargandoQr(null) }
  }

  const cancelar = () => {
    if (guardando) return
    setModal(null); setEditando(null); setDatosPendientes(null); setMfaProvisioning(null)
  }

  const continuarCrear = (datos) => {
    setDatosPendientes({ tipo: 'crear', datos }); setModal('otp')
  }

  const continuarEditar = (datos) => {
    setDatosPendientes({ tipo: 'editar', datos, superId: editando.id }); setModal('otp')
  }

  const confirmarOtp = async (otp) => {
    if (!datosPendientes) return
    try {
      setGuardando(true); setError('')
      if (datosPendientes.tipo === 'crear') {
        const resultado = await crearGlobalSuper(datosPendientes.datos, otp, tokenRef.current)
        setMfaProvisioning({ id: resultado.id, email: resultado.email, provisioning_uri: resultado.provisioning_uri })
        setMensaje(resultado.email_sent
          ? 'Usuario SUPER creado y correo enviado correctamente con el QR de configuración MFA.'
          : 'Usuario SUPER creado correctamente. Entrega el QR al nuevo usuario para configurar su MFA.')
        setDatosPendientes(null); setModal('qr'); await cargarSupers()
      } else {
        await actualizarGlobalSuper(datosPendientes.superId, datosPendientes.datos, otp, tokenRef.current)
        setMensaje('Usuario SUPER actualizado correctamente.')
        setModal(null); setEditando(null); setDatosPendientes(null); await cargarSupers()
      }
    } catch (err) {
      setError(err.message || 'No fue posible completar la operación.')
    } finally { setGuardando(false) }
  }

  const cerrarQr = () => {
    if (guardando) return
    setModal(null); setMfaProvisioning(null)
  }

  if (!esSuper) return <div className="alert alert-danger">No tienes privilegios SUPER para administrar usuarios globales.</div>

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
            <div><h5 className="fw-bold mb-1">Usuarios globales</h5><div className="text-muted">Gestiona la información y seguridad de las cuentas SUPER.</div></div>
            <button type="button" className="btn btn-success text-nowrap" onClick={abrirCrear}>+ Crear SUPER</button>
          </div>

          {cargando ? <div className="text-center py-5"><div className="spinner-border" role="status" /><div className="mt-3 text-muted">Cargando usuarios SUPER...</div></div>
            : supers.length === 0 ? <div className="alert alert-warning mb-0">No hay usuarios SUPER registrados.</div>
            : <div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr>
              <th>ID</th><th>DNI</th><th>Nombre</th><th>Teléfono</th><th>Correo</th><th>Estado</th><th>MFA</th><th>Acciones</th>
            </tr></thead><tbody>{supers.map((item) => <tr key={item.id}>
              <td>{item.id}</td><td>{item.dni || '—'}</td><td className="fw-semibold">{item.name || '—'}{item.id === miId && <span className="badge text-bg-primary ms-2">Yo</span>}</td>
              <td>{item.phone || '—'}</td><td>{item.email}</td>
              <td><span className={`badge ${item.is_active ? 'text-bg-success' : 'text-bg-secondary'}`}>{item.is_active ? 'Activo' : 'Inactivo'}</span></td>
              <td><span className={`badge ${item.mfa_verified_at ? 'text-bg-success' : 'text-bg-warning'}`}>{item.mfa_verified_at ? 'Verificado' : 'Pendiente'}</span></td>
              <td><div className="d-flex gap-2"><button type="button" className="btn btn-sm btn-outline-success" onClick={() => visualizarQr(item)} disabled={!item.is_active || cargandoQr === item.id}>{cargandoQr === item.id ? 'Cargando…' : 'Ver QR'}</button><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => abrirEditar(item)}>Editar</button></div></td>
            </tr>)}</tbody></table></div>}
        </div>
      </div>

      {modal === 'crear' && <div className="modal d-block" style={modalBackdrop}><div className="modal-dialog" style={modalDialog}><div className="modal-content w-100">
        <form onSubmit={(event) => { event.preventDefault(); continuarCrear({
          dni: event.currentTarget.dni.value.trim(), name: event.currentTarget.name.value.trim(), phone: event.currentTarget.phone.value.trim(),
          email: event.currentTarget.email.value.trim(), password: event.currentTarget.password.value, send_email: event.currentTarget.send_email.checked,
        }) }}>
          <div className="modal-header py-2 px-3"><div><h5 className="modal-title mb-1">Nuevo usuario SUPER</h5><div className="text-muted small">Datos personales y credenciales de la cuenta global.</div></div><button type="button" className="btn-close" onClick={cancelar} /></div>
          <div className="modal-body py-3 px-3">
            <div className="alert alert-info py-2 mb-3">Tu MFA se utilizará para autorizar la creación. El MFA del nuevo usuario será independiente y lo configurará él con el QR.</div>
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label fw-semibold mb-1">DNI</label><input name="dni" className="form-control" maxLength="20" required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold mb-1">Nombre completo</label><input name="name" className="form-control" maxLength="100" required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold mb-1">Teléfono</label><input name="phone" type="tel" className="form-control" maxLength="30" required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold mb-1">Correo electrónico</label><input name="email" type="email" className="form-control" autoComplete="email" required /></div>
              <div className="col-12"><label className="form-label fw-semibold mb-1">Contraseña inicial</label><input name="password" type="password" className="form-control" autoComplete="new-password" minLength="12" maxLength="128" required /></div>
            </div>
            <div className="form-check mt-3"><input name="send_email" type="checkbox" className="form-check-input" id="sendSuperEmail" defaultChecked /><label className="form-check-label" htmlFor="sendSuperEmail">Enviar correo al usuario con instrucciones y QR para configurar MFA</label></div>
          </div>
          <div className="modal-footer py-2 px-3"><button type="button" className="btn btn-secondary" onClick={cancelar}>Cancelar</button><button type="submit" className="btn btn-primary">Crear usuario SUPER</button></div>
        </form>
      </div></div></div>}

      {modal === 'editar' && editando && <div className="modal d-block" style={modalBackdrop}><div className="modal-dialog" style={modalDialog}><div className="modal-content w-100">
        <form onSubmit={(event) => { event.preventDefault(); continuarEditar({ name: event.currentTarget.name.value.trim(), phone: event.currentTarget.phone.value.trim(), password: event.currentTarget.password.value || undefined, is_active: event.currentTarget.is_active.checked }) }}>
          <div className="modal-header py-2 px-3"><div><h5 className="modal-title mb-1">Editar usuario SUPER</h5><div className="text-muted small">El correo y el DNI son identificadores permanentes.</div></div><button type="button" className="btn-close" onClick={cancelar} /></div>
          <div className="modal-body py-3 px-3">
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label fw-semibold mb-1">DNI</label><input className="form-control" value={editando.dni || ''} disabled readOnly /></div>
              <div className="col-md-6"><label className="form-label fw-semibold mb-1">Correo electrónico</label><input className="form-control" value={editando.email} disabled readOnly /></div>
              <div className="col-md-6"><label className="form-label fw-semibold mb-1">Nombre completo</label><input name="name" className="form-control" defaultValue={editando.name || ''} maxLength="100" required /></div>
              <div className="col-md-6"><label className="form-label fw-semibold mb-1">Teléfono</label><input name="phone" type="tel" className="form-control" defaultValue={editando.phone || ''} maxLength="30" required /></div>
              <div className="col-12"><label className="form-label fw-semibold mb-1">Nueva contraseña (opcional)</label><input name="password" type="password" className="form-control" autoComplete="new-password" minLength="12" maxLength="128" /></div>
              <div className="col-12"><div className="form-check"><input name="is_active" type="checkbox" className="form-check-input" id="superActivo" defaultChecked={editando.is_active} /><label className="form-check-label" htmlFor="superActivo">Usuario activo</label></div></div>
            </div>
          </div>
          <div className="modal-footer py-2 px-3"><button type="button" className="btn btn-secondary" onClick={cancelar}>Cancelar</button><button type="submit" className="btn btn-primary">Guardar cambios</button></div>
        </form>
      </div></div></div>}

      {modal === 'otp' && <SuperMfaModal onConfirmar={confirmarOtp} onCancelar={() => { if (!guardando) setModal(datosPendientes?.tipo || null) }} guardando={guardando} />}

      {modal === 'qr' && mfaProvisioning && <div className="modal d-block" style={{ ...modalBackdrop, zIndex: 2200 }}><div className="modal-dialog" style={{ ...modalDialog, maxWidth: '480px' }}><div className="modal-content w-100">
        <div className="modal-header py-2 px-3"><div><h5 className="modal-title mb-1">Configuración MFA</h5><div className="text-muted small">{mfaProvisioning.email}</div></div></div>
        <div className="modal-body text-center py-2 px-3"><p className="mb-2">Este QR corresponde al MFA del nuevo usuario SUPER.</p><div className="d-flex justify-content-center mb-3"><div className="bg-white p-2 rounded border shadow-sm" style={{ maxWidth: 'min(260px, 65vw)' }}><QRCodeSVG value={mfaProvisioning.provisioning_uri} size={220} level="M" includeMargin style={{ width: '100%', height: 'auto', display: 'block' }} /></div></div>
          <div className="alert alert-info text-start py-2 mb-2 small"><strong>Primer ingreso:</strong> el nuevo usuario debe escanear este QR y usar su código de 6 dígitos al iniciar sesión. El MFA quedará verificado automáticamente.</div>
          <div className="alert alert-warning text-start py-2 mb-0 small">El QR es un secreto de seguridad. Compártelo únicamente con el usuario autorizado.</div>
        </div>
        <div className="modal-footer py-2 px-3"><button type="button" className="btn btn-primary" onClick={cerrarQr}>Cerrar</button></div>
      </div></div></div>}
    </div>
  )
}

export default GlobalSuperAdminPage
