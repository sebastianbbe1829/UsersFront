import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import MainLayout from '../layouts/MainLayoutFixed'
import LoginPage from '../pages/LoginPage'
import PasswordRecoveryPage from '../pages/PasswordRecoveryPage'
import WelcomePage from '../pages/WelcomePage'
import UsersPage from '../pages/UsersPage'
import RolesPage from '../pages/RolesPage'
import PermisosPage from '../pages/PermisosPage'
import ExtinguishersPage from '../pages/ExtinguishersPage'
import ExtinguisherTypesPage from '../pages/ExtinguisherTypesPage'
import ExtinguisherInspectionsSearchPage from '../pages/ExtinguisherInspectionsSearchPage'
import ExtinguisherInspectionItemsPage from '../pages/ExtinguisherInspectionItemsPage'
import TenantAdminPage from '../pages/TenantAdminPage'
import TenantConfigPage from '../pages/TenantConfigPage'
import SuperBootstrapPage from '../pages/SuperBootstrapPage'
import TenantBootstrapPage from '../pages/TenantBootstrapPage'
import ActivateUser from '../components/ActivateUser'
import TenantRequired from '../components/TenantRequired'
import PermissionRoute from '../components/PermissionRoute'
import { obtenerTenantDesdeUrl } from '../utils/tenant'
import { useAuth } from '../contexts/AuthContext'

function RutasProtegidas() {
  const { logueado, cargando } = useAuth()
  if (cargando) return <div className="min-vh-100 d-flex align-items-center justify-content-center"><div className="text-center"><div className="spinner-border text-primary mb-3" role="status" /><div className="text-muted">Validando sesión...</div></div></div>
  if (!logueado) return <Navigate to="login" replace />
  return <MainLayout />
}

function RutaConPermiso({ permission, children }) {
  return (
    <PermissionRoute permission={permission}>
      {children}
    </PermissionRoute>
  )
}

function AppRoutes() {
  const location = useLocation()
  const tenant = obtenerTenantDesdeUrl()
  const rutaActual = location.pathname
  if (rutaActual === '/bootstrap/tenant') return <Routes><Route path="/bootstrap/tenant" element={<TenantBootstrapPage />} /></Routes>
  if (rutaActual === '/bootstrap/super') return <Routes><Route path="/bootstrap/super" element={<SuperBootstrapPage />} /></Routes>
  if (!tenant) return <TenantRequired />
  return <Routes>
    <Route path="/:tenant/users/activate/:dni/:token" element={<ActivateUser />} />
    <Route path="/:tenant/login" element={<LoginPage />} />
    <Route path="/:tenant/recuperar-password" element={<PasswordRecoveryPage />} />
    <Route path="/:tenant" element={<RutasProtegidas />}>
      <Route index element={<WelcomePage />} />
      <Route path="usuarios" element={<RutaConPermiso permission="USER_READ"><UsersPage /></RutaConPermiso>} />
      <Route path="roles" element={<RutaConPermiso permission="ROLE_READ"><RolesPage /></RutaConPermiso>} />
      <Route path="permisos" element={<RutaConPermiso permission="PERMISSION_READ"><PermisosPage /></RutaConPermiso>} />
      <Route path="extintores" element={<RutaConPermiso permission="EXTINGUISHER_READ"><ExtinguishersPage /></RutaConPermiso>} />
      <Route path="extintores/tipos" element={<RutaConPermiso permission="EXTINGUISHER_READ"><ExtinguisherTypesPage /></RutaConPermiso>} />
      <Route path="extintores/revisiones" element={<RutaConPermiso permission="EXTINGUISHER_READ"><ExtinguisherInspectionsSearchPage /></RutaConPermiso>} />
      <Route path="extintores/items-revision" element={<RutaConPermiso permission="EXTINGUISHER_READ"><ExtinguisherInspectionItemsPage /></RutaConPermiso>} />
      <Route path="configuracion-ui" element={<TenantConfigPage />} />
      <Route path="administracion-tenant" element={<TenantAdminPage />} />
    </Route>
    <Route path="*" element={<Navigate to={`/${tenant}`} replace />} />
  </Routes>
}

export default AppRoutes
