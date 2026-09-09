import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTenantConfig } from '../contexts/TenantConfigContext'
import '../styles/welcome-smart-menu.css'

function ajustarColorParaFondo(hex, fondoOscuro) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return fondoOscuro ? '#F8F9FA' : '#212529'
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
  const luminancia = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  if (fondoOscuro) return luminancia >= 0.45 ? hex : '#E9ECEF'
  return luminancia <= 0.55 ? hex : '#343A40'
}

function WelcomePage() {
  const { tenant, usuarioLogueado, token, cerrarSesion } = useAuth()
  const { config } = useTenantConfig()
  const navigate = useNavigate()
  const [ahora, setAhora] = useState(new Date())
  const [modoOscuro, setModoOscuro] = useState(() => localStorage.getItem('modo_oscuro') === 'true')

  useEffect(() => { const intervalo = setInterval(() => setAhora(new Date()), 1000); return () => clearInterval(intervalo) }, [])
  useEffect(() => {
    const sincronizarModo = () => setModoOscuro(localStorage.getItem('modo_oscuro') === 'true')
    window.addEventListener('storage', sincronizarModo); window.addEventListener('modo-oscuro-cambiado', sincronizarModo)
    return () => { window.removeEventListener('storage', sincronizarModo); window.removeEventListener('modo-oscuro-cambiado', sincronizarModo) }
  }, [])

  const fecha = ahora.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const hora = ahora.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const primaryColor = config?.primary_color || '#0d6efd'
  const secondaryColor = config?.secondary_color || '#6f42c1'
  const colorPrincipal = modoOscuro ? '#f8f9fa' : '#212529'
  const colorSecundario = ajustarColorParaFondo(secondaryColor, modoOscuro)
  const nombreTenant = config?.name || tenant || 'su empresa'

  const payload = (() => { try { return token ? JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : null } catch { return null } })()
  const permisos = Array.isArray(payload?.permissions) ? payload.permissions : []
  const esSuper = payload?.user_type === 'SUPER'
  const accesos = [
    { title: 'Puntos de venta', description: 'Registra y gestiona tus ventas.', icon: '🛒', path: 'ventas', permission: 'SALES_CREATE', accent: '#0d6efd' },
    { title: 'Pagos', description: 'Registra y consulta los pagos.', icon: '💳', path: 'cartera/pagos', permission: 'PORTFOLIO_PAYMENT_CREATE', accent: '#198754' },
    { title: 'Obligaciones', description: 'Consulta y administra la cartera.', icon: '📋', path: 'cartera/obligaciones', permission: 'PORTFOLIO_READ', accent: '#fd7e14' },
    { title: 'Clientes', description: 'Consulta y gestiona tus clientes.', icon: '👥', path: 'clientes', permission: 'CLIENT_READ', accent: '#6f42c1' },
    { title: 'Inventarios', description: 'Controla existencias y movimientos.', icon: '📦', path: 'inventarios', permission: 'INVENTORY_READ', accent: '#20c997' },
    { title: 'Extintores', description: 'Gestiona inventario y revisiones.', icon: '🧯', path: 'extintores', permission: 'EXTINGUISHER_READ', accent: '#dc3545' },
    { title: 'Administración', description: 'Usuarios, roles y permisos.', icon: '⚙️', path: 'usuarios', permission: 'USER_READ', accent: '#6c757d' },
    { title: 'Consulta de ventas', description: 'Consulta ventas registradas.', icon: '📊', path: 'ventas/consulta', permission: 'SALES_READ', accent: '#6610f2' },
  ]
  const accesosVisibles = accesos.filter((acceso) => esSuper || permisos.includes(acceso.permission))
  const manejarCerrarSesion = () => { cerrarSesion(); navigate(tenant ? `/${tenant}/login` : '/login', { replace: true }) }

  return (
    <div className={`welcome-page ${modoOscuro ? 'welcome-page-dark' : ''}`} style={{ color: colorPrincipal }}>
      <header className="welcome-header">
        <div className="welcome-compact-header">
          <div className="welcome-compact-title"><span className="welcome-home-icon">🏠</span><span>Panel de administración</span></div>
          <div className="welcome-user-block"><strong>{usuarioLogueado?.name || 'Usuario'}</strong><span>👤 {usuarioLogueado?.dni ? `Número de identificación: ${usuarioLogueado.dni}` : 'Sesión activa'}</span></div>
        </div>
        <div className="welcome-compact-meta">
          <span>🏢 {nombreTenant} · Empresa activa</span><span className="welcome-meta-separator">|</span><span>🟢 Activa</span><span className="welcome-meta-separator">|</span><span>🕘 {hora}</span><span className="welcome-meta-separator">|</span><span>📅 {fecha}</span>
          <button type="button" className="welcome-logout-placeholder" onClick={manejarCerrarSesion}>Cerrar Sesión</button>
        </div>
      </header>
      {accesosVisibles.length > 0 && <section className="welcome-quick-access" aria-label="Accesos rápidos"><div className="welcome-quick-access-heading"><span>Accesos rápidos</span></div><div className="welcome-quick-grid">{accesosVisibles.map((acceso) => <button key={acceso.path} type="button" className="welcome-quick-card" style={{ '--welcome-card-accent': acceso.accent }} onClick={() => navigate(`/${tenant}/${acceso.path}`)} aria-label={`Abrir ${acceso.title}`}><div className="welcome-quick-card-top"><div className="welcome-quick-icon" aria-hidden="true">{acceso.icon}</div><span className="welcome-quick-arrow" aria-hidden="true">→</span></div><div><div className="welcome-quick-card-title">{acceso.title}</div><div className="welcome-quick-card-description">{acceso.description}</div></div></button>)}</div></section>}
      <p className="welcome-footer" style={{ color: colorSecundario }}>{accesosVisibles.length ? 'Selecciona un acceso directo para comenzar.' : 'Selecciona una opción del menú para comenzar.'}</p><div className="welcome-accent-line" style={{ backgroundColor: secondaryColor }} />
    </div>
  )
}
export default WelcomePage
