import {
  useState,
} from 'react'

import {
  useAuth,
} from '../contexts/AuthContext'


function Login({
  mensajeSesion,
  onLogin,
}) {

  const {
    tenant,
  } = useAuth()


  const [usuario, setUsuario] =
    useState('')


  const [password, setPassword] =
    useState('')


  const [error, setError] =
    useState('')


  const [cargando, setCargando] =
    useState(false)


  const [erroresValidacion, setErroresValidacion] =
    useState({})


  const [mostrarPassword, setMostrarPassword] =
    useState(false)


  // ============================================================
  // VALIDACIONES
  // ============================================================

  const validarFormulario = () => {

    const errores = {}


    if (!usuario.trim()) {

      errores.usuario =
        'El usuario es requerido'

    } else if (
      usuario.trim().length < 3
    ) {

      errores.usuario =
        'El usuario debe tener al menos 3 caracteres'

    }


    if (!password) {

      errores.password =
        'La contraseña es requerida'

    } else if (
      password.length < 6
    ) {

      errores.password =
        'La contraseña debe tener al menos 6 caracteres'

    }


    return errores

  }


  // ============================================================
  // LOGIN
  // ============================================================

  const manejarLogin = async (
    event
  ) => {

    event.preventDefault()


    setError('')

    setErroresValidacion({})


    const errores =
      validarFormulario()


    if (
      Object.keys(errores).length > 0
    ) {

      setErroresValidacion(
        errores
      )

      return

    }


    setCargando(true)


    try {

      // --------------------------------------------------------
      // LoginPage se encarga de autenticar y navegar
      // --------------------------------------------------------

      await onLogin(
        usuario,
        password
      )

    } catch (error) {

      console.error(
        'Error realizando login:',
        error
      )


      setError(
        error?.message ||
        'No fue posible iniciar sesión.'
      )

    } finally {

      setCargando(false)

    }

  }


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div
      className="
        min-vh-100
        d-flex
        align-items-center
        justify-content-center
      "
      style={{
        background:
          'linear-gradient(135deg, #0d6efd 0%, #6f42c1 100%)',
      }}
    >

      <div
        className="
          card
          shadow-lg
          border-0
        "
        style={{
          width: '400px',
          maxWidth: '90%',
        }}
      >

        <div className="card-body p-5">

          {/* ================================================== */}
          {/* ENCABEZADO                                        */}
          {/* ================================================== */}

          <div className="text-center mb-4">

            <div
              className="
                rounded-circle
                bg-primary
                d-inline-flex
                align-items-center
                justify-content-center
                mb-3
              "
              style={{
                width: '70px',
                height: '70px',
              }}
            >

              <span
                style={{
                  fontSize: '32px',
                }}
              >
                👥
              </span>

            </div>


            <h2 className="fw-bold">
              Gestión de Usuarios
            </h2>


            <p className="text-muted mb-2">
              Inicia sesión para continuar
            </p>


            {/* ================================================== */}
            {/* TENANT                                            */}
            {/* ================================================== */}

            {tenant && (

              <div
                className="
                  d-inline-flex
                  align-items-center
                  gap-2
                  px-3
                  py-2
                  rounded-pill
                  bg-light
                  border
                "
              >

                <span>
                  🏢
                </span>

                <span className="fw-semibold">
                  {tenant}
                </span>

              </div>

            )}

          </div>


          {/* ================================================== */}
          {/* FORMULARIO                                         */}
          {/* ================================================== */}

          <form
            onSubmit={manejarLogin}
          >

            {/* ================================================= */}
            {/* USUARIO                                           */}
            {/* ================================================= */}

            <div className="mb-3">

              <label
                className="
                  form-label
                  fw-semibold
                "
              >
                Usuario
              </label>


              <input
                type="text"
                className={`
                  form-control
                  form-control-lg
                  ${
                    erroresValidacion.usuario
                      ? 'is-invalid'
                      : ''
                  }
                `}
                placeholder="Ingresa tu usuario"
                value={usuario}
                onChange={(event) =>
                  setUsuario(
                    event.target.value
                  )
                }
                disabled={cargando}
                autoComplete="username"
              />


              {erroresValidacion.usuario && (

                <div
                  className="
                    invalid-feedback
                    d-block
                  "
                >
                  {
                    erroresValidacion.usuario
                  }
                </div>

              )}

            </div>


            {/* ================================================= */}
            {/* CONTRASEÑA                                        */}
            {/* ================================================= */}

            <div className="mb-4">

              <label
                className="
                  form-label
                  fw-semibold
                "
              >
                Contraseña
              </label>


              <div className="input-group">

                <input
                  type={
                    mostrarPassword
                      ? 'text'
                      : 'password'
                  }
                  className={`
                    form-control
                    form-control-lg
                    ${
                      erroresValidacion.password
                        ? 'is-invalid'
                        : ''
                    }
                  `}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  disabled={cargando}
                  autoComplete="current-password"
                />


                <button
                  type="button"
                  className="
                    btn
                    btn-outline-secondary
                  "
                  onClick={() =>
                    setMostrarPassword(
                      (valor) => !valor
                    )
                  }
                  disabled={cargando}
                  title={
                    mostrarPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                  aria-label={
                    mostrarPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                >

                  {
                    mostrarPassword
                      ? '🙈'
                      : '👁️'
                  }

                </button>

              </div>


              {erroresValidacion.password && (

                <div
                  className="
                    invalid-feedback
                    d-block
                  "
                >
                  {
                    erroresValidacion.password
                  }
                </div>

              )}

            </div>


            {/* ================================================= */}
            {/* SESIÓN EXPIRADA                                   */}
            {/* ================================================= */}

            {mensajeSesion && (

              <div
                className="
                  alert
                  alert-warning
                "
              >
                ⚠️ {mensajeSesion}
              </div>

            )}


            {/* ================================================= */}
            {/* ERROR LOGIN                                       */}
            {/* ================================================= */}

            {error && (

              <div
                className="
                  alert
                  alert-danger
                "
              >
                ❌ {error}
              </div>

            )}


            {/* ================================================= */}
            {/* INGRESAR                                          */}
            {/* ================================================= */}

            <button
              type="submit"
              className="
                btn
                btn-primary
                btn-lg
                w-100
              "
              disabled={
                cargando
              }
            >

              {cargando ? (

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

                  Ingresando...

                </>

              ) : (

                'Ingresar'

              )}

            </button>

          </form>

        </div>

      </div>

    </div>

  )

}


export default Login