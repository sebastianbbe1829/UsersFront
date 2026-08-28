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
import TenantConfigPage from '../pages/TenantConfigPage'
import SuperBootstrapPage from '../pages/SuperBootstrapPage'
import TenantBootstrapPage from '../pages/TenantBootstrapPage'

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
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <div className="text-muted">Validando sesión...</div>
        </div>
      </div>
    )
  }

  if (!logueado) {
    return <Navigate to="login" replace />
  }

  return <MainLayout />
}


// ============================================================
// APP ROUTES
// ============================================================

function AppRoutes() {
  const tenant = obtenerTenantDesdeUrl()
  const rutaActual = window.location.pathname

  // ==========================================================
  // BOOTSTRAPS TÉCNICOS PÚBLICOS
  //
  // Ninguno de estos flujos requiere tenant ni login.
  // ==========================================================

  if (rutaActual === '/bootstrap/tenant') {
    return (
      <Routes>
        <Route
          path="/bootstrap/tenant"
          element={<TenantBootstrapPage />}
        />
      </Routes>
    )
  }

  if (rutaActual === '/bootstrap/super') {
    return (
      <Routes>
        <Route
          path="/bootstrap/super"
          element={<SuperBootstrapPage />}
        />
      </Routes>
    )
  }

  if (!tenant) {
    return <TenantRequired />
  }

  return (
    <Routes>
      {/* ACTIVACIÓN DE USUARIO */}
      <Route
        path="/:tenant/users/activate/:dni/:token"
        element={<ActivateUser />}
      />

      {/* LOGIN */}
      <Route
        path="/:tenant/login"
        element={<LoginPage />}
      />

      {/* APLICACIÓN PROTEGIDA */}
      <Route
        path="/:tenant"
        element={<RutasProtegidas />}
      >
        <Route index element={<WelcomePage />} />
        <Route path="usuarios" element={<UsersPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="permisos" element={<PermisosPage />} />
        <Route path="configuracion-ui" element={<TenantConfigPage />} />
        <Route path="administracion-tenant" element={<TenantAdminPage />} />
      </Route>

      {/* RUTA DESCONOCIDA */}
      <Route
        path="*"
        element={<Navigate to={`/${tenant}`} replace />}
      />
    </Routes>
  )
}


export default AppRoutes
