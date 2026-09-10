import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import PasswordRecoveryPage from '../pages/PasswordRecoveryPage'
import WelcomePage from '../pages/WelcomePage'
import UsersPage from '../pages/UsersPage'
import ClientsPage from '../pages/ClientsPage'
import ClientIdentificationTypesPage from '../pages/ClientIdentificationTypesPage'
import CountriesPage from '../pages/CountriesPage'
import DepartmentsPage from '../pages/DepartmentsPage'
import CitiesPage from '../pages/CitiesPage'
import ClientRestrictedListsReportsPage from '../pages/ClientRestrictedListsReportsPage'
import ClientComplianceOverrideHistoryPage from '../pages/ClientComplianceOverrideHistoryPage'
import ClientRestrictedListsSyncExecutionsPage from '../pages/ClientRestrictedListsSyncExecutionsPage'
import RolesPage from '../pages/RolesPage'
import PermisosPage from '../pages/PermisosPage'
import ExtinguishersPage from '../pages/ExtinguishersPage'
import ExtinguisherTypesPage from '../pages/ExtinguisherTypesPage'
import ExtinguisherInspectionsSearchPage from '../pages/ExtinguisherInspectionsSearchPage'
import ExtinguisherInspectionItemsPage from '../pages/ExtinguisherInspectionItemsPage'
import InventoryStockPage from '../pages/InventoryStockPage'
import InventoryTypesPage from '../pages/InventoryTypesPage'
import InventoryProductsPage from '../pages/InventoryProductsPage'
import InventoryMovementsPage from '../pages/InventoryMovementsPage'
import SalesPOSPage from '../pages/SalesPOSPage'
import SalesHistoryPage from '../pages/SalesHistoryPage'
import PortfolioPage from '../pages/PortfolioPage'
import PortfolioObligationsPage from '../pages/PortfolioObligationsPage'
import PortfolioPaymentsPage from '../pages/PortfolioPaymentsPage'
import CashPage from '../pages/CashPage'
import CashPageGuard from '../pages/CashPageGuard'
import CashManagementPage from '../pages/CashManagementPage'
import TenantAdminPage from '../pages/TenantAdminPage'
import GlobalSuperAdminPage from '../pages/GlobalSuperAdminPage'
import TenantConfigPage from '../pages/TenantConfigPage'
import SuperBootstrapPage from '../pages/SuperBootstrapPage'
import TenantBootstrapPage from '../pages/TenantBootstrapPage'
import ActivateUser from '../components/ActivateUser'
import TenantRequired from '../components/TenantRequired'
import PermissionRoute from '../components/PermissionRoute'
import { obtenerTenantDesdeUrl } from '../utils/tenant'
import { obtenerPayloadToken } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const MainLayout = lazy(() => import('../layouts/MainLayoutFixed'))
function RutasProtegidas() { const { logueado, cargando } = useAuth(); if (cargando) return <div className="min-vh-100 d-flex align-items-center justify-content-center"><div className="text-center"><div className="spinner-border text-primary" role="status" /><div className="text-muted">Validando sesión...</div></div></div>; if (!logueado) return <Navigate to="login" replace />; return <Suspense fallback={<div className="min-vh-100 d-flex align-items-center justify-content-center"><div className="text-center"><div className="spinner-border text-primary mb-3" role="status" /><div className="text-muted">Cargando aplicación...</div></div></div>}><MainLayout /></Suspense> }
function RutaConPermiso({ permission, children }) { return <PermissionRoute permission={permission}>{children}</PermissionRoute> }

function AppRoutes() {
  const location = useLocation()
  const { usuarioLogueado, token } = useAuth()
  const rutaActual = location.pathname
  const payload = obtenerPayloadToken(token)
  const tenantDelToken = payload?.tenant_slug || usuarioLogueado?.tenant_slug || null
  const tenantDesdeUrl = obtenerTenantDesdeUrl()
  const esRutaLegacyWelcome = rutaActual === '/welcome'
  const tenant = esRutaLegacyWelcome ? tenantDelToken : (tenantDesdeUrl || tenantDelToken)
  if (esRutaLegacyWelcome) { if (tenantDelToken) return <Navigate to={`/${tenantDelToken}`} replace />; return <TenantRequired /> }
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
      <Route path="clientes" element={<RutaConPermiso permission="CLIENT_READ"><ClientsPage /></RutaConPermiso>} />
      <Route path="clientes/tipos-identificacion" element={<RutaConPermiso permission="CLIENT_READ"><ClientIdentificationTypesPage /></RutaConPermiso>} />
      <Route path="clientes/demografica/paises" element={<RutaConPermiso permission="CLIENT_READ"><CountriesPage /></RutaConPermiso>} />
      <Route path="clientes/demografica/departamentos" element={<RutaConPermiso permission="CLIENT_READ"><DepartmentsPage /></RutaConPermiso>} />
      <Route path="clientes/demografica/ciudades" element={<RutaConPermiso permission="CLIENT_READ"><CitiesPage /></RutaConPermiso>} />
      <Route path="clientes/informes-listas-restrictivas" element={<RutaConPermiso permission="CLIENT_READ"><ClientRestrictedListsReportsPage /></RutaConPermiso>} />
      <Route path="clientes/historial-levantamientos" element={<RutaConPermiso permission="CLIENT_READ"><ClientComplianceOverrideHistoryPage /></RutaConPermiso>} />
      <Route path="clientes/ejecuciones-listas-restrictivas" element={<RutaConPermiso permission="CLIENT_READ"><ClientRestrictedListsSyncExecutionsPage /></RutaConPermiso>} />
      <Route path="cartera" element={<RutaConPermiso permission="PORTFOLIO_READ"><PortfolioPage /></RutaConPermiso>} />
      <Route path="cartera/obligaciones" element={<RutaConPermiso permission="PORTFOLIO_READ"><PortfolioObligationsPage /></RutaConPermiso>} />
      <Route path="cartera/pagos" element={<RutaConPermiso permission="PORTFOLIO_PAYMENT_CREATE"><PortfolioPaymentsPage /></RutaConPermiso>} />
      <Route path="caja" element={<RutaConPermiso permission="CASH_READ"><CashPageGuard /></RutaConPermiso>} />
      <Route path="caja/administracion" element={<RutaConPermiso permission="CASH_READ"><CashManagementPage /></RutaConPermiso>} />
      <Route path="caja/administracion/sucursales" element={<RutaConPermiso permission="CASH_READ"><CashManagementPage /></RutaConPermiso>} />
      <Route path="caja/administracion/cajas" element={<RutaConPermiso permission="CASH_READ"><CashManagementPage /></RutaConPermiso>} />
      <Route path="caja/administracion/asignaciones" element={<RutaConPermiso permission="CASH_READ"><CashManagementPage /></RutaConPermiso>} />
      <Route path="roles" element={<RutaConPermiso permission="ROLE_READ"><RolesPage /></RutaConPermiso>} />
      <Route path="permisos" element={<RutaConPermiso permission="PERMISSION_READ"><PermisosPage /></RutaConPermiso>} />
      <Route path="extintores" element={<RutaConPermiso permission="EXTINGUISHER_READ"><ExtinguishersPage /></RutaConPermiso>} />
      <Route path="extintores/tipos" element={<RutaConPermiso permission="EXTINGUISHER_READ"><ExtinguisherTypesPage /></RutaConPermiso>} />
      <Route path="extintores/revisiones" element={<RutaConPermiso permission="EXTINGUISHER_READ"><ExtinguisherInspectionsSearchPage /></RutaConPermiso>} />
      <Route path="extintores/items-revision" element={<RutaConPermiso permission="EXTINGUISHER_READ"><ExtinguisherInspectionItemsPage /></RutaConPermiso>} />
      <Route path="inventarios" element={<RutaConPermiso permission="INVENTORY_READ"><InventoryStockPage /></RutaConPermiso>} />
      <Route path="inventarios/tipos" element={<RutaConPermiso permission="INVENTORY_READ"><InventoryTypesPage /></RutaConPermiso>} />
      <Route path="inventarios/productos" element={<RutaConPermiso permission="INVENTORY_READ"><InventoryProductsPage /></RutaConPermiso>} />
      <Route path="inventarios/movimientos" element={<RutaConPermiso permission="INVENTORY_MOVEMENT_READ"><InventoryMovementsPage /></RutaConPermiso>} />
      <Route path="ventas" element={<RutaConPermiso permission="SALES_CREATE"><SalesPOSPage /></RutaConPermiso>} />
      <Route path="ventas/consulta" element={<RutaConPermiso permission="SALES_READ"><SalesHistoryPage /></RutaConPermiso>} />
      <Route path="configuracion-ui" element={<TenantConfigPage />} />
      <Route path="administracion-tenant" element={<TenantAdminPage />} />
      <Route path="usuarios-super" element={<GlobalSuperAdminPage />} />
    </Route>
    <Route path="*" element={<Navigate to={`/${tenant}`} replace />} />
  </Routes>
}
export default AppRoutes
