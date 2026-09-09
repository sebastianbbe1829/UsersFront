import { useAuth } from '../contexts/AuthContext'
import { useTenantConfig } from '../contexts/TenantConfigContext'
import { useNavigate } from 'react-router-dom'
import '../styles/welcome-smart-menu.css'

function ajustarColorParaFondo(hex, fondoOscuro) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return fondoOscuro ? '#F8F9FA' : '#212529'
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
  const luminancia = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  if (fondoOscuro) return luminancia >= 0.45 ? hex : '#E9ECEF'
  return luminancia <= 0.55 ? hex : '#343A40'
}

function WelcomePage() {
  const { tenant, token } = useAuth()
  const { config } = useTenantConfig()
  const navigate = useNavigate()
  const modoOscuro = localStorage.getItem('modo_oscuro') === 'true'

  const primaryColor = config?.primary_color || '#0d6efd'
  const secondaryColor = config?.secondary_color || '#6f42c1'
  const colorPrincipal = modoOscuro ? '#f8f9fa' : '#212529'
  const colorSecundario = ajustarColorParaFondo(secondaryColor, modoOscuro)
  const permisos = (() => {
    try {
      const payload = token ? JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : null
      return { permissions: Array.isArray(payload?.permissions) ? payload.permissions : [], esSuper: payload?.user_type === 'SUPER' }
    } catch {
      return { permissions: [], esSuper: false }
    }
  })()

  const accesos = [
    { title: 'Puntos de venta', description: 'Registra y gestiona tus ventas.', icon: '🛒', path: 'ventas', permission: 'SALES_CREATE', accent: primaryColor },
    { title: 'Pagos', description: 'Registra y consulta los pagos.', icon: '💳', path: 'cartera/pagos', permission: 'PORTFOLIO_PAYMENT_CREATE', accent: '#198754' },
    { title: 'Obligaciones', description: 'Consulta y administra la cartera.', icon: '📋', path: 'cartera/obligaciones', permission: 'PORTFOLIO_READ', accent: '#fd7e14' },
    { title: 'Clientes', description: 'Consulta y gestiona tus clientes.', icon: '👥', path: 'clientes', permission: 'CLIENT_READ', accent: '#6f42c1' },
    { title: 'Inventarios', description: 'Controla existencias y movimientos.', icon: '📦', path: 'inventarios', permission: 'INVENTORY_READ', accent: '#20c997' },
    { title: 'Extintores', description: 'Gestiona inventario y revisiones.', icon: '🧯', path: 'extintores', permission: 'EXTINGUISHER_READ', accent: '#dc3545' },
    { title: 'Administración', description: 'Usuarios, roles y permisos.', icon: '⚙️', path: 'usuarios', permission: 'USER_READ', accent: '#6c757d' },
    { title: 'Consulta de ventas', description: 'Consulta ventas registradas.', icon: '📊', path: 'ventas/consulta', permission: 'SALES_READ', accent: '#6610f2' },
  ]
  const accesosVisibles = accesos.filter((acceso) => permisos.esSuper || permisos.permissions.includes(acceso.permission))

  return (
    <div className={`welcome-page ${modoOscuro ? 'welcome-page-dark' : ''}`} style={{ color: colorPrincipal }}>
      {accesosVisibles.length > 0 && (
        <section className="welcome-quick-access" aria-label="Accesos rápidos">
          <div className="welcome-quick-access-heading"><span>Accesos rápidos</span></div>
          <div className="welcome-quick-grid">
            {accesosVisibles.map((acceso) => (
              <button
                key={acceso.path}
                type="button"
                className="welcome-quick-card"
                style={{ '--welcome-card-accent': acceso.accent }}
                onClick={() => navigate(`/${tenant}/${acceso.path}`)}
                aria-label={`Abrir ${acceso.title}`}
              >
                <div className="welcome-quick-card-top">
                  <div className="welcome-quick-icon" aria-hidden="true">{acceso.icon}</div>
                  <span className="welcome-quick-arrow" aria-hidden="true">→</span>
                </div>
                <div>
                  <div className="welcome-quick-card-title">{acceso.title}</div>
                  <div className="welcome-quick-card-description">{acceso.description}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
      <p className="welcome-footer" style={{ color: colorSecundario }}>
        {accesosVisibles.length ? 'Selecciona un acceso directo para comenzar.' : 'Selecciona una opción del menú para comenzar.'}
      </p>
      <div className="welcome-accent-line" style={{ backgroundColor: secondaryColor }} />
    </div>
  )
}

export default WelcomePage
