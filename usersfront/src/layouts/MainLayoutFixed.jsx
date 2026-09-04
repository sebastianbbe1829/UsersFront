import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTenantConfig } from '../contexts/TenantConfigContext'
import { obtenerPayloadToken } from '../services/api'
import Can from '../components/Can'
import SessionManager from '../components/SessionManager'
import ClientMenu from '../components/ClientMenu'

function MainLayoutFixed() {
  const { usuarioLogueado, cerrarSesion, manejarSesionExpirada, tenant, token, estadoActividad } = useAuth()
  const { config } = useTenantConfig()
  const payload = obtenerPayloadToken(token)
  const esSuper = payload?.user_type === 'SUPER'
  const navigate = useNavigate()
  const location = useLocation()
  const [menuColapsado, setMenuColapsado] = useState(false)
  const administracionPorRuta = ['usuarios', 'roles', 'permisos'].some((ruta) => location.pathname.split('/').includes(ruta))
  const extintoresPorRuta = location.pathname.includes('/extintores')
  const [administracionAbierta, setAdministracionAbierta] = useState(administracionPorRuta)
  const [extintoresAbiertos, setExtintoresAbiertos] = useState(extintoresPorRuta)
  const [modoOscuro, setModoOscuro] = useState(() => localStorage.getItem('modo_oscuro') === 'true')
  const primaryColor = config?.primary_color || '#0d6efd'
  const secondaryColor = config?.secondary_color || '#6f42c1'
  const appTitle = config?.app_title || 'Fenix SaS'
  const rutaTenant = tenant ? `/${tenant}` : ''
  const administracionMenuAbierto = administracionAbierta
  const extintoresMenuAbierto = extintoresAbiertos

  useEffect(() => {
    if (administracionPorRuta) setAdministracionAbierta(true)
  }, [administracionPorRuta])

  useEffect(() => {
    if (extintoresPorRuta) setExtintoresAbiertos(true)
  }, [extintoresPorRuta])

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

  const manejarAdministracion = () => setAdministracionAbierta((valor) => !valor)

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
      <aside className={modoOscuro ? 'bg-black text-light shadow' : 'bg-dark text-white shadow'} style={{ width: menuColapsado ? '72px' : '250px', minHeight: '100vh', transition: 'width .25s ease', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 1000, overflow: menuColapsado ? 'visible' : 'hidden' }}>
        <div className="d-flex align-items-center justify-content-between px-3 py-3 border-bottom border-secondary" style={{ height: '70px' }}>
          {!menuColapsado && <div className="d-flex align-items-center gap-2 fw-bold text-nowrap">{config?.logo_url ? <img src={config.logo_url} alt="Logo" style={{ maxHeight: '36px', maxWidth: '48px', objectFit: 'contain' }} onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <span>👥</span>}<span>{appTitle}</span></div>}
          <button type="button" className="btn btn-outline-light border-0 ms-auto" onClick={() => setMenuColapsado((valor) => !valor)} title={menuColapsado ? 'Mostrar menú' : 'Ocultar menú'}>{menuColapsado ? '☰' : '✕'}</button>
        </div>

        <nav className="d-flex flex-column">
          <NavLink to={tenant ? `/${tenant}` : '/'} end className={({ isActive }) => obtenerClaseMenu(isActive)} title="Inicio" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}>
            <span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>🏠</span>{!menuColapsado && <span className="ms-3">Inicio</span>}
          </NavLink>

          <Can permission="EXTINGUISHER_READ">
            <button type="button" className={obtenerClaseMenu(extintoresPorRuta)} onClick={() => setExtintoresAbiertos((valor) => !valor)} title="Extintores" style={{ background: 'transparent' }}>
              <span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>🧯</span>{!menuColapsado && <><span className="ms-3 flex-grow-1 text-start">Extintores</span><span>{extintoresMenuAbierto ? '▾' : '▸'}</span></>}
            </button>
            {extintoresMenuAbierto && !menuColapsado && <div className="ps-3">
              <Can permission="EXTINGUISHER_READ"><NavLink to={`${rutaTenant}/extintores`} end className={({ isActive }) => obtenerClaseMenu(isActive)} title="Inventario"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🧯</span><span className="ms-3">Inventario</span></NavLink></Can>
              <Can permission="EXTINGUISHER_READ"><NavLink to={`${rutaTenant}/extintores/tipos`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Tipos de extintores"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🏷️</span><span className="ms-3">Tipos de extintores</span></NavLink></Can>
              <Can permission="EXTINGUISHER_READ"><NavLink to={`${rutaTenant}/extintores/revisiones`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Revisiones"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>📋</span><span className="ms-3">Revisiones</span></NavLink></Can>
              <Can permission="EXTINGUISHER_READ"><NavLink to={`${rutaTenant}/extintores/items-revision`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Ítems de revisión"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>☑️</span><span className="ms-3">Ítems de revisión</span></NavLink></Can>
            </div>}
          </Can>

          <ClientMenu rutaTenant={rutaTenant} menuColapsado={menuColapsado} obtenerClaseMenu={obtenerClaseMenu} />

          <Can permissions={['USER_READ', 'ROLE_READ', 'PERMISSION_READ']}>
            <button type="button" className={obtenerClaseMenu(administracionPorRuta)} onClick={manejarAdministracion} title="Administración" style={{ background: 'transparent' }}>
              <span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>⚙️</span>{!menuColapsado && <><span className="ms-3 flex-grow-1 text-start">Administración</span><span>{administracionMenuAbierto ? '▾' : '▸'}</span></>}
            </button>
            {administracionMenuAbierto && !menuColapsado && <div className="ps-3">
              <Can permission="USER_READ"><NavLink to={`${rutaTenant}/usuarios`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Usuarios"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>👥</span><span className="ms-3">Usuarios</span></NavLink></Can>
              <Can permission="ROLE_READ"><NavLink to={`${rutaTenant}/roles`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Roles"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🛡️</span><span className="ms-3">Roles</span></NavLink></Can>
              <Can permission="PERMISSION_READ"><NavLink to={`${rutaTenant}/permisos`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Permisos"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🔐</span><span className="ms-3">Permisos</span></NavLink></Can>
            </div>}
          </Can>

          {esSuper && <NavLink to={`${rutaTenant}/configuracion-ui`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Configuración de la interfaz"><span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>🎨</span>{!menuColapsado && <span className="ms-3">Configuración UI</span>}</NavLink>}
          {esSuper && <NavLink to={`${rutaTenant}/administracion-tenant`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Administración del tenant"><span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>🏢</span>{!menuColapsado && <span className="ms-3">Administración del tenant</span>}</NavLink>}
          {esSuper && <NavLink to={`${rutaTenant}/usuarios-super`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Usuarios SUPER" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}><span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>👑</span>{!menuColapsado && <span className="ms-3">Usuarios SUPER</span>}</NavLink>}
        </nav>

        <div className="position-absolute bottom-0 start-0 end-0">
          <button type="button" className="btn text-white border-0 rounded-0 w-100 text-start py-3 px-3" style={{ backgroundColor: secondaryColor }} onClick={cambiarModoOscuro} title={modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}><span style={{ fontSize: '21px', minWidth: '24px', display: 'inline-block', textAlign: 'center' }}>{modoOscuro ? '☀️' : '🌙'}</span>{!menuColapsado && <span className="ms-3">{modoOscuro ? 'Modo claro' : 'Modo oscuro'}</span>}</button>
          <button type="button" className="btn text-white rounded-0 w-100 text-start py-3 px-3" style={{ backgroundColor: primaryColor }} onClick={manejarCerrarSesion} title="Cerrar sesión"><span style={{ fontSize: '21px', minWidth: '24px', display: 'inline-block', textAlign: 'center' }}>🚪</span>{!menuColapsado && <span className="ms-3">Cerrar sesión</span>}</button>
        </div>
      </aside>

      <main style={{ marginLeft: menuColapsado ? '72px' : '250px', width: `calc(100% - ${menuColapsado ? '72px' : '250px'})`, minHeight: '100vh', transition: 'margin-left .25s ease, width .25s ease' }}>
        <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
        <header className={modoOscuro ? 'bg-black text-light shadow-sm' : 'bg-white text-dark shadow-sm'} style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: `3px solid ${primaryColor}` }}>
          <div className="d-flex align-items-center gap-2"><span style={{ fontSize: '21px', color: secondaryColor }}>{pagina.icono}</span><h5 className="mb-0 fw-bold">{pagina.titulo}</h5></div>
          <div className="d-flex align-items-center gap-3">
            {tenant && <div className="d-none d-md-flex align-items-center gap-2"><span>🏢</span><span className="fw-semibold">{tenant}</span></div>}
            {tenant && usuarioLogueado && <span className="text-muted d-none d-md-inline">|</span>}
            {usuarioLogueado && (
              <div className="d-flex align-items-center gap-2">
                <span>👤</span>
                <div className="d-none d-md-flex flex-column align-items-end">
                  <small className="fw-semibold">{usuarioLogueado.name}</small>
                  <small className="text-muted">Número de identificación: {usuarioLogueado.dni}</small>
                  <small className={actividadEsActiva ? 'text-success' : 'text-warning'}>
                    {actividadEsActiva ? '🟢 Activa' : '🟡 Inactiva'}
                  </small>
                </div>
              </div>
            )}
          </div>
        </header>
        <section className="p-4"><Outlet /></section>
      </main>
    </div>
  )
}

export default MainLayoutFixed