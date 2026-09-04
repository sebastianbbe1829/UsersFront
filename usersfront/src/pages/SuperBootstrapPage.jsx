import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

import { verificarBootstrapMfa } from '../services/api'

const API_URL = import.meta.env.VITE_API_URL

const bootstrapPrimerSuper = async (datos, bootstrapSecret) => {
  const response = await fetch(`${API_URL}/auth/super/bootstrap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Super-Bootstrap-Secret': bootstrapSecret,
    },
    body: JSON.stringify(datos),
  })

  const resultado = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(resultado?.detail || 'No fue posible crear el primer usuario SUPER.')
  }

  return resultado
}

function SuperBootstrapPage() {
  const navigate = useNavigate()

  const [paso, setPaso] = useState('datos')
  const [dni, setDni] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [bootstrapSecret, setBootstrapSecret] = useState('')
  const [userId, setUserId] = useState(null)
  const [provisioningUri, setProvisioningUri] = useState('')
  const [otp, setOtp] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const limpiarMensajes = () => {
    setMensaje('')
    setError('')
  }

  const manejarBootstrap = async (event) => {
    event.preventDefault()
    limpiarMensajes()

    if (password !== confirmPassword) {
      setError('La contraseña y su confirmación no coinciden.')
      return
    }

    setCargando(true)

    try {
      const resultado = await bootstrapPrimerSuper(
        {
          dni: dni.trim(),
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
        },
        bootstrapSecret
      )

      setUserId(resultado.id)
      setProvisioningUri(resultado.provisioning_uri)
      setPaso('mfa')
      setMensaje(
        'Usuario SUPER creado. Escanea el código QR con tu aplicación autenticadora.'
      )
    } catch (errorApi) {
      setError(errorApi.message)
    } finally {
      setCargando(false)
    }
  }

  const manejarVerificacionMfa = async (event) => {
    event.preventDefault()
    limpiarMensajes()
    setCargando(true)

    try {
      await verificarBootstrapMfa(userId, otp, bootstrapSecret)

      setPaso('completado')
      setMensaje('MFA verificado correctamente. El usuario SUPER está listo.')
    } catch (errorApi) {
      setError(errorApi.message)
    } finally {
      setCargando(false)
    }
  }

  const irACrearTenant = () => {
    navigate('/bootstrap/tenant', {
      replace: true,
    })
  }

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-4">
      <div className="card shadow border-0" style={{ width: '100%', maxWidth: '720px' }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="fs-1 mb-2">🛡️</div>
            <h2 className="fw-bold mb-1">Configuración inicial SUPER</h2>
            <p className="text-muted mb-0">
              Pantalla técnica para crear y configurar el primer usuario global SUPER.
            </p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {mensaje && (
            <div className="alert alert-info" role="alert">
              {mensaje}
            </div>
          )}

          {paso === 'datos' && (
            <form onSubmit={manejarBootstrap}>
              <div className="alert alert-warning">
                <strong>Uso técnico y único.</strong><br />
                Esta operación crea únicamente el primer usuario SUPER global del sistema.
                No requiere que exista ningún tenant. Una vez creado, los demás usuarios SUPER
                deben administrarse desde el módulo <strong>Usuarios SUPER</strong>.
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">DNI</label>
                  <input
                    type="text"
                    className="form-control"
                    value={dni}
                    onChange={(event) => setDni(event.target.value)}
                    maxLength={20}
                    required
                    autoComplete="off"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Nombre completo</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={100}
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Teléfono</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    maxLength={30}
                    required
                    autoComplete="tel"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Correo electrónico</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={12}
                    maxLength={128}
                    required
                    autoComplete="new-password"
                  />
                  <div className="form-text">Mínimo 12 caracteres.</div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Confirmar contraseña</label>
                  <input
                    type="password"
                    className={`form-control ${confirmPassword && password !== confirmPassword ? 'is-invalid' : ''}`}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={12}
                    maxLength={128}
                    required
                    autoComplete="new-password"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <div className="invalid-feedback">Las contraseñas no coinciden.</div>
                  )}
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">X-Super-Bootstrap-Secret</label>
                  <input
                    type="password"
                    className="form-control"
                    value={bootstrapSecret}
                    onChange={(event) => setBootstrapSecret(event.target.value)}
                    required
                    autoComplete="off"
                  />
                  <div className="form-text">
                    Se envía únicamente en las operaciones de bootstrap.
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 mt-4"
                disabled={cargando || password !== confirmPassword}
              >
                {cargando ? 'Creando usuario SUPER...' : 'Crear primer usuario SUPER'}
              </button>
            </form>
          )}

          {paso === 'mfa' && (
            <div>
              <div className="text-center mb-4">
                <h5 className="fw-bold">1. Escanea el código QR</h5>
                <div className="bg-white border rounded p-3 d-inline-block mt-2">
                  <QRCodeSVG
                    value={provisioningUri}
                    size={280}
                    level="M"
                  />
                </div>
              </div>

              <div className="alert alert-secondary">
                <strong>2. Verifica el MFA</strong><br />
                Abre tu aplicación autenticadora, obtén el código de 6 dígitos e ingrésalo abajo.
              </div>

              <form onSubmit={manejarVerificacionMfa}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Código MFA</label>
                  <input
                    type="text"
                    className="form-control form-control-lg text-center"
                    value={otp}
                    onChange={(event) => {
                      const valor = event.target.value.replace(/\D/g, '').slice(0, 6)
                      setOtp(valor)
                    }}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100"
                  disabled={cargando || otp.length !== 6}
                >
                  {cargando ? 'Verificando MFA...' : 'Verificar MFA'}
                </button>
              </form>

              <div className="text-center mt-3">
                <small className="text-muted">
                  Usuario SUPER #{userId}
                </small>
              </div>
            </div>
          )}

          {paso === 'completado' && (
            <div className="text-center">
              <div className="display-4 mb-3">🟢</div>
              <h4 className="fw-bold">Configuración completada</h4>
              <p className="text-muted">
                El primer usuario SUPER ya tiene su MFA verificado y puede utilizarse
                para administrar los tenants y los demás usuarios SUPER del sistema.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={irACrearTenant}
              >
                Continuar con creación de tenant
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


export default SuperBootstrapPage
