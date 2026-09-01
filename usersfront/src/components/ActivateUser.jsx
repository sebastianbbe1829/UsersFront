import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  solicitarOtpActivacion,
  validarOtpActivacion,
} from '../services/activationApi'

const obtenerFechaUTC = (valor) => {
  if (!valor) return null
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(valor)) return new Date(valor)
  return new Date(`${valor}Z`)
}

function ActivateUser() {
  const { tenant, dni, token } = useParams()

  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [validando, setValidando] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [expiresAt, setExpiresAt] = useState(null)
  const [segundosRestantes, setSegundosRestantes] = useState(0)
  const [error, setError] = useState(null)
  const [resultado, setResultado] = useState(null)

  const solicitudInicial = useRef(false)

  const solicitarCodigo = async () => {
    try {
      setEnviando(true)
      setError(null)

      const respuesta = await solicitarOtpActivacion(dni, token)
      setExpiresAt(respuesta.expires_at)
      setCodigo('')
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
      setCargando(false)
    }
  }

  useEffect(() => {
    if (solicitudInicial.current) return
    solicitudInicial.current = true
    solicitarCodigo()
  }, [dni, token])

  useEffect(() => {
    if (!expiresAt) return undefined

    const actualizarContador = () => {
      const fechaExpiracion = obtenerFechaUTC(expiresAt)
      const restante = Math.max(
        Math.ceil((fechaExpiracion.getTime() - Date.now()) / 1000),
        0
      )
      setSegundosRestantes(restante)
    }

    actualizarContador()
    const intervalo = window.setInterval(actualizarContador, 1000)

    return () => window.clearInterval(intervalo)
  }, [expiresAt])

  const manejarCodigo = (event) => {
    const valor = event.target.value.replace(/\D/g, '')
    setCodigo(valor)
  }

  const validarCodigo = async (event) => {
    event.preventDefault()

    if (!codigo.trim()) {
      setError('Ingresa el código de verificación recibido por correo.')
      return
    }

    try {
      setValidando(true)
      setError(null)

      const respuesta = await validarOtpActivacion(
        dni,
        token,
        codigo.trim()
      )

      if (!respuesta.valid) {
        setError(respuesta.message)
        return
      }

      setResultado(respuesta)
    } catch (err) {
      setError(err.message)
    } finally {
      setValidando(false)
    }
  }

  if (cargando) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center bg-light">
        <div className="card shadow border-0 p-5 text-center" style={{ maxWidth: '500px', width: '90%' }}>
          <div className="spinner-border text-primary mb-4" role="status" />
          <h4>Preparando la activación...</h4>
          <p className="text-muted mb-0">
            Estamos enviando un código de verificación a tu correo.
          </p>
        </div>
      </div>
    )
  }

  if (resultado) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center bg-light">
        <div className="card shadow border-0 p-5 text-center" style={{ maxWidth: '550px', width: '90%' }}>
          <div
            className="rounded-circle bg-success-subtle text-success d-flex justify-content-center align-items-center mx-auto mb-4"
            style={{ width: '90px', height: '90px', fontSize: '48px' }}
          >
            ✓
          </div>

          <h2 className="mb-3">¡Cuenta activada!</h2>
          <p className="text-muted">
            {resultado.message || 'Usuario activado correctamente.'}
          </p>

          <Link to={`/${tenant}/login`} className="btn btn-primary mt-4">
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="vh-100 d-flex justify-content-center align-items-center bg-light">
      <div className="card shadow border-0 p-4 p-md-5" style={{ maxWidth: '500px', width: '90%' }}>
        <div className="text-center mb-4">
          <div
            className="rounded-circle bg-primary-subtle text-primary d-flex justify-content-center align-items-center mx-auto mb-4"
            style={{ width: '80px', height: '80px', fontSize: '38px' }}
          >
            ✉
          </div>
          <h2>Verifica tu cuenta</h2>
          <p className="text-muted mb-0">
            Enviamos un código de verificación a tu correo electrónico.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={validarCodigo}>
          <label htmlFor="codigo-activacion" className="form-label fw-semibold">
            Código de verificación
          </label>
          <input
            id="codigo-activacion"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={12}
            value={codigo}
            onChange={manejarCodigo}
            className="form-control form-control-lg text-center"
            placeholder="Ingresa tu código"
            disabled={validando}
            autoFocus
          />

          <button
            type="submit"
            className="btn btn-primary btn-lg w-100 mt-4"
            disabled={validando || enviando || !codigo.trim()}
          >
            {validando ? 'Verificando...' : 'Activar mi cuenta'}
          </button>
        </form>

        <div className="text-center mt-4">
          {segundosRestantes > 0 ? (
            <p className="text-muted mb-2">
              El código vence en <strong>{segundosRestantes}s</strong>.
            </p>
          ) : (
            <p className="text-danger mb-2">
              El código ha expirado.
            </p>
          )}

          <button
            type="button"
            className="btn btn-link"
            onClick={solicitarCodigo}
            disabled={enviando || validando}
          >
            {enviando ? 'Enviando...' : 'Enviar un nuevo código'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ActivateUser
