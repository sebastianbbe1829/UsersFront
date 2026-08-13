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
  const [erroresValidacion, setErroresValidacion] = useState({})

  // ==========================
  // VALIDAR FORMULARIO
  // ==========================

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

    // Validar formulario
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

    // Solo enviamos la contraseña si el usuario
    // escribió una nueva contraseña.
    if (password.trim() !== '') {
      datosActualizados.password = password
    }

    try {
      const resultado = await actualizarUsuario(
        usuario.dni,
        datosActualizados,
        token
      )

      console.log('Usuario actualizado:', resultado)

      onUsuarioActualizado(resultado)
    } catch (error) {
      console.error('Error actualizando usuario:', error)

      setError(error.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      className="modal d-block"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">

          {/* CABECERA */}

          <div className="modal-header">

            <h5 className="modal-title">
              Editar usuario
            </h5>

            <button
              type="button"
              className="btn-close"
              onClick={onCancelar}
              disabled={guardando}
            />

          </div>

          {/* FORMULARIO */}

          <form
            onSubmit={guardarCambios}
            autoComplete="off"
          >

            <div className="modal-body">

              {/* ERROR */}

              {error && (
                <div className="alert alert-danger">
                  ❌ {error}
                </div>
              )}

              {/* Numero de identificacion */}

              <div className="mb-3">

                <label className="form-label">
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

              {/* NOMBRE */}

              <div className="mb-3">

                <label className="form-label">
                  Nombre
                </label>

                <input
                  type="text"
                  className={`form-control ${
                    erroresValidacion.name ? 'is-invalid' : ''
                  }`}
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  disabled={guardando}
                />

                {erroresValidacion.name && (
                  <div className="invalid-feedback d-block">
                    {erroresValidacion.name}
                  </div>
                )}

              </div>

              {/* EMAIL */}

              <div className="mb-3">

                <label className="form-label">
                  Email
                </label>

                <input
                  type="email"
                  className={`form-control ${
                    erroresValidacion.email ? 'is-invalid' : ''
                  }`}
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  disabled={guardando}
                />

                {erroresValidacion.email && (
                  <div className="invalid-feedback d-block">
                    {erroresValidacion.email}
                  </div>
                )}

              </div>

              {/* TELÉFONO */}

              <div className="mb-3">

                <label className="form-label">
                  Teléfono
                </label>

                <input
                  type="text"
                  className={`form-control ${
                    erroresValidacion.phone ? 'is-invalid' : ''
                  }`}
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  disabled={guardando}
                />

                {erroresValidacion.phone && (
                  <div className="invalid-feedback d-block">
                    {erroresValidacion.phone}
                  </div>
                )}

              </div>

              {/* ESTADO */}

              <div className="mb-3">

                <label className="form-label">
                  Estado
                </label>

                <select
                  className="form-select"
                  value={status}
                  onChange={(event) => setStatus(parseInt(event.target.value))}
                  disabled={guardando}
                >
                  <option value="1">Activo</option>
                  <option value="0">Inactivo</option>
                </select>

              </div>

              {/* CONTRASEÑA */}

              <div className="mb-3">

                <label className="form-label">
                  Cambiar contraseña
                </label>

                <input
                  type="password"
                  className={`form-control ${
                    erroresValidacion.password ? 'is-invalid' : ''
                  }`}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Nueva contraseña"
                  autoComplete="new-password"
                  disabled={guardando}
                />

                <div className="form-text">
                  Déjala vacía si no deseas cambiar la
                  contraseña actual.
                </div>

                {erroresValidacion.password && (
                  <div className="invalid-feedback d-block">
                    {erroresValidacion.password}
                  </div>
                )}

              </div>

            </div>

            {/* BOTONES */}

            <div className="modal-footer">

              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancelar}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={guardando}
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