import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import MainLayout from '../layouts/MainLayout'

import LoginPage from '../pages/LoginPage'
import WelcomePage from '../pages/WelcomePage'
import UsersPage from '../pages/UsersPage'

import ActivateUser from '../components/ActivateUser'
import TenantRequired from '../components/TenantRequired'

import {
  obtenerTenantDesdeUrl,
} from '../utils/tenant'

import {
  useAuth,
} from '../contexts/AuthContext'


// ============================================================
// RUTAS PROTEGIDAS
// ============================================================

function RutasProtegidas() {

  // ==========================================================
  // CONTEXT
  // ==========================================================

  const {
    logueado,
    cargando,
  } = useAuth()


  // ==========================================================
  // ESPERAR VALIDACIÓN DE SESIÓN
  // ==========================================================

  if (cargando) {

    return (

      <div
        className="
          min-vh-100
          d-flex
          align-items-center
          justify-content-center
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

          <div className="text-muted">
            Validando sesión...
          </div>

        </div>

      </div>

    )

  }


  // ==========================================================
  // SIN SESIÓN
  // ==========================================================

  if (!logueado) {

    return (
      <Navigate
        to="login"
        replace
      />
    )

  }


  // ==========================================================
  // SESIÓN VÁLIDA
  // ==========================================================

  return (
    <MainLayout />
  )

}


// ============================================================
// APP ROUTES
// ============================================================

function AppRoutes() {

  // ==========================================================
  // TENANT
  // ==========================================================

  const tenant =
    obtenerTenantDesdeUrl()


  // ==========================================================
  // SIN TENANT
  // ==========================================================

  if (!tenant) {

    return (
      <TenantRequired />
    )

  }


  // ==========================================================
  // RUTAS
  // ==========================================================

  return (

    <Routes>

      {/* ====================================================== */}
      {/* ACTIVACIÓN DE USUARIO */}
      {/* ====================================================== */}

      <Route
        path="/:tenant/users/activate/:dni/:token"
        element={
          <ActivateUser />
        }
      />


      {/* ====================================================== */}
      {/* LOGIN */}
      {/* ====================================================== */}

      <Route
        path="/:tenant/login"
        element={
          <LoginPage />
        }
      />


      {/* ====================================================== */}
      {/* APLICACIÓN PROTEGIDA */}
      {/* ====================================================== */}

      <Route
        path="/:tenant"
        element={
          <RutasProtegidas />
        }
      >

        {/* ==================================================== */}
        {/* INICIO */}
        {/* ==================================================== */}

        <Route
          index
          element={
            <WelcomePage />
          }
        />


        {/* ==================================================== */}
        {/* USUARIOS */}
        {/* ==================================================== */}

        <Route
          path="usuarios"
          element={
            <UsersPage />
          }
        />


        {/* ==================================================== */}
        {/* ROLES */}
        {/* ==================================================== */}

        <Route
          path="roles"
          element={

            <div>

              <h2 className="fw-bold">
                Roles
              </h2>

              <p className="text-muted">
                Módulo de roles próximamente.
              </p>

            </div>

          }
        />


        {/* ==================================================== */}
        {/* PERMISOS */}
        {/* ==================================================== */}

        <Route
          path="permisos"
          element={

            <div>

              <h2 className="fw-bold">
                Permisos
              </h2>

              <p className="text-muted">
                Módulo de permisos próximamente.
              </p>

            </div>

          }
        />

      </Route>


      {/* ====================================================== */}
      {/* RUTA DESCONOCIDA */}
      {/* ====================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to={
              `/${tenant}`
            }
            replace
          />
        }
      />

    </Routes>

  )

}


export default AppRoutes