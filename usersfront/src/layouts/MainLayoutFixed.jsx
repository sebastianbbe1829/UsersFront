import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTenantConfig } from '../contexts/TenantConfigContext'
import { obtenerPayloadToken } from '../services/api'
import Can from '../components/Can'
import SessionManager from '../components/SessionManager'
import ClientMenu from '../components/ClientMenu'
import '../styles/navigation-drawer.css'

function MainLayoutFixed() {
  const { usuarioLogueado, cerrarSesion, manejarSesionExpirada, tenant, token, estadoActividad } = useAuth()
  const { config } = useTenantConfig()
  const payload = obtenerPayloadToken(token)
  const esSuper = payload?.user_type === 'SUPER'
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const administracionPorRuta = ['usuarios', 'roles', 'permisos'].some((ruta) => location.pathname.split('/').includes(ruta))
  const extintoresPorRuta = location.pathname.includes('/extintores')
  const clientesPorRuta = location.pathname.includes('/clientes')
  const carteraPorRuta = location.pathname.includes('/cartera')
  const inventariosPorRuta = location.pathname.includes('/inventarios')
  const ventasPorRuta = location.pathname.includes('/ventas')
  const cajaPorRuta = location.pathname.includes('/caja')
  const seccionPorRuta = clientesPorRuta ? 'clientes' : extintoresPorRuta ? 'extintores' : carteraPorRuta ? 'cartera' : inventariosPorRuta ? 'inventarios' : ventasPorRuta ? 'ventas' : cajaPorRuta ? 'caja' : administracionPorRuta ? 'administracion' : null
  const [seccionAbierta, setSeccionAbierta] = useState(seccionPorRuta)
  const [modoOscuro, setModoOscuro] = useState(() => localStorage.getItem('modo_oscuro') === 'true')
  const primaryColor = config?.primary_color || '#0d6efd'
  const appTitle = config?.app_title || 'Fenix SaS'
  const rutaTenant = tenant ? `/${tenant}` : ''

  useEffect(() => {
    setSeccionAbierta(seccionPorRuta)
    setMenuAbierto(false)
  }, [seccionPorRuta, location.pathname])

  useEffect(() => {
    const sincronizarModo = () => setModoOscuro(localStorage.getItem('modo_oscuro') === 'true')
    window.addEventListener('modo-oscuro-cambiado', sincronizarModo)
    window.addEventListener('storage', sincronizarModo)
    return () => {
      window.removeEventListener('modo-oscuro-cambiado', sincronizarModo)
      window.removeEventListener('storage', sincronizarModo)
    }
  }, [])

  useEffect(() => {
    const manejarEscape = (event) => {
      if (event.key === 'Escape') setMenuAbierto(false)
    }
    window.addEventListener('keydown', manejarEscape)
    return () => window.removeEventListener('keydown', manejarEscape)
  }, [])

  const alternarSeccion = (seccion) => setSeccionAbierta((actual) => (actual === seccion ? null : seccion))

  const cambiarModoOscuro = () => {
    const nuevoValor = !modoOscuro
    localStorage.setItem('modo_oscuro', String(nuevoValor))
    setModoOscuro(nuevoValor)
    window.dispatchEvent(new CustomEvent('modo-oscuro-cambiado', { detail: nuevoValor }))
  }

  const manejarCerrarSesion = () => {
    cerrarSesion()
    navigate(tenant ? `/${tenant}/login` : '/login', { replace: true })
  }

  const obtenerTituloPagina = () => {
    const ruta = location.pathname
    if (ruta.includes('/usuarios-super')) return { icono: '👑', titulo: 'Usuarios SUPER' }
    if (ruta.includes('/usuarios')) return { icono: '👥', titulo: 'Usuarios' }
    if (ruta.includes('/roles')) return { icono: '🛡️', titulo: 'Roles' }
    if (ruta.includes('/permisos')) return { icono: '🔐', titulo: 'Permisos' }
    if (ruta.includes('/extintores/items-revision')) return { icono: '🧯', titulo: 'Ítems de revisión' }
    if (ruta.includes('/extintores/revisiones')) return { icono: '🧯', titulo: 'Revisiones de extintores' }
    if (ruta.includes('/extintores/tipos')) return { icono: '🧯', titulo: 'Tipos de extintores' }
    if (ruta.includes('/extintores')) return { icono: '🧯', titulo: 'Extintores' }
    if (ruta.includes('/clientes/tipos-identificacion')) return { icono: '🪪', titulo: 'Tipos de Identificación' }
    if (ruta.includes('/clientes/demografica/paises')) return { icono: '🌎', titulo: 'Países' }
    if (ruta.includes('/clientes/demografica/departamentos')) return { icono: '🗺️', titulo: 'Departamentos' }
    if (ruta.includes('/clientes/demografica/ciudades')) return { icono: '📍', titulo: 'Ciudades' }
    if (ruta.includes('/clientes/informes-listas-restrictivas')) return { icono: '📊', titulo: 'Informes Listas Restrictivas' }
    if (ruta.includes('/clientes')) return { icono: '👥', titulo: 'Clientes' }
    if (ruta.includes('/cartera/pagos')) return { icono: '💳', titulo: 'Pagos de cartera' }
    if (ruta.includes('/cartera/obligaciones')) return { icono: '📋', titulo: 'Cartera' }
    if (ruta.includes('/cartera')) return { icono: '💰', titulo: 'Resumen de cartera' }
    if (ruta.includes('/caja/administracion')) return { icono: '⚙️', titulo: 'Administración de Caja' }
    if (ruta.includes('/caja')) return { icono: '🧾', titulo: 'Caja' }
    if (ruta.includes('/inventarios/movimientos')) return { icono: '📋', titulo: 'Movimientos de inventario' }
    if (ruta.includes('/inventarios/productos')) return { icono: '🛒', titulo: 'Productos de inventario' }
    if (ruta.includes('/inventarios/tipos')) return { icono: '🏷️', titulo: 'Tipos de inventario' }
    if (ruta.includes('/inventarios')) return { icono: '📦', titulo: 'Inventarios' }
    if (ruta.includes('/ventas/consulta')) return { icono: '📋', titulo: 'Consulta de ventas' }
    if (ruta.includes('/ventas')) return { icono: '🛒', titulo: 'Ventas' }
    if (ruta.includes('/configuracion-ui')) return { icono: '🎨', titulo: 'Configuración de la interfaz' }
    if (ruta.includes('/administracion-tenant')) return { icono: '🏢', titulo: 'Administración del tenant' }
    return { icono: '🏠', titulo: 'Panel de administración' }
  }

  const pagina = obtenerTituloPagina()
  const obtenerClaseMenu = (activo = false) => `d-flex align-items-center text-decoration-none py-3 px-3 border-0 rounded-0 w-100 ${activo ? 'text-white' : 'bg-dark text-white'}`
  const actividadEsActiva = estadoActividad !== 'INACTIVA'

  return (
    <div className={modoOscuro ? 'bg-dark text-light min-vh-100' : 'bg-light min-vh-100'} style={{ display: 'flex' }}>
      <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
      {menuAbierto && <div className="app-navigation-overlay" role="presentation" onClick={() => setMenuAbierto(false)} />}

      <aside className={modoOscuro ? 'bg-black text-light shadow app-navigation-drawer' : 'bg-dark text-white shadow app-navigation-drawer'} style={{ width: '250px', minHeight: '100vh', transition: 'transform .25s ease', transform: menuAbierto ? 'translateX(0)' : 'translateX(-100%)', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 1100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="d-flex align-items-center justify-content-between px-3 py-3 border-bottom border-secondary flex-shrink-0" style={{ height: '70px' }}>
          <div className="d-flex align-items-center gap-2 fw-bold text-nowrap">{config?.logo_url ? <img src={config.logo_url} alt="Logo" style={{ maxHeight: '36px', maxWidth: '48px', objectFit: 'contain' }} onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <span>👥</span>}<span>{appTitle}</span></div>
          <button type="button" className="btn btn-outline-light border-0" onClick={() => setMenuAbierto(false)} title="Cerrar menú">✕</button>
        </div>

        <nav className="sidebar-nav d-flex flex-column flex-grow-1" style={{ minHeight: 0, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,.22) transparent' }}>
          <NavLink to={tenant ? `/${tenant}` : '/'} end className={({ isActive }) => obtenerClaseMenu(isActive)} title="Inicio" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}><span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>🏠</span><span className="ms-3">Inicio</span></NavLink>

          <Can permission="EXTINGUISHER_READ">
            <button type="button" className={obtenerClaseMenu(extintoresPorRuta)} onClick={() => alternarSeccion('extintores')} title="Extintores" style={{ background: 'transparent' }}><span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>🧯</span><span className="ms-3 flex-grow-1 text-start">Extintores</span><span>{seccionAbierta === 'extintores' ? '▾' : '▸'}</span></button>
            {seccionAbierta === 'extintores' && <div className="ps-3">
              <Can permission="EXTINGUISHER_READ"><NavLink to={`${rutaTenant}/extintores`} end className={({ isActive }) => obtenerClaseMenu(isActive)} title="Inventario"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🧯</span><span className="ms-3">Inventario</span></NavLink></Can>
              <Can permission="EXTINGUISHER_READ"><NavLink to={`${rutaTenant}/extintores/tipos`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Tipos de extintores"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🏷️</span><span className="ms-3">Tipos de extintores</span></NavLink></Can>
              <Can permission="EXTINGUISHER_READ"><NavLink to={`${rutaTenant}/extintores/revisiones`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Revisiones"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>📋</span><span className="ms-3">Revisiones</span></NavLink></Can>
              <Can permission="EXTINGUISHER_READ"><NavLink to={`${rutaTenant}/extintores/items-revision`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Ítems de revisión"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>☑️</span><span className="ms-3">Ítems de revisión</span></NavLink></Can>
            </div>}
          </Can>

          <ClientMenu rutaTenant={rutaTenant} menuColapsado={false} obtenerClaseMenu={obtenerClaseMenu} abierto={seccionAbierta === 'clientes'} onToggleSection={() => alternarSeccion('clientes')} />

          <Can permissions={['PORTFOLIO_READ', 'PORTFOLIO_PAYMENT_CREATE']}>
            <button type="button" className={obtenerClaseMenu(carteraPorRuta)} onClick={() => alternarSeccion('cartera')} title="Cartera" style={{ background: 'transparent' }}><span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>💰</span><span className="ms-3 flex-grow-1 text-start">Cartera</span><span>{seccionAbierta === 'cartera' ? '▾' : '▸'}</span></button>
            {seccionAbierta === 'cartera' && <div className="ps-3">
              <Can permission="PORTFOLIO_READ"><NavLink to={`${rutaTenant}/cartera`} end className={({ isActive }) => obtenerClaseMenu(isActive)} title="Resumen de cartera"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>💰</span><span className="ms-3">Resumen de cartera</span></NavLink></Can>
              <Can permission="PORTFOLIO_READ"><NavLink to={`${rutaTenant}/cartera/obligaciones`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Cartera"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>📋</span><span className="ms-3">Cartera</span></NavLink></Can>
              <Can permission="PORTFOLIO_PAYMENT_CREATE"><NavLink to={`${rutaTenant}/cartera/pagos`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Pagos"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>💳</span><span className="ms-3">Pagos</span></NavLink></Can>
            </div>}
          </Can>

          <Can permission="CASH_READ">
            <button type="button" className={obtenerClaseMenu(cajaPorRuta)} onClick={() => alternarSeccion('caja')} title="Caja" style={{ background: 'transparent' }}><span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>🧾</span><span className="ms-3 flex-grow-1 text-start">Caja</span><span>{seccionAbierta === 'caja' ? '▾' : '▸'}</span></button>
            {seccionAbierta === 'caja' && <div className="ps-3">
              <Can permission="CASH_READ"><NavLink to={`${rutaTenant}/caja`} end className={({ isActive }) => obtenerClaseMenu(isActive)} title="Operación"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🧾</span><span className="ms-3">Operación</span></NavLink></Can>
              <Can permission="CASH_READ"><NavLink to={`${rutaTenant}/caja/administracion`} end className={({ isActive }) => obtenerClaseMenu(isActive)} title="Administración de Caja"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>⚙️</span><span className="ms-3">Administración</span></NavLink></Can>
            </div>}
          </Can>

          <Can permissions={['INVENTORY_READ', 'INVENTORY_MOVEMENT_READ', 'INVENTORY_MOVEMENT_CREATE']}>
            <button type="button" className={obtenerClaseMenu(inventariosPorRuta)} onClick={() => alternarSeccion('inventarios')} title="Inventarios" style={{ background: 'transparent' }}><span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>📦</span><span className="ms-3 flex-grow-1 text-start">Inventarios</span><span>{seccionAbierta === 'inventarios' ? '▾' : '▸'}</span></button>
            {seccionAbierta === 'inventarios' && <div className="ps-3">
              <Can permission="INVENTORY_READ"><NavLink to={`${rutaTenant}/inventarios`} end className={({ isActive }) => obtenerClaseMenu(isActive)} title="Inventario"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>📦</span><span className="ms-3">Inventario</span></NavLink></Can>
              <Can permission="INVENTORY_READ"><NavLink to={`${rutaTenant}/inventarios/tipos`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Tipos"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🏷️</span><span className="ms-3">Tipos</span></NavLink></Can>
              <Can permission="INVENTORY_READ"><NavLink to={`${rutaTenant}/inventarios/productos`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Productos"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🛒</span><span className="ms-3">Productos</span></NavLink></Can>
              <Can permissions={['INVENTORY_MOVEMENT_READ', 'INVENTORY_MOVEMENT_CREATE']}><NavLink to={`${rutaTenant}/inventarios/movimientos`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Movimientos"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>📋</span><span className="ms-3">Movimientos</span></NavLink></Can>
            </div>}
          </Can>

          <Can permissions={['SALES_READ', 'SALES_CREATE']}>
            <button type="button" className={obtenerClaseMenu(ventasPorRuta)} onClick={() => alternarSeccion('ventas')} title="Ventas" style={{ background: 'transparent' }}><span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>🛒</span><span className="ms-3 flex-grow-1 text-start">Ventas</span><span>{seccionAbierta === 'ventas' ? '▾' : '▸'}</span></button>
            {seccionAbierta === 'ventas' && <div className="ps-3">
              <Can permission="SALES_CREATE"><NavLink to={`${rutaTenant}/ventas`} end className={({ isActive }) => obtenerClaseMenu(isActive)} title="Punto de venta"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🛒</span><span className="ms-3">Punto de venta</span></NavLink></Can>
              <Can permission="SALES_READ"><NavLink to={`${rutaTenant}/ventas/consulta`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Consulta de ventas"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>📋</span><span className="ms-3">Consulta de ventas</span></NavLink></Can>
            </div>}
          </Can>

          <Can permissions={['USER_READ', 'ROLE_READ', 'PERMISSION_READ']}>
            <button type="button" className={obtenerClaseMenu(administracionPorRuta)} onClick={() => alternarSeccion('administracion')} title="Administración" style={{ background: 'transparent' }}><span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>⚙️</span><span className="ms-3 flex-grow-1 text-start">Administración</span><span>{seccionAbierta === 'administracion' ? '▾' : '▸'}</span></button>
            {seccionAbierta === 'administracion' && <div className="ps-3">
              <Can permission="USER_READ"><NavLink to={`${rutaTenant}/usuarios`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Usuarios"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>👥</span><span className="ms-3">Usuarios</span></NavLink></Can>
              <Can permission="ROLE_READ"><NavLink to={`${rutaTenant}/roles`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Roles"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🛡️</span><span className="ms-3">Roles</span></NavLink></Can>
              <Can permission="PERMISSION_READ"><NavLink to={`${rutaTenant}/permisos`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Permisos"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🔐</span><span className="ms-3">Permisos</span></NavLink></Can>
            </div>}
          </Can>

          {esSuper && <NavLink to={`${rutaTenant}/configuracion-ui`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Configuración de la interfaz"><span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>🎨</span><span className="ms-3">Configuración UI</span></NavLink>}
          {esSuper && <NavLink to={`${rutaTenant}/administracion-tenant`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Administración del tenant"><span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>🏢</span><span className="ms-3">Administración del tenant</span></NavLink>}
          {esSuper && <NavLink to={`${rutaTenant}/usuarios-super`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Usuarios SUPER"><span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>👑</span><span className="ms-3">Usuarios SUPER</span></NavLink>}
        </nav>

        <div className="px-3 py-3 border-top border-secondary flex-shrink-0">
          <div className="d-flex align-items-center gap-2 mb-2 text-truncate" title={usuarioLogueado?.email || usuarioLogueado?.username || 'Usuario'}><span>👤</span><span className="text-truncate">{usuarioLogueado?.email || usuarioLogueado?.username || 'Usuario'}</span></div>
          <div className="d-flex align-items-center justify-content-between gap-2">
            <button type="button" className="btn btn-sm btn-outline-light" onClick={cambiarModoOscuro} title="Cambiar modo oscuro">{modoOscuro ? '☀️' : '🌙'}</button>
            <span className={`badge ${actividadEsActiva ? 'bg-success' : 'bg-secondary'}`}>{actividadEsActiva ? 'Activo' : 'Inactivo'}</span>
            <button type="button" className="btn btn-sm btn-outline-light" onClick={manejarCerrarSesion} title="Cerrar sesión">Salir</button>
          </div>
        </div>
      </aside>

      <main className="flex-grow-1" style={{ minWidth: 0 }}>
        <header className="bg-white shadow-sm d-flex align-items-center justify-content-between px-3" style={{ height: '70px' }}>
          <div className="d-flex align-items-center gap-2">
            <button type="button" className="btn btn-dark" onClick={() => setMenuAbierto(true)} title="Abrir menú">☰</button>
            <div className="fw-bold">{pagina.icono} {pagina.titulo}</div>
          </div>
        </header>
        <div className="p-3"><Outlet /></div>
      </main>
    </div>
  )
}

export default MainLayoutFixed
