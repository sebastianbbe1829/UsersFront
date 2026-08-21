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
      password
    ) => {

      // --------------------------------------------------------
      // AUTENTICAR
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