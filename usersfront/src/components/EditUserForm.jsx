import { useState } from 'react'
import { actualizarUsuario } from '../services/api'

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

  const guardarCambios = async (event) => {
    event.preventDefault()

    setError('')
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
                  {error}
                </div>
              )}

              {/* DNI */}

              <div className="mb-3">

                <label className="form-label">
                  DNI
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={usuario.dni}
                  disabled
                />

                <div className="form-text">
                  El DNI no puede ser modificado.
                </div>

              </div>

              {/* NOMBRE */}

              <div className="mb-3">

                <label className="form-label">
                  Nombre
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                />

              </div>

              {/* EMAIL */}

              <div className="mb-3">

                <label className="form-label">
                  Email
                </label>

                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                />

              </div>

              {/* TELÉFONO */}

              <div className="mb-3">

                <label className="form-label">
                  Teléfono
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  required
                />

              </div>

              {/* ESTADO */}

              <div className="mb-3">

                <label className="form-label">
                  Estado
                </label>

                <select
                  className="form-select"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value === 'true')
                  }
                >

                  <option value="true">
                    Activo
                  </option>

                  <option value="false">
                    Inactivo
                  </option>

                </select>

              </div>

              {/* CONTRASEÑA */}

              <div className="mb-3">

                <label className="form-label">
                  Cambiar contraseña
                </label>

                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Nueva contraseña"
                  autoComplete="new-password"
                />

                <div className="form-text">
                  Déjala vacía si no deseas cambiar la
                  contraseña actual.
                </div>

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
                {guardando
                  ? 'Guardando...'
                  : 'Guardar cambios'}
              </button>

            </div>

          </form>

        </div>
      </div>
    </div>
  )
}

export default EditUserForm