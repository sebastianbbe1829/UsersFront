import { useState } from 'react'
import { actualizarUsuario } from '../services/api'
import { validaciones } from '../utils/validaciones'

function EditUserForm({
  usuario,
  token,
  onUsuarioActualizado,
  onCancelar,
}) {
  const [name, setName] = useState(usuario.name || '')
  const [email, setEmail] = useState(usuario.email || '')
  const [phone, setPhone] = useState(usuario.phone || '')
  const [status, setStatus] = useState(usuario.status)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [desbloqueando, setDesbloqueando] = useState(false)
  const [erroresValidacion, setErroresValidacion] = useState({})

  const estaBloqueado = usuario.locked_at != null

  const validarFormulario = () => {
    const errores = {}

    const validacionNombre = validaciones.nombre(name)
    if (!validacionNombre.valido) {
      errores.name = validacionNombre.error
    }

    const validacionEmail = validaciones.email(email)
    if (!validacionEmail.valido) {
      errores.email = validacionEmail.error
    }

    const validacionTelefono = validaciones.telefono(phone)
    if (!validacionTelefono.valido) {
      errores.phone = validacionTelefono.error
    }

    const validacionPassword = validaciones.contrasenaNueva(password)
    if (!validacionPassword.valido) {
      errores.password = validacionPassword.error
    }

    return errores
  }

  const guardarCambios = async (event) => {
    event.preventDefault()

    setError('')
    setErroresValidacion({})

    const errores = validarFormulario()
    if (Object.keys(errores).length > 0) {
      setErroresValidacion(errores)
      return
    }

    setGuardando(true)

    const datosActualizados = {
      name,
      email,
      phone,
      status,
    }

    if (password.trim() !== '') {
      datosActualizados.password = password
    }

    try {
      const resultado = await actualizarUsuario(
        usuario.dni,
        datosActualizados,
        token
      )

      onUsuarioActualizado(resultado)
    } catch (error) {
      console.error('Error actualizando usuario:', error)
      setError(error.message)
    } finally {
      setGuardando(false)
    }
  }

  const desbloquearCuenta = async () => {
    setError('')
    setDesbloqueando(true)

    try {
      const resultado = await actualizarUsuario(
        usuario.dni,
        { unlock: true },
        token
      )

      onUsuarioActualizado(resultado)
    } catch (error) {
      console.error('Error desbloqueando usuario:', error)
      setError(error.message)
    } finally {
      setDesbloqueando(false)
    }
  }

  return (
    <div
      className="modal d-block"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        overflow: 'hidden',
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{
          maxWidth: '500px',
          width: 'calc(100% - 2rem)',
          margin: '1rem auto',
        }}
      >
        <div
          className="modal-content"
          style={{ maxHeight: 'calc(100vh - 2rem)' }}
        >
          <div className="modal-header py-2 px-3">
            <h5 className="modal-title mb-0">Editar usuario</h5>

            <button
              type="button"
              className="btn-close"
              onClick={onCancelar}
              disabled={guardando || desbloqueando}
            />
          </div>

          <form onSubmit={guardarCambios} autoComplete="off">
            <div
              className="modal-body py-3 px-3"
              style={{
                overflowY: 'auto',
                maxHeight: 'calc(100vh - 150px)',
              }}
            >
              {error && (
                <div className="alert alert-danger py-2 mb-2">
                  ❌ {error}
                </div>
              )}

              <div className="mb-2">
                <label className="form-label mb-1">
                  Número de identificación
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={usuario.dni}
                  disabled
                />
                <div className="form-text">
                  El número de identificación no puede ser modificado.
                </div>
              </div>

              <div className="mb-2">
                <label className="form-label mb-1">Nombre</label>
                <input
                  type="text"
                  className={`form-control ${erroresValidacion.name ? 'is-invalid' : ''}`}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={guardando || desbloqueando}
                />
                {erroresValidacion.name && (
                  <div className="invalid-feedback d-block">
                    {erroresValidacion.name}
                  </div>
                )}
              </div>

              <div className="mb-2">
                <label className="form-label mb-1">Email</label>
                <input
                  type="email"
                  className={`form-control ${erroresValidacion.email ? 'is-invalid' : ''}`}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={guardando || desbloqueando}
                />
                {erroresValidacion.email && (
                  <div className="invalid-feedback d-block">
                    {erroresValidacion.email}
                  </div>
                )}
              </div>

              <div className="mb-2">
                <label className="form-label mb-1">Teléfono</label>
                <input
                  type="text"
                  className={`form-control ${erroresValidacion.phone ? 'is-invalid' : ''}`}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  disabled={guardando || desbloqueando}
                />
                {erroresValidacion.phone && (
                  <div className="invalid-feedback d-block">
                    {erroresValidacion.phone}
                  </div>
                )}
              </div>

              <div className="mb-2">
                <label className="form-label mb-1">Estado</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(event) => setStatus(parseInt(event.target.value))}
                  disabled={guardando || desbloqueando}
                >
                  <option value="1">Activo</option>
                  <option value="0">Inactivo</option>
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label mb-1">Seguridad de la cuenta</label>

                {estaBloqueado ? (
                  <div className="border rounded p-2 bg-light">
                    <div className="mb-2">
                      <span className="badge bg-danger me-2">
                        🔒 Bloqueada
                      </span>
                      <span className="text-muted small">
                        {usuario.failed_login_attempts || 0} intentos fallidos
                      </span>
                    </div>

                    <div className="small text-muted mb-2">
                      La cuenta fue bloqueada por el sistema debido a intentos
                      fallidos de autenticación.
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm"
                      onClick={desbloquearCuenta}
                      disabled={guardando || desbloqueando}
                    >
                      {desbloqueando ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          />
                          Desbloqueando...
                        </>
                      ) : (
                        '🔓 Desbloquear cuenta'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="border rounded p-2 bg-light">
                    <span className="badge bg-success me-2">
                      🟢 Sin bloqueo
                    </span>
                    <span className="text-muted small">
                      {usuario.failed_login_attempts || 0} intentos fallidos
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-0">
                <label className="form-label mb-1">
                  Cambiar contraseña
                </label>
                <input
                  type="password"
                  className={`form-control ${erroresValidacion.password ? 'is-invalid' : ''}`}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nueva contraseña"
                  autoComplete="new-password"
                  disabled={guardando || desbloqueando}
                />
                <div className="form-text">
                  Déjala vacía si no deseas cambiar la contraseña actual.
                </div>
                {erroresValidacion.password && (
                  <div className="invalid-feedback d-block">
                    {erroresValidacion.password}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer py-2 px-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancelar}
                disabled={guardando || desbloqueando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={guardando || desbloqueando}
              >
                {guardando ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditUserForm
