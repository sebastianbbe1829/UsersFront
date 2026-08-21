import {
  Navigate,
  Outlet,
} from 'react-router-dom'

import {
  useAuth,
} from '../contexts/AuthContext'


function ProtectedRoute() {

  const {
    tenant,
    logueado,
    cargando,
  } = useAuth()


  // ============================================================
  // VALIDANDO SESIÓN
  // ============================================================

  if (cargando) {

    return (

      <div
        className="
          vh-100
          d-flex
          justify-content-center
          align-items-center
        "
      >

        <div className="text-center">

          <div
            className="
              spinner-border
              text-primary
              mb-3
            "
            role="status"
          />

          <div>
            Validando sesión...
          </div>

        </div>

      </div>

    )

  }


  // ============================================================
  // SIN SESIÓN
  // ============================================================

  if (!logueado) {

    // ----------------------------------------------------------
    // IMPORTANTE:
    // El login pertenece al tenant actual.
    // ----------------------------------------------------------

    if (tenant) {

      return (
        <Navigate
          to={`/${tenant}/login`}
          replace
        />
      )

    }


    // ----------------------------------------------------------
    // Sin tenant no debería ocurrir normalmente porque
    // AppRoutes ya controla este caso.
    // ----------------------------------------------------------

    return (
      <Navigate
        to="/"
        replace
      />
    )

  }


  // ============================================================
  // SESIÓN VÁLIDA
  // ============================================================

  return (
    <Outlet />
  )

}


export default ProtectedRoute