import {
  useEffect,
  useState,
} from 'react'

import {
  useAuth,
} from '../contexts/AuthContext'

import {
  useTenantConfig,
} from '../contexts/TenantConfigContext'


function ajustarColorParaFondo(hex, fondoOscuro) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return fondoOscuro ? '#F8F9FA' : '#212529'
  }

  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  const luminancia = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

  if (fondoOscuro) {
    if (luminancia >= 0.45) {
      return hex
    }

    return '#E9ECEF'
  }

  if (luminancia <= 0.55) {
    return hex
  }

  return '#343A40'
}


function WelcomePage() {

  const {
    tenant,
    usuarioLogueado,
  } = useAuth()

  const { config } = useTenantConfig()

  const [ahora, setAhora] = useState(new Date())
  const [modoOscuro, setModoOscuro] = useState(() => localStorage.getItem('modo_oscuro') === 'true')

  useEffect(() => {
    const intervalo = setInterval(() => {
      setAhora(new Date())
    }, 1000)

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
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const hora = ahora.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const primaryColor = config?.primary_color || '#0d6efd'
  const secondaryColor = config?.secondary_color || '#6f42c1'

  const colorPrincipal = modoOscuro ? '#f8f9fa' : '#212529'
  const colorSecundario = ajustarColorParaFondo(secondaryColor, modoOscuro)
  const colorHora = ajustarColorParaFondo(primaryColor, modoOscuro)

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center text-center px-3"
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        color: colorPrincipal,
      }}
    >

      <div
        className="rounded-circle text-white d-flex align-items-center justify-content-center shadow mb-3"
        style={{
          width: '100px',
          height: '100px',
          fontSize: '46px',
          flexShrink: 0,
          backgroundColor: primaryColor,
        }}
      >
        👋
      </div>

      <h1
        className="fw-bold mb-2"
        style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
          color: colorPrincipal,
        }}
      >
        Bienvenido a su sistema
      </h1>

      <h4
        className="mb-3"
        style={{
          fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
          color: colorSecundario,
        }}
      >
        Fénix SaS
      </h4>

      {usuarioLogueado && (
        <p
          className="fs-5 mb-2"
          style={{ color: colorPrincipal }}
        >
          Hola,
          <strong className="ms-1" style={{ color: colorPrincipal }}>
            {usuarioLogueado.name}
          </strong>
        </p>
      )}

      {tenant && (
        <div
          className="badge border px-3 py-2 mb-3"
          style={{
            fontSize: '14px',
            backgroundColor: modoOscuro ? '#343a40' : '#f8f9fa',
            color: modoOscuro ? '#f8f9fa' : '#212529',
            borderColor: modoOscuro ? '#6c757d' : '#dee2e6',
          }}
        >
          Empresa: {tenant}
        </div>
      )}

      <div
        className="text-capitalize mb-2"
        style={{
          fontSize: '15px',
          color: colorSecundario,
        }}
      >
        📅 {fecha}
      </div>

      <div
        className="fw-semibold"
        style={{
          fontSize: 'clamp(1.6rem, 4vw, 2rem)',
          color: colorHora,
        }}
      >
        🕐 {hora}
      </div>

      <p
        className="mt-3 mb-0"
        style={{
          fontSize: '15px',
          color: colorSecundario,
        }}
      >
        Seleccione una opción del menú
        para comenzar.
      </p>

      <div
        className="mt-3"
        style={{
          width: '80px',
          height: '4px',
          borderRadius: '4px',
          backgroundColor: secondaryColor,
        }}
      />

    </div>
  )
}


export default WelcomePage
