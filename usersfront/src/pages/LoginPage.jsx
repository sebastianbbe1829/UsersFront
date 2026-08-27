import {
  useNavigate,
} from 'react-router-dom'

import Login from '../components/Login'

import {
  useAuth,
} from '../contexts/AuthContext'


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
      // LOGIN
      // --------------------------------------------------------
      //
      // Ambos modos utilizan el mismo endpoint /auth/login.
      // La diferencia está en super_mode y otp.
      //
      //   normal -> usuario + contraseña
      //   SUPER  -> usuario + contraseña + MFA
      //
      // AuthContext se encarga de guardar y reconstruir
      // la sesión del tenant actual.
      // --------------------------------------------------------

      await iniciarSesion(
        username,
        password,
        esSuper,
        otp
      )


      // --------------------------------------------------------
      // NAVEGAR
      // --------------------------------------------------------

      if (tenant) {

        navigate(
          `/${tenant}`,
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