import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useTenantConfig } from '../contexts/TenantConfigContext'
import {
  solicitarRecuperacionPassword,
  restablecerPassword,
} from '../services/passwordRecoveryApi'

const obtenerFechaUTC = (valor) => {
  if (!valor) return null
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(valor)) return new Date(valor)
  return new Date(`${valor}Z`)
}

function PasswordRecoveryPage() {
  const { tenant } = useParams()
  const navigate = useNavigate()
  const { config } = useTenantConfig()

  const [paso, setPaso] = useState(1)
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [expiresAt, setExpiresAt] = useState(null)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const [segundosRestantes, setSegundosRestantes] = useState(0)

  const primaryColor = config?.primary_color || '#0d6efd'
  const secondaryColor = config?.secondary_color || '#6f42c1'
  const appTitle = config?.app_title || 'Fenix SaS'

  useEffect(() => {
    if (!expiresAt) return undefined

    const actualizarContador = () => {
      const fecha = obtenerFechaUTC(expiresAt)
      const segundos = fecha
        ? Math.max(Math.ceil((fecha.getTime() - Date.now()) / 1000), 0)
        : 0
      setSegundosRestantes(segundos)
    }

    actualizarContador()
    const intervalo = window.setInterval(actualizarContador, 1000)
    return () => window.clearInterval(intervalo)
  }, [expiresAt])

  const solicitarCodigo = async (event) => {
    event.preventDefault()
    setError('')
    setMensaje('')

    if (!email.trim()) {
      setError('Ingresa tu correo electrónico.')
      return
    }

    setCargando(true)
    try {
      const resultado = await solicitarRecuperacionPassword(tenant, email.trim())
      setExpiresAt(resultado?.expires_at || null)
      setPaso(2)
      setMensaje('Si el correo pertenece a un usuario activo, recibirás un código de recuperación.')
    } catch (err) {
      setError(err?.message || 'No fue posible solicitar la recuperación.')
    } finally {
      setCargando(false)
    }
  }

  const restablecer = async (event) => {
    event.preventDefault()
    setError('')
    setMensaje('')

    if (!/^\d{6}$/.test(codigo.trim())) {
      setError('El código debe tener 6 dígitos.')
      return
    }

    if (segundosRestantes <= 0) {
      setError('El código ha expirado. Solicita uno nuevo.')
      return
    }

    if (nuevaPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)
    try {
      await restablecerPassword(
        tenant,
        email.trim(),
        codigo.trim(),
        nuevaPassword
      )
      setPaso(3)
      setMensaje('Tu contraseña fue actualizada correctamente.')
    } catch (err) {
      setError(err?.message || 'No fue posible actualizar la contraseña.')
    } finally {
      setCargando(false)
    }
  }

  const reenviarCodigo = async () => {
    setError('')
    setMensaje('')
    setCargando(true)

    try {
      const resultado = await solicitarRecuperacionPassword(tenant, email.trim())
      setCodigo('')
      setExpiresAt(resultado?.expires_at || null)
      setMensaje('Hemos generado un nuevo código de recuperación.')
    } catch (err) {
      setError(err?.message || 'No fue posible reenviar el código.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
    >
      <div className="card shadow-lg border-0" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
              style={{ width: '54px', height: '54px', backgroundColor: primaryColor }}
            >
              {config?.logo_url ? (
                <img
                  src={config.logo_url}
                  alt="Logo"
                  style={{ maxHeight: '38px', maxWidth: '42px', objectFit: 'contain' }}
                  onError={(event) => { event.currentTarget.style.display = 'none' }}
                />
              ) : (
                <span style={{ fontSize: '25px' }}>🔐</span>
              )}
            </div>
            <h3 className="fw-bold mb-1">{appTitle}</h3>
            <p className="text-muted mb-2">Recuperar contraseña</p>
            <div
              className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill border"
              style={{ backgroundColor: `${secondaryColor}18`, borderColor: `${secondaryColor}55` }}
            >
              <span>🏢</span>
              <span className="fw-semibold">{tenant}</span>
            </div>
          </div>

          {paso === 1 && (
            <form onSubmit={solicitarCodigo}>
              <p className="text-muted">Ingresa tu correo y te enviaremos un código para recuperar tu contraseña.</p>
              <div className="mb-3">
                <label className="form-label fw-semibold">Correo electrónico</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={cargando}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {error && <div className="alert alert-danger py-2">❌ {error}</div>}
              <button type="submit" className="btn w-100 text-white mb-2" style={{ backgroundColor: primaryColor }} disabled={cargando}>
                {cargando ? 'Enviando...' : 'Enviar código'}
              </button>
              <button type="button" className="btn btn-link w-100" onClick={() => navigate(`/${tenant}/login`)} disabled={cargando}>
                Volver al inicio de sesión
              </button>
            </form>
          )}

          {paso === 2 && (
            <form onSubmit={restablecer}>
              <div className="alert alert-info py-2">Código enviado a <strong>{email}</strong>.</div>
              {mensaje && <div className="alert alert-success py-2">{mensaje}</div>}
              <div className="mb-3">
                <label className="form-label fw-semibold">Código de recuperación</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="form-control text-center fw-bold"
                  placeholder="000000"
                  value={codigo}
                  onChange={(event) => setCodigo(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={cargando}
                  autoComplete="one-time-code"
                  autoFocus
                />
                <small className="text-muted d-block text-center mt-2">
                  {segundosRestantes > 0
                    ? `El código vence en ${Math.floor(segundosRestantes / 60)}:${String(segundosRestantes % 60).padStart(2, '0')}`
                    : 'El código ha expirado.'}
                </small>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Nueva contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Mínimo 6 caracteres"
                  value={nuevaPassword}
                  onChange={(event) => setNuevaPassword(event.target.value)}
                  disabled={cargando}
                  autoComplete="new-password"
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Confirmar contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Repite la contraseña"
                  value={confirmarPassword}
                  onChange={(event) => setConfirmarPassword(event.target.value)}
                  disabled={cargando}
                  autoComplete="new-password"
                />
              </div>
              {error && <div className="alert alert-danger py-2">❌ {error}</div>}
              <button type="submit" className="btn w-100 text-white mb-2" style={{ backgroundColor: primaryColor }} disabled={cargando || segundosRestantes <= 0}>
                {cargando ? 'Actualizando...' : 'Cambiar contraseña'}
              </button>
              <button type="button" className="btn btn-outline-secondary w-100 mb-2" onClick={reenviarCodigo} disabled={cargando}>
                Reenviar código
              </button>
              <button type="button" className="btn btn-link w-100" onClick={() => navigate(`/${tenant}/login`)} disabled={cargando}>
                Cancelar
              </button>
            </form>
          )}

          {paso === 3 && (
            <div className="text-center">
              <div className="display-5 mb-3">✅</div>
              <div className="alert alert-success py-2">{mensaje}</div>
              <button type="button" className="btn w-100 text-white" style={{ backgroundColor: primaryColor }} onClick={() => navigate(`/${tenant}/login`, { replace: true })}>
                Ir al inicio de sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PasswordRecoveryPage
