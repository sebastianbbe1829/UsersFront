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
  // LOGIN UNIFICADO
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
      // AuthContext se encarga de:
      //
      //   - login TENANT o SUPER
      //   - enviar MFA cuando corresponde
      //   - validar el JWT
      //   - guardar la sesión en el storage correcto
      //   - reconstruir la identidad desde el JWT
      // --------------------------------------------------------

      await iniciarSesion(
        username,
        password,
        esSuper,
        otp
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
      mensajeSesion={mensajeSesion}
      onLogin={manejarLogin}
    />
  )
}


export default LoginPage
