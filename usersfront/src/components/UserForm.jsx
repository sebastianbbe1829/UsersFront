import { useState } from 'react'
import { crearUsuario } from '../services/api'
import { validaciones } from '../utils/validaciones'

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
  const [erroresValidacion, setErroresValidacion] = useState({})

  // ============================================================
  // VALIDAR FORMULARIO
  // ============================================================

  const validarFormulario = () => {
    const errores = {}

    const validacionDni =
      validaciones.dni(dni)

    if (!validacionDni.valido) {
      errores.dni =
        validacionDni.error
    }

    const validacionNombre =
      validaciones.nombre(name)

    if (!validacionNombre.valido) {
      errores.name =
        validacionNombre.error
    }

    const validacionEmail =
      validaciones.email(email)

    if (!validacionEmail.valido) {
      errores.email =
        validacionEmail.error
    }

    const validacionTelefono =
      validaciones.telefono(phone)

    if (!validacionTelefono.valido) {
      errores.phone =
        validacionTelefono.error
    }

    const validacionPassword =
      validaciones.contrasena(password)

    if (!validacionPassword.valido) {
      errores.password =
        validacionPassword.error
    }

    return errores
  }

  // ============================================================
  // GUARDAR USUARIO
  // ============================================================

  const guardarUsuario = async (event) => {

    event.preventDefault()

    setError('')
    setErroresValidacion({})

    const errores =
      validarFormulario()

    if (
      Object.keys(errores).length > 0
    ) {
      setErroresValidacion(errores)
      return
    }

    setGuardando(true)

    const usuario = {
      dni,
      name,
      email,
      phone,
      password,
    }

    try {

      const resultado =
        await crearUsuario(
          usuario,
          token
        )

      console.log(
        'Usuario creado:',
        resultado
      )

      onUsuarioCreado(resultado)

    } catch (error) {

      console.error(
        'Error creando usuario:',
        error
      )

      setError(
        error.message
      )

    } finally {

      setGuardando(false)

    }
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div
      className="modal d-block"
      style={{
        backgroundColor:
          'rgba(0, 0, 0, 0.5)',
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        overflow: 'hidden',
      }}
    >

      <div
        className="
          modal-dialog
          modal-dialog-centered
        "
        style={{
          maxWidth: '500px',
          width: 'calc(100% - 2rem)',
          margin: '1rem auto',
        }}
      >

        <div
          className="modal-content"
          style={{
            maxHeight: 'calc(100vh - 2rem)',
          }}
        >

          {/* ================================================== */}
          {/* CABECERA */}
          {/* ================================================== */}

          <div
            className="
              modal-header
              py-2
              px-3
            "
          >

            <h5 className="modal-title mb-0">
              Nuevo usuario
            </h5>

            <button
              type="button"
              className="btn-close"
              onClick={onCancelar}
              disabled={guardando}
            />

          </div>


          {/* ================================================== */}
          {/* FORMULARIO */}
          {/* ================================================== */}

          <form
            onSubmit={guardarUsuario}
            autoComplete="off"
          >

            {/* ================================================== */}
            {/* CUERPO */}
            {/* ================================================== */}

            <div
              className="
                modal-body
                py-3
                px-3
              "
              style={{
                overflowY: 'auto',
                maxHeight: 'calc(100vh - 150px)',
              }}
            >

              {/* ERROR */}

              {error && (

                <div
                  className="
                    alert
                    alert-danger
                    py-2
                    mb-2
                  "
                >
                  ❌ {error}
                </div>

              )}


              {/* DNI */}

              <div className="mb-2">

                <label className="form-label mb-1">
                  Número de identificación
                </label>

                <input
                  type="text"
                  className={`form-control ${
                    erroresValidacion.dni
                      ? 'is-invalid'
                      : ''
                  }`}
                  value={dni}
                  onChange={(event) =>
                    setDni(
                      event.target.value
                    )
                  }
                  placeholder="Ingrese el DNI"
                  autoComplete="off"
                  disabled={guardando}
                />

                {erroresValidacion.dni && (

                  <div className="invalid-feedback d-block">
                    {erroresValidacion.dni}
                  </div>

                )}

              </div>


              {/* NOMBRE */}

              <div className="mb-2">

                <label className="form-label mb-1">
                  Nombre
                </label>

                <input
                  type="text"
                  className={`form-control ${
                    erroresValidacion.name
                      ? 'is-invalid'
                      : ''
                  }`}
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Ingrese el nombre"
                  autoComplete="off"
                  disabled={guardando}
                />

                {erroresValidacion.name && (

                  <div className="invalid-feedback d-block">
                    {erroresValidacion.name}
                  </div>

                )}

              </div>


              {/* EMAIL */}

              <div className="mb-2">

                <label className="form-label mb-1">
                  Email
                </label>

                <input
                  type="email"
                  className={`form-control ${
                    erroresValidacion.email
                      ? 'is-invalid'
                      : ''
                  }`}
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="Ingrese el email"
                  autoComplete="off"
                  disabled={guardando}
                />

                {erroresValidacion.email && (

                  <div className="invalid-feedback d-block">
                    {erroresValidacion.email}
                  </div>

                )}

              </div>


              {/* TELÉFONO */}

              <div className="mb-2">

                <label className="form-label mb-1">
                  Teléfono
                </label>

                <input
                  type="text"
                  className={`form-control ${
                    erroresValidacion.phone
                      ? 'is-invalid'
                      : ''
                  }`}
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                    )
                  }
                  placeholder="Ingrese el teléfono"
                  autoComplete="off"
                  disabled={guardando}
                />

                {erroresValidacion.phone && (

                  <div className="invalid-feedback d-block">
                    {erroresValidacion.phone}
                  </div>

                )}

              </div>


              {/* CONTRASEÑA */}

              <div className="mb-0">

                <label className="form-label mb-1">
                  Contraseña
                </label>

                <input
                  type="password"
                  className={`form-control ${
                    erroresValidacion.password
                      ? 'is-invalid'
                      : ''
                  }`}
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Ingrese la contraseña"
                  autoComplete="new-password"
                  disabled={guardando}
                />

                {erroresValidacion.password && (

                  <div className="invalid-feedback d-block">
                    {erroresValidacion.password}
                  </div>

                )}

              </div>

            </div>


            {/* ================================================== */}
            {/* BOTONES */}
            {/* ================================================== */}

            <div
              className="
                modal-footer
                py-2
                px-3
              "
            >

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
                      className="
                        spinner-border
                        spinner-border-sm
                        me-2
                      "
                      role="status"
                      aria-hidden="true"
                    />

                    Guardando...

                  </>

                ) : (

                  'Crear usuario'

                )}

              </button>

            </div>

          </form>

        </div>

      </div>

    </div>

  )
}

export default UserForm