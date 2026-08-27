import {
  useNavigate,
} from 'react-router-dom'

import Login from '../components/Login'

import {
  useAuth,
} from '../contexts/AuthContext'

import {
  loginSuper,
} from '../services/superAuth'


const TENANT_SESSIONS_KEY =
  'tenant_sessions'


function LoginPage() {

  // ============================================================
  // CONTEXT
  // ============================================================

  const {
    tenant,
    mensajeSesion,
    iniciarSesion,
  } = useAuth()


  // ============================================================
  // NAVEGACIÓN
  // ============================================================

  const navigate =
    useNavigate()


  // ============================================================
  // GUARDAR SESIÓN SUPER EN EL TENANT ACTUAL
  // ============================================================

  const guardarSesionSuper = (
    tenantActual,
    token
  ) => {

    const sesiones =
      JSON.parse(
        localStorage.getItem(
          TENANT_SESSIONS_KEY
        ) || '{}'
      )


    sesiones[tenantActual] =
      token


    localStorage.setItem(
      TENANT_SESSIONS_KEY,
      JSON.stringify(sesiones)
    )

  }


  // ============================================================
  // LOGIN
  // ============================================================

  const manejarLogin =
    async (
      username,
      password,
      esSuper,
      otp
    ) => {

      // --------------------------------------------------------
      // LOGIN SUPER
      // --------------------------------------------------------

      if (esSuper) {

        if (!tenant) {

          throw new Error(
            'No se pudo determinar la empresa desde la URL.'
          )

        }


        if (!otp) {

          throw new Error(
            'El código MFA es requerido para ingresar como SUPER.'
          )

        }


        const resultado =
          await loginSuper(
            username,
            password,
            otp,
            tenant
          )


        if (!resultado?.access_token) {

          throw new Error(
            'El servidor no devolvió un token SUPER.'
          )

        }


        // ------------------------------------------------------
        // Guardar el token SUPER asociado al tenant actual.
        // AuthContext podrá restaurarlo desde tenant_sessions.
        // ------------------------------------------------------

        guardarSesionSuper(
          tenant,
          resultado.access_token
        )


        // ------------------------------------------------------
        // Recargar para que AuthContext reconstruya la sesión
        // completa utilizando el mismo flujo de restauración.
        // ------------------------------------------------------

        window.location.href =
          `/${tenant}/dashboard`


        return

      }


      // --------------------------------------------------------
      // LOGIN NORMAL
      // --------------------------------------------------------

      await iniciarSesion(
        username,
        password
      )


      // --------------------------------------------------------
      // NAVEGAR
      // --------------------------------------------------------

      if (tenant) {

        navigate(
          `/${tenant}/dashboard`,
          {
            replace: true,
          }
        )

      }

    }


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <Login
      mensajeSesion={
        mensajeSesion
      }
      onLogin={
        manejarLogin
      }
    />

  )

}


export default LoginPage