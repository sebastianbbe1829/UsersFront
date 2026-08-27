import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import MainLayout from '../layouts/MainLayout'

import LoginPage from '../pages/LoginPage'
import WelcomePage from '../pages/WelcomePage'
import UsersPage from '../pages/UsersPage'
import RolesPage from '../pages/RolesPage'
import PermisosPage from '../pages/PermisosPage'
import TenantAdminPage from '../pages/TenantAdminPage'

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

  const {
    logueado,
    cargando,
  } = useAuth()


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


  if (!logueado) {

    return (
      <Navigate
        to="login"
        replace
      />
    )

  }


  return (
    <MainLayout />
  )

}


// ============================================================
// APP ROUTES
// ============================================================

function AppRoutes() {

  const tenant =
    obtenerTenantDesdeUrl()


  if (!tenant) {

    return (
      <TenantRequired />
    )

  }


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

        {/* INICIO */}

        <Route
          index
          element={
            <WelcomePage />
          }
        />


        {/* USUARIOS */}

        <Route
          path="usuarios"
          element={
            <UsersPage />
          }
        />


        {/* ROLES */}

        <Route
          path="roles"
          element={
            <RolesPage />
          }
        />


        {/* PERMISOS */}

        <Route
          path="permisos"
          element={
            <PermisosPage />
          }
        />


        {/* ADMINISTRACIÓN DEL TENANT */}

        <Route
          path="administracion-tenant"
          element={
            <TenantAdminPage />
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
            to={`/${tenant}`}
            replace
          />
        }
      />

    </Routes>

  )

}


export default AppRoutes