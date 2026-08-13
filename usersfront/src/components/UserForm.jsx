import { useState } from 'react'
import { crearUsuario } from '../services/api'

function UserForm({
  token,
  onUsuarioCreado,
  onCancelar,
}) {
  const [dni, setDni] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const guardarUsuario = async (event) => {
    event.preventDefault()

    setError('')
    setGuardando(true)

    const usuario = {
      dni,
      name,
      email,
      phone,
      password,
    }

    try {
      const resultado = await crearUsuario(
        usuario,
        token
      )

      console.log('Usuario creado:', resultado)

      onUsuarioCreado(resultado)

    } catch (error) {
      console.error('Error creando usuario:', error)

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
              Nuevo usuario
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
            onSubmit={guardarUsuario}
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
                  value={dni}
                  onChange={(event) =>
                    setDni(event.target.value)
                  }
                  placeholder="Ingrese el DNI"
                  autoComplete="off"
                  required
                />

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
                  placeholder="Ingrese el nombre"
                  autoComplete="off"
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
                  placeholder="Ingrese el email"
                  autoComplete="off"
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
                  placeholder="Ingrese el teléfono"
                  autoComplete="off"
                  required
                />

              </div>

              {/* CONTRASEÑA */}

              <div className="mb-3">

                <label className="form-label">
                  Contraseña
                </label>

                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Ingrese la contraseña"
                  autoComplete="new-password"
                  required
                />

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
                  : 'Crear usuario'}
              </button>

            </div>

          </form>

        </div>
      </div>
    </div>
  )
}

export default UserForm