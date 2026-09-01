import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import MainLayout from '../layouts/MainLayoutFixed'
import LoginPage from '../pages/LoginPage'
import WelcomePage from '../pages/WelcomePage'
import UsersPage from '../pages/UsersPage'
import RolesPage from '../pages/RolesPage'
import PermisosPage from '../pages/PermisosPage'
import ExtinguishersPage from '../pages/ExtinguishersPage'
import ExtinguisherTypesPage from '../pages/ExtinguisherTypesPage'
import ExtinguisherInspectionsPage from '../pages/ExtinguisherInspectionsPage'
import ExtinguisherInspectionItemsPage from '../pages/ExtinguisherInspectionItemsPage'
import TenantAdminPage from '../pages/TenantAdminPage'
import TenantConfigPage from '../pages/TenantConfigPage'
import SuperBootstrapPage from '../pages/SuperBootstrapPage'
import TenantBootstrapPage from '../pages/TenantBootstrapPage'
import ActivateUser from '../components/ActivateUser'
import TenantRequired from '../components/TenantRequired'
import { obtenerTenantDesdeUrl } from '../utils/tenant'
import { useAuth } from '../contexts/AuthContext'

function RutasProtegidas() {
  const { logueado, cargando } = useAuth()
  if (cargando) return <div className="min-vh-100 d-flex align-items-center justify-content-center"><div className="text-center"><div className="spinner-border text-primary mb-3" role="status" /><div className="text-muted">Validando sesión...</div></div></div>
  if (!logueado) return <Navigate to="login" replace />
  return <MainLayout />
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
    <Route path="/:tenant" element={<RutasProtegidas />}>
      <Route index element={<WelcomePage />} />
      <Route path="usuarios" element={<UsersPage />} />
      <Route path="roles" element={<RolesPage />} />
      <Route path="permisos" element={<PermisosPage />} />
      <Route path="extintores" element={<ExtinguishersPage />} />
      <Route path="extintores/tipos" element={<ExtinguisherTypesPage />} />
      <Route path="extintores/revisiones" element={<ExtinguisherInspectionsPage />} />
      <Route path="extintores/items-revision" element={<ExtinguisherInspectionItemsPage />} />
      <Route path="configuracion-ui" element={<TenantConfigPage />} />
      <Route path="administracion-tenant" element={<TenantAdminPage />} />
    </Route>
    <Route path="*" element={<Navigate to={`/${tenant}`} replace />} />
  </Routes>
}

export default AppRoutes
