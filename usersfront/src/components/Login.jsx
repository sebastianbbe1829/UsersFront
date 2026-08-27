import { useState } from 'react'

import { useAuth } from '../contexts/AuthContext'


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


  const [otp, setOtp] =
    useState('')


  const [esSuper, setEsSuper] =
    useState(false)


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


    if (esSuper) {

      if (!otp.trim()) {

        errores.otp =
          'El código MFA es requerido'

      } else if (!/^\d{6}$/.test(otp.trim())) {

        errores.otp =
          'El código MFA debe tener 6 dígitos'

      }

    }


    return errores

  }


  // ============================================================
  // CAMBIAR MODO SUPER
  // ============================================================

  const cambiarModoSuper = () => {

    setEsSuper(
      (valor) => !valor
    )

    setOtp('')

    setError('')

    setErroresValidacion({})

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

      await onLogin(
        usuario,
        password,
        esSuper,
        otp.trim()
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
        p-3
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
          width: '100%',
          maxWidth: '380px',
        }}
      >

        <div className="card-body p-4">

          {/* ================================================== */}
          {/* ENCABEZADO                                        */}
          {/* ================================================== */}

          <div className="text-center mb-3">

            <div
              className="
                rounded-circle
                bg-primary
                d-inline-flex
                align-items-center
                justify-content-center
                mb-2
              "
              style={{
                width: '54px',
                height: '54px',
              }}
            >

              <span
                style={{
                  fontSize: '25px',
                }}
              >
                👥
              </span>

            </div>


            <h3 className="fw-bold mb-1">
              Gestión de Usuarios
            </h3>


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
                  py-1
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

            <div className="mb-2">

              <label
                className="
                  form-label
                  fw-semibold
                  mb-1
                "
              >
                Usuario
              </label>


              <input
                type="text"
                className={`
                  form-control
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

            <div className="mb-3">

              <label
                className="
                  form-label
                  fw-semibold
                  mb-1
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
            {/* INGRESAR COMO SUPER                               */}
            {/* ================================================= */}

            <div className="mb-3">

              <div className="form-check">

                <input
                  id="ingresar-como-super"
                  type="checkbox"
                  className="form-check-input"
                  checked={esSuper}
                  onChange={cambiarModoSuper}
                  disabled={cargando}
                />

                <label
                  htmlFor="ingresar-como-super"
                  className="form-check-label fw-semibold"
                >
                  Ingresar como SUPER
                </label>

              </div>


              {esSuper && (

                <small className="text-muted d-block mt-1">
                  Se requiere autenticación MFA para administrar el tenant.
                </small>

              )}

            </div>


            {/* ================================================= */}
            {/* MFA                                                */}
            {/* ================================================= */}

            {esSuper && (

              <div className="mb-3">

                <label
                  className="
                    form-label
                    fw-semibold
                    mb-1
                  "
                >
                  Código MFA
                </label>


                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className={`
                    form-control
                    text-center
                    fw-bold
                    ${
                      erroresValidacion.otp
                        ? 'is-invalid'
                        : ''
                    }
                  `}
                  placeholder="000000"
                  value={otp}
                  onChange={(event) =>
                    setOtp(
                      event.target.value
                        .replace(/\D/g, '')
                        .slice(0, 6)
                    )
                  }
                  disabled={cargando}
                  autoComplete="one-time-code"
                />


                {erroresValidacion.otp && (

                  <div
                    className="
                      invalid-feedback
                      d-block
                    "
                  >
                    {
                      erroresValidacion.otp
                    }
                  </div>

                )}

              </div>

            )}


            {/* ================================================= */}
            {/* SESIÓN EXPIRADA                                   */}
            {/* ================================================= */}

            {mensajeSesion && (

              <div
                className="
                  alert
                  alert-warning
                  py-2
                  px-3
                  mb-2
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
                  py-2
                  px-3
                  mb-2
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