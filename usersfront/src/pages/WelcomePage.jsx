import {
  useEffect,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  useAuth,
} from '../contexts/AuthContext'

import {
  useTenantConfig,
} from '../contexts/TenantConfigContext'

import '../styles/welcome-smart-menu.css'


function ajustarColorParaFondo(hex, fondoOscuro) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return fondoOscuro ? '#F8F9FA' : '#212529'
  }

  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  const luminancia = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

  if (fondoOscuro) {
    if (luminancia >= 0.45) return hex
    return '#E9ECEF'
  }

  if (luminancia <= 0.55) return hex
  return '#343A40'
}

function WelcomePage() {
  const {
    tenant,
    usuarioLogueado,
    token,
  } = useAuth()

  const { config } = useTenantConfig()
  const navigate = useNavigate()

  const [ahora, setAhora] = useState(new Date())
  const [modoOscuro, setModoOscuro] = useState(() => localStorage.getItem('modo_oscuro') === 'true')

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    const sincronizarModo = () => {
      setModoOscuro(localStorage.getItem('modo_oscuro') === 'true')
    }

    window.addEventListener('storage', sincronizarModo)
    window.addEventListener('modo-oscuro-cambiado', sincronizarModo)

    return () => {
      window.removeEventListener('storage', sincronizarModo)
      window.removeEventListener('modo-oscuro-cambiado', sincronizarModo)
    }
  }, [])

  const fecha = ahora.toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const hora = ahora.toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  const primaryColor = config?.primary_color || '#0d6efd'
  const secondaryColor = config?.secondary_color || '#6f42c1'
  const colorPrincipal = modoOscuro ? '#f8f9fa' : '#212529'
  const colorSecundario = ajustarColorParaFondo(secondaryColor, modoOscuro)
  const colorHora = ajustarColorParaFondo(primaryColor, modoOscuro)
  const nombreTenant = config?.name || tenant || 'su empresa'
  const tituloAplicacion = config?.app_title || nombreTenant
  const mostrarNombreTenant = nombreTenant && nombreTenant !== tituloAplicacion

  const permisos = (() => {
    try {
      const payload = token ? JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : null
      return Array.isArray(payload?.permissions) ? payload.permissions : []
    } catch {
      return []
    }
  })()

  let esSuper = false
  try {
    const payload = token ? JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : null
    esSuper = payload?.user_type === 'SUPER'
  } catch {
    esSuper = false
  }

  const accesos = [
    {
      title: 'Puntos de venta',
      description: 'Registra y gestiona tus ventas.',
      icon: '🛒',
      path: 'ventas',
      permission: 'SALES_CREATE',
      accent: '#0d6efd',
    },
    {
      title: 'Pagos',
      description: 'Registra y consulta los pagos.',
      icon: '💳',
      path: 'cartera/pagos',
      permission: 'PORTFOLIO_PAYMENT_CREATE',
      accent: '#198754',
    },
    {
      title: 'Obligaciones',
      description: 'Consulta y administra la cartera.',
      icon: '📋',
      path: 'cartera/obligaciones',
      permission: 'PORTFOLIO_READ',
      accent: '#fd7e14',
    },
    {
      title: 'Clientes',
      description: 'Consulta y gestiona tus clientes.',
      icon: '👥',
      path: 'clientes',
      permission: 'CLIENT_READ',
      accent: '#6f42c1',
    },
  ]

  const accesosVisibles = accesos.filter((acceso) => esSuper || permisos.includes(acceso.permission))

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center text-center px-3"
      style={{ height: '100%', width: '100%', overflow: 'auto', color: colorPrincipal }}
    >
      {config?.logo_url ? (
        <img src={config.logo_url} alt={`Logo de ${nombreTenant}`} className="mb-3" style={{ maxWidth: '180px', maxHeight: '100px', objectFit: 'contain' }} />
      ) : (
        <div className="rounded-circle text-white d-flex align-items-center justify-content-center shadow mb-3" style={{ width: '100px', height: '100px', fontSize: '46px', flexShrink: 0, backgroundColor: primaryColor }}>
          👋
        </div>
      )}

      <h1 className="fw-bold mb-2" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: colorPrincipal }}>
        Bienvenido a {tituloAplicacion}
      </h1>

      {mostrarNombreTenant && (
        <h4 className="mb-3" style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', color: colorSecundario }}>
          {nombreTenant}
        </h4>
      )}

      {usuarioLogueado && (
        <p className="fs-5 mb-2" style={{ color: colorPrincipal }}>
          Hola,
          <strong className="ms-1" style={{ color: colorPrincipal }}>{usuarioLogueado.name}</strong>
        </p>
      )}

      {tenant && (
        <div className="badge border px-3 py-2 mb-3" style={{ fontSize: '14px', backgroundColor: modoOscuro ? '#343a40' : '#f8f9fa', color: modoOscuro ? '#f8f9fa' : '#212529', borderColor: modoOscuro ? '#6c757d' : '#dee2e6' }}>
          Empresa: {tenant}
        </div>
      )}

      <div className="text-capitalize mb-2" style={{ fontSize: '15px', color: colorSecundario }}>📅 {fecha}</div>
      <div className="fw-semibold" style={{ fontSize: 'clamp(1.6rem, 4vw, 2rem)', color: colorHora }}>🕐 {hora}</div>

      {accesosVisibles.length > 0 && (
        <section className="welcome-quick-access" aria-label="Accesos rápidos">
          <div className="welcome-quick-access-title mb-3">Accesos rápidos</div>
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
                <div className="welcome-quick-icon" aria-hidden="true">{acceso.icon}</div>
                <div>
                  <div className="welcome-quick-card-title">{acceso.title}</div>
                  <div className="welcome-quick-card-description">{acceso.description}</div>
                </div>
                <span className="welcome-quick-arrow" aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <p className="mt-3 mb-0" style={{ fontSize: '15px', color: colorSecundario }}>
        {accesosVisibles.length ? 'Selecciona un acceso directo para comenzar.' : 'Selecciona una opción del menú para comenzar.'}
      </p>

      <div className="mt-3 mb-2" style={{ width: '80px', height: '4px', borderRadius: '4px', backgroundColor: secondaryColor }} />
    </div>
  )
}

export default WelcomePage
