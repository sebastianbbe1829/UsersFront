import {
  useNavigate,
} from 'react-router-dom'

import Login from '../components/Login'

import {
  useAuth,
} from '../contexts/AuthContext'

import {
  login,
} from '../services/api'


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
  // GUARDAR SESIÓN DEL TENANT
  // ============================================================

  const guardarSesionTenant = (
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
      // VALIDAR TENANT
      // --------------------------------------------------------

      if (!tenant) {

        throw new Error(
          'No se pudo determinar la empresa desde la URL.'
        )

      }


      // --------------------------------------------------------
      // LOGIN SUPER
      // --------------------------------------------------------
      //
      // Utiliza exactamente el mismo endpoint /auth/login.
      // La única diferencia es que envía super_mode=true y MFA.
      // --------------------------------------------------------

      if (esSuper) {

        if (!otp) {

          throw new Error(
            'El código MFA es requerido para ingresar como SUPER.'
          )

        }


        const resultado =
          await login(
            username,
            password,
            tenant,
            true,
            otp
          )


        if (!resultado?.access_token) {

          throw new Error(
            'El servidor no devolvió un token de acceso.'
          )

        }


        guardarSesionTenant(
          tenant,
          resultado.access_token
        )


        // ------------------------------------------------------
        // AuthContext reconstruirá la sesión SUPER desde el JWT.
        // ------------------------------------------------------

        window.location.href =
          `/${tenant}`

        return

      }


      // --------------------------------------------------------
      // LOGIN NORMAL
      // --------------------------------------------------------

      await iniciarSesion(
        username,
        password,
        false,
        ''
      )


      navigate(
        `/${tenant}`,
        {
          replace: true,
        }
      )

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