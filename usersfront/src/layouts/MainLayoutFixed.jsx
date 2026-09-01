import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { useEffect, useState } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { useTenantConfig } from '../contexts/TenantConfigContext'
import { obtenerPayloadToken } from '../services/api'

function MainLayoutFixed() {
  const { usuarioLogueado, cerrarSesion, tenant, token } = useAuth()
  const { config } = useTenantConfig()
  const payload = obtenerPayloadToken(token)
  const esSuper = payload?.user_type === 'SUPER'
  const navigate = useNavigate()
  const location = useLocation()

  const [menuColapsado, setMenuColapsado] = useState(false)
  const [administracionAbierta, setAdministracionAbierta] = useState(() => {
    return ['/usuarios', '/roles', '/permisos'].some((ruta) => location.pathname.includes(ruta))
  })
  const [modoOscuro, setModoOscuro] = useState(() => localStorage.getItem('modo_oscuro') === 'true')

  const primaryColor = config?.primary_color || '#0d6efd'
  const secondaryColor = config?.secondary_color || '#6f42c1'
  const appTitle = config?.app_title || 'Fenix SaS'

  useEffect(() => {
    if (['/usuarios', '/roles', '/permisos'].some((ruta) => location.pathname.includes(ruta))) {
      setAdministracionAbierta(true)
    }
  }, [location.pathname])

  const cambiarModoOscuro = () => {
    setModoOscuro((valor) => {
      const nuevoValor = !valor
      localStorage.setItem('modo_oscuro', nuevoValor)
      window.dispatchEvent(new Event('modo-oscuro-cambiado'))
      return nuevoValor
    })
  }

  const manejarCerrarSesion = () => {
    cerrarSesion()
    navigate(tenant ? `/${tenant}/login` : '/login', { replace: true })
  }

  const obtenerTituloPagina = () => {
    const ruta = location.pathname
    if (ruta.includes('/usuarios')) return { icono: '👥', titulo: 'Usuarios' }
    if (ruta.includes('/roles')) return { icono: '🛡️', titulo: 'Roles' }
    if (ruta.includes('/permisos')) return { icono: '🔐', titulo: 'Permisos' }
    if (ruta.includes('/extintores')) return { icono: '🧯', titulo: 'Extintores' }
    if (ruta.includes('/configuracion-ui')) return { icono: '🎨', titulo: 'Configuración de la interfaz' }
    if (ruta.includes('/administracion-tenant')) return { icono: '🏢', titulo: 'Administración del tenant' }
    return { icono: '🏠', titulo: 'Panel de administración' }
  }

  const pagina = obtenerTituloPagina()
  const obtenerClaseMenu = (activo = false) => `d-flex align-items-center text-decoration-none py-3 px-3 border-0 rounded-0 w-100 ${activo ? 'text-white' : 'bg-dark text-white'}`

  return (
    <div className={modoOscuro ? 'bg-dark text-light min-vh-100' : 'bg-light min-vh-100'} style={{ display: 'flex' }}>
      <aside className={modoOscuro ? 'bg-black text-light shadow' : 'bg-dark text-white shadow'} style={{ width: menuColapsado ? '72px' : '250px', minHeight: '100vh', transition: 'width 0.25s ease', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 1000, overflow: 'hidden' }}>
        <div className="d-flex align-items-center justify-content-between px-3 py-3 border-bottom border-secondary" style={{ height: '70px' }}>
          {!menuColapsado && (
            <div className="d-flex align-items-center gap-2 fw-bold text-nowrap">
              {config?.logo_url ? (
                <img src={config.logo_url} alt="Logo" style={{ maxHeight: '36px', maxWidth: '48px', objectFit: 'contain' }} onError={(event) => { event.currentTarget.style.display = 'none' }} />
              ) : <span>👥</span>}
              <span>{appTitle}</span>
            </div>
          )}
          <button type="button" className="btn btn-outline-light border-0 ms-auto" onClick={() => setMenuColapsado((valor) => !valor)} title={menuColapsado ? 'Mostrar menú' : 'Ocultar menú'}>
            {menuColapsado ? '☰' : '✕'}
          </button>
        </div>

        <nav className="d-flex flex-column">
          <NavLink to={tenant ? `/${tenant}` : '/'} end className={({ isActive }) => obtenerClaseMenu(isActive)} title="Inicio" style={({ isActive }) => isActive ? { backgroundColor: primaryColor } : undefined}>
            <span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>🏠</span>
            {!menuColapsado && <span className="ms-3">Inicio</span>}
          </NavLink>

          <NavLink to="extintores" className={({ isActive }) => obtenerClaseMenu(isActive)} title="Extintores" style={({ isActive }) => isActive ? { backgroundColor: primaryColor } : undefined}>
            <span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>🧯</span>
            {!menuColapsado && <span className="ms-3">Extintores</span>}
          </NavLink>

          <button type="button" className={obtenerClaseMenu(['/usuarios', '/roles', '/permisos'].some((ruta) => location.pathname.includes(ruta)))} onClick={() => setAdministracionAbierta((valor) => !valor)} title="Administración" style={{ background: 'transparent' }}>
            <span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>⚙️</span>
            {!menuColapsado && (
              <>
                <span className="ms-3 flex-grow-1 text-start">Administración</span>
                <span>{administracionAbierta ? '▾' : '▸'}</span>
              </>
            )}
          </button>

          {administracionAbierta && !menuColapsado && (
            <div className="ps-3">
              <NavLink to="usuarios" className={({ isActive }) => obtenerClaseMenu(isActive)} title="Usuarios" style={({ isActive }) => isActive ? { backgroundColor: primaryColor } : undefined}>
                <span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>👥</span>
                <span className="ms-3">Usuarios</span>
              </NavLink>
              <NavLink to="roles" className={({ isActive }) => obtenerClaseMenu(isActive)} title="Roles" style={({ isActive }) => isActive ? { backgroundColor: primaryColor } : undefined}>
                <span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🛡️</span>
                <span className="ms-3">Roles</span>
              </NavLink>
              <NavLink to="permisos" className={({ isActive }) => obtenerClaseMenu(isActive)} title="Permisos" style={({ isActive }) => isActive ? { backgroundColor: primaryColor } : undefined}>
                <span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🔐</span>
                <span className="ms-3">Permisos</span>
              </NavLink>
            </div>
          )}

          {menuColapsado && administracionAbierta && (
            <div className="border-top border-secondary border-bottom border-secondary">
              <NavLink to="usuarios" className={({ isActive }) => obtenerClaseMenu(isActive)} title="Usuarios" style={({ isActive }) => isActive ? { backgroundColor: primaryColor } : undefined}><span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>👥</span></NavLink>
              <NavLink to="roles" className={({ isActive }) => obtenerClaseMenu(isActive)} title="Roles" style={({ isActive }) => isActive ? { backgroundColor: primaryColor } : undefined}><span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>🛡️</span></NavLink>
              <NavLink to="permisos" className={({ isActive }) => obtenerClaseMenu(isActive)} title="Permisos" style={({ isActive }) => isActive ? { backgroundColor: primaryColor } : undefined}><span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>🔐</span></NavLink>
            </div>
          )}

          {esSuper && (
            <NavLink to="configuracion-ui" className={({ isActive }) => obtenerClaseMenu(isActive)} title="Configuración de la interfaz" style={({ isActive }) => isActive ? { backgroundColor: primaryColor } : undefined}>
              <span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>🎨</span>
              {!menuColapsado && <span className="ms-3">Configuración UI</span>}
            </NavLink>
          )}
          {esSuper && (
            <NavLink to="administracion-tenant" className={({ isActive }) => obtenerClaseMenu(isActive)} title="Administración del tenant" style={({ isActive }) => isActive ? { backgroundColor: primaryColor } : undefined}>
              <span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>🏢</span>
              {!menuColapsado && <span className="ms-3">Administración del tenant</span>}
            </NavLink>
          )}
        </nav>

        <div className="position-absolute bottom-0 start-0 end-0">
          <button type="button" className="btn text-white border-0 rounded-0 w-100 text-start py-3 px-3" style={{ backgroundColor: secondaryColor }} onClick={cambiarModoOscuro} title={modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
            <span style={{ fontSize: '21px', minWidth: '24px', display: 'inline-block', textAlign: 'center' }}>{modoOscuro ? '☀️' : '🌙'}</span>
            {!menuColapsado && <span className="ms-3">{modoOscuro ? 'Modo claro' : 'Modo oscuro'}</span>}
          </button>
          <button type="button" className="btn text-white rounded-0 w-100 text-start py-3 px-3" style={{ backgroundColor: primaryColor }} onClick={manejarCerrarSesion} title="Cerrar sesión">
            <span style={{ fontSize: '21px', minWidth: '24px', display: 'inline-block', textAlign: 'center' }}>🚪</span>
            {!menuColapsado && <span className="ms-3">Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: menuColapsado ? '72px' : '250px', width: `calc(100% - ${menuColapsado ? '72px' : '250px'})`, minHeight: '100vh', transition: 'margin-left 0.25s ease, width 0.25s ease' }}>
        <header className={modoOscuro ? 'bg-black text-light shadow-sm' : 'bg-white text-dark shadow-sm'} style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: `3px solid ${primaryColor}` }}>
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '21px', color: secondaryColor }}>{pagina.icono}</span>
            <h5 className="mb-0 fw-bold">{pagina.titulo}</h5>
          </div>
          <div className="d-flex align-items-center gap-3">
            {tenant && <div className="d-none d-md-flex align-items-center gap-2"><span>🏢</span><span className="fw-semibold">{tenant}</span></div>}
            {tenant && usuarioLogueado && <span className="text-muted d-none d-md-inline">|</span>}
            {usuarioLogueado && (
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '21px' }}>👤</span>
                <div className="d-none d-sm-block text-end">
                  <div className="fw-semibold text-truncate" style={{ maxWidth: '180px' }}>{usuarioLogueado.name}</div>
                  {esSuper && <small className="fw-semibold" style={{ color: primaryColor }}>SUPER</small>}
                </div>
              </div>
            )}
            <div className="d-flex align-items-center gap-1" title="Sesión activa"><span style={{ fontSize: '12px' }}>🟢</span><small className="text-muted">Activa</small></div>
          </div>
        </header>
        <section className="p-4"><Outlet /></section>
      </main>
    </div>
  )
}

export default MainLayoutFixed
