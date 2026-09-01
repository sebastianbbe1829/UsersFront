import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTenantConfig } from '../contexts/TenantConfigContext'
import { exportarExtintoresExcel, obtenerPayloadToken } from '../services/api'

function MainLayoutFixed() {
  const { usuarioLogueado, cerrarSesion, tenant, token } = useAuth()
  const { config } = useTenantConfig()
  const payload = obtenerPayloadToken(token)
  const esSuper = payload?.user_type === 'SUPER'
  const navigate = useNavigate()
  const location = useLocation()
  const [menuColapsado, setMenuColapsado] = useState(false)
  const [administracionAbierta, setAdministracionAbierta] = useState(() => ['/usuarios', '/roles', '/permisos'].some((ruta) => location.pathname.includes(ruta)))
  const [extintoresAbiertos, setExtintoresAbiertos] = useState(() => location.pathname.includes('/extintores'))
  const [modoOscuro, setModoOscuro] = useState(() => localStorage.getItem('modo_oscuro') === 'true')
  const [exportandoExtintores, setExportandoExtintores] = useState(false)
  const [exportContainer, setExportContainer] = useState(null)
  const primaryColor = config?.primary_color || '#0d6efd'
  const secondaryColor = config?.secondary_color || '#6f42c1'
  const appTitle = config?.app_title || 'Fenix SaS'
  const enInventarioExtintores = location.pathname.endsWith('/extintores')
  const rutaTenant = tenant ? `/${tenant}` : ''

  useEffect(() => {
    if (['/usuarios', '/roles', '/permisos'].some((ruta) => location.pathname.includes(ruta))) setAdministracionAbierta(true)
    if (location.pathname.includes('/extintores')) setExtintoresAbiertos(true)
  }, [location.pathname])

  useEffect(() => {
    if (!enInventarioExtintores) {
      setExportContainer(null)
      return undefined
    }

    let slot = null

    const buscarContenedor = () => {
      const resumen = document.querySelector('section .d-flex.flex-column.flex-md-row.justify-content-between.align-items-md-center.gap-2.mt-3 > div:first-child')
      if (!resumen) return

      slot = resumen.querySelector('[data-extinguishers-export-slot]')
      if (!slot) {
        slot = document.createElement('div')
        slot.setAttribute('data-extinguishers-export-slot', 'true')
        slot.className = 'd-inline-flex align-items-center ms-md-3 mt-2 mt-md-0'
        resumen.appendChild(slot)
      }

      setExportContainer(slot)
    }

    buscarContenedor()

    const observer = new MutationObserver(buscarContenedor)
    const section = document.querySelector('main section')
    if (section) observer.observe(section, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      if (slot?.parentNode) slot.parentNode.removeChild(slot)
      setExportContainer(null)
    }
  }, [enInventarioExtintores])

  const cambiarModoOscuro = () => { setModoOscuro((valor) => { const nuevoValor = !valor; localStorage.setItem('modo_oscuro', nuevoValor); window.dispatchEvent(new Event('modo-oscuro-cambiado')); return nuevoValor }) }
  const manejarCerrarSesion = () => { cerrarSesion(); navigate(tenant ? `/${tenant}/login` : '/login', { replace: true }) }
  const manejarAdministracion = () => setAdministracionAbierta((valor) => !valor)
  const exportarExcel = async () => {
    try {
      setExportandoExtintores(true)
      const blob = await exportarExtintoresExcel(token)
      const url = window.URL.createObjectURL(blob)
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = `extintores_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      if (error.status === 401) return manejarCerrarSesion()
      console.error('No fue posible exportar los extintores:', error)
    } finally { setExportandoExtintores(false) }
  }
  const botonExportarExcel = enInventarioExtintores && exportContainer
    ? createPortal(<button type="button" className="btn btn-outline-success btn-sm" onClick={exportarExcel} disabled={exportandoExtintores} title="Exportar todos los extintores a Excel">{exportandoExtintores ? 'Exportando...' : '📊 Exportar Excel'}</button>, exportContainer)
    : null
  const obtenerTituloPagina = () => { const ruta = location.pathname; if (ruta.includes('/usuarios')) return { icono: '👥', titulo: 'Usuarios' }; if (ruta.includes('/roles')) return { icono: '🛡️', titulo: 'Roles' }; if (ruta.includes('/permisos')) return { icono: '🔐', titulo: 'Permisos' }; if (ruta.includes('/extintores/items-revision')) return { icono: '🧯', titulo: 'Ítems de revisión' }; if (ruta.includes('/extintores/revisiones')) return { icono: '🧯', titulo: 'Revisiones de extintores' }; if (ruta.includes('/extintores/tipos')) return { icono: '🧯', titulo: 'Tipos de extintores' }; if (ruta.includes('/extintores')) return { icono: '🧯', titulo: 'Extintores' }; if (ruta.includes('/configuracion-ui')) return { icono: '🎨', titulo: 'Configuración de la interfaz' }; if (ruta.includes('/administracion-tenant')) return { icono: '🏢', titulo: 'Administración del tenant' }; return { icono: '🏠', titulo: 'Panel de administración' } }
  const pagina = obtenerTituloPagina()
  const obtenerClaseMenu = (activo = false) => `d-flex align-items-center text-decoration-none py-3 px-3 border-0 rounded-0 w-100 ${activo ? 'text-white' : 'bg-dark text-white'}`

  return <div className={modoOscuro ? 'bg-dark text-light min-vh-100' : 'bg-light min-vh-100'} style={{ display: 'flex' }}>
    <aside className={modoOscuro ? 'bg-black text-light shadow' : 'bg-dark text-white shadow'} style={{ width: menuColapsado ? '72px' : '250px', minHeight: '100vh', transition: 'width .25s ease', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 1000, overflow: menuColapsado ? 'visible' : 'hidden' }}>
      <div className="d-flex align-items-center justify-content-between px-3 py-3 border-bottom border-secondary" style={{ height: '70px' }}>{!menuColapsado && <div className="d-flex align-items-center gap-2 fw-bold text-nowrap">{config?.logo_url ? <img src={config.logo_url} alt="Logo" style={{ maxHeight: '36px', maxWidth: '48px', objectFit: 'contain' }} onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <span>👥</span>}<span>{appTitle}</span></div>}<button type="button" className="btn btn-outline-light border-0 ms-auto" onClick={() => setMenuColapsado((valor) => !valor)} title={menuColapsado ? 'Mostrar menú' : 'Ocultar menú'}>{menuColapsado ? '☰' : '✕'}</button></div>
      <nav className="d-flex flex-column">
        <NavLink to={tenant ? `/${tenant}` : '/'} end className={({ isActive }) => obtenerClaseMenu(isActive)} title="Inicio" style={({ isActive }) => isActive ? { backgroundColor: primaryColor } : undefined}><span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>🏠</span>{!menuColapsado && <span className="ms-3">Inicio</span>}</NavLink>
        <button type="button" className={obtenerClaseMenu(location.pathname.includes('/extintores'))} onClick={() => setExtintoresAbiertos((valor) => !valor)} title="Extintores" style={{ background: 'transparent' }}><span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>🧯</span>{!menuColapsado && <><span className="ms-3 flex-grow-1 text-start">Extintores</span><span>{extintoresAbiertos ? '▾' : '▸'}</span></>}</button>
        {extintoresAbiertos && !menuColapsado && <div className="ps-3"><NavLink to={`${rutaTenant}/extintores`} end className={({ isActive }) => obtenerClaseMenu(isActive)} title="Inventario"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🧯</span><span className="ms-3">Inventario</span></NavLink><NavLink to={`${rutaTenant}/extintores/tipos`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Tipos de extintores"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🏷️</span><span className="ms-3">Tipos de extintores</span></NavLink><NavLink to={`${rutaTenant}/extintores/revisiones`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Revisiones"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>📋</span><span className="ms-3">Revisiones</span></NavLink><NavLink to={`${rutaTenant}/extintores/items-revision`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Ítems de revisión"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>☑️</span><span className="ms-3">Ítems de revisión</span></NavLink></div>}
        {extintoresAbiertos && menuColapsado && <div className="border-top border-secondary border-bottom border-secondary"><NavLink to={`${rutaTenant}/extintores`} end className={({ isActive }) => obtenerClaseMenu(isActive)} title="Inventario"><span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>🧯</span></NavLink><NavLink to={`${rutaTenant}/extintores/tipos`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Tipos de extintores"><span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>🏷️</span></NavLink><NavLink to={`${rutaTenant}/extintores/revisiones`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Revisiones"><span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>📋</span></NavLink><NavLink to={`${rutaTenant}/extintores/items-revision`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Ítems de revisión"><span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>☑️</span></NavLink></div>}
        <button type="button" className={obtenerClaseMenu(['/usuarios', '/roles', '/permisos'].some((ruta) => location.pathname.includes(ruta)))} onClick={manejarAdministracion} title="Administración" style={{ background: 'transparent' }}><span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>⚙️</span>{!menuColapsado && <><span className="ms-3 flex-grow-1 text-start">Administración</span><span>{administracionAbierta ? '▾' : '▸'}</span></>}</button>
        {administracionAbierta && !menuColapsado && <div className="ps-3"><NavLink to={`${rutaTenant}/usuarios`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Usuarios"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>👥</span><span className="ms-3">Usuarios</span></NavLink><NavLink to={`${rutaTenant}/roles`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Roles"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🛡️</span><span className="ms-3">Roles</span></NavLink><NavLink to={`${rutaTenant}/permisos`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Permisos"><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🔐</span><span className="ms-3">Permisos</span></NavLink></div>}
        {administracionAbierta && menuColapsado && <div className="border-top border-secondary border-bottom border-secondary"><NavLink to={`${rutaTenant}/usuarios`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Usuarios"><span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>👥</span></NavLink><NavLink to={`${rutaTenant}/roles`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Roles"><span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>🛡️</span></NavLink><NavLink to={`${rutaTenant}/permisos`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Permisos"><span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>🔐</span></NavLink></div>}
        {esSuper && <NavLink to={`${rutaTenant}/configuracion-ui`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Configuración de la interfaz"><span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>🎨</span>{!menuColapsado && <span className="ms-3">Configuración UI</span>}</NavLink>}
        {esSuper && <NavLink to={`${rutaTenant}/administracion-tenant`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Administración del tenant"><span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>🏢</span>{!menuColapsado && <span className="ms-3">Administración del tenant</span>}</NavLink>}
      </nav>
      <div className="position-absolute bottom-0 start-0 end-0"><button type="button" className="btn text-white border-0 rounded-0 w-100 text-start py-3 px-3" style={{ backgroundColor: secondaryColor }} onClick={cambiarModoOscuro} title={modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}><span style={{ fontSize: '21px', minWidth: '24px', display: 'inline-block', textAlign: 'center' }}>{modoOscuro ? '☀️' : '🌙'}</span>{!menuColapsado && <span className="ms-3">{modoOscuro ? 'Modo claro' : 'Modo oscuro'}</span>}</button><button type="button" className="btn text-white rounded-0 w-100 text-start py-3 px-3" style={{ backgroundColor: primaryColor }} onClick={manejarCerrarSesion} title="Cerrar sesión"><span style={{ fontSize: '21px', minWidth: '24px', display: 'inline-block', textAlign: 'center' }}>🚪</span>{!menuColapsado && <span className="ms-3">Cerrar sesión</span>}</button></div>
    </aside>
    <main style={{ marginLeft: menuColapsado ? '72px' : '250px', width: `calc(100% - ${menuColapsado ? '72px' : '250px'})`, minHeight: '100vh', transition: 'margin-left .25s ease, width .25s ease' }}>
      <header className={modoOscuro ? 'bg-black text-light shadow-sm' : 'bg-white text-dark shadow-sm'} style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: `3px solid ${primaryColor}` }}><div className="d-flex align-items-center gap-2"><span style={{ fontSize: '21px', color: secondaryColor }}>{pagina.icono}</span><h5 className="mb-0 fw-bold">{pagina.titulo}</h5></div><div className="d-flex align-items-center gap-3">{tenant && <div className="d-none d-md-flex align-items-center gap-2"><span>🏢</span><span className="fw-semibold">{tenant}</span></div>}{tenant && usuarioLogueado && <span className="text-muted d-none d-md-inline">|</span>}{usuarioLogueado && <div className="d-flex align-items-center gap-2"><span style={{ fontSize: '21px' }}>👤</span><div className="d-none d-sm-block text-end"><div className="fw-semibold text-truncate" style={{ maxWidth: '180px' }}>{usuarioLogueado.name}</div>{esSuper && <small className="fw-semibold" style={{ color: primaryColor }}>SUPER</small>}</div></div>}<div className="d-flex align-items-center gap-1" title="Sesión activa"><span style={{ fontSize: '12px' }}>🟢</span><small className="text-muted">Activa</small></div></div></header>
      <section className="p-4"><Outlet /></section>
    </main>
    {botonExportarExcel}
  </div>
}

export default MainLayoutFixed
