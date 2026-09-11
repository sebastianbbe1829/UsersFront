import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { obtenerContextoCaja } from '../services/cashApi'
import { obtenerTenantDesdeUrl } from '../utils/tenant'

export default function CashOperationalGuard({ children }) {
  const { token, manejarSesionExpirada } = useAuth()
  const navigate = useNavigate()
  const [context, setContext] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return undefined

    let cancelled = false

    const load = async () => {
      try {
        const result = await obtenerContextoCaja(token)
        if (!cancelled) setContext(result)
      } catch (error) {
        if (cancelled) return
        if (error.status === 401) {
          manejarSesionExpirada()
          return
        }
        setContext({ operational: false, blocked_reason: 'CASH_CONTEXT_BLOCKED' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [manejarSesionExpirada, token])

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border" role="status" aria-label="Validando caja" />
      </div>
    )
  }

  if (!context?.operational) {
    const message = context?.blocked_reason === 'CASH_DAY_NOT_STARTED'
      ? 'No existe una caja abierta. No es posible realizar ventas ni pagos.'
      : context?.blocked_reason === 'CASH_REGISTER_CLOSED'
        ? 'La caja asignada está cerrada. No es posible realizar ventas ni pagos.'
        : context?.blocked_reason === 'CASH_REGISTER_NOT_STARTED'
          ? 'La caja asignada no tiene una sesión abierta. No es posible realizar ventas ni pagos.'
          : 'La operación de Caja no está habilitada. No es posible realizar ventas ni pagos.'

    const volverWelcome = () => {
      const tenant = obtenerTenantDesdeUrl()
      navigate(tenant ? `/${encodeURIComponent(tenant)}/welcome` : '/welcome')
    }

    return (
      <div className="alert alert-warning shadow-sm" role="alert">
        <div className="fw-bold mb-1">Caja no disponible</div>
        <div>{message}</div>
        <button
          type="button"
          className="btn btn-link text-decoration-none px-0 mt-2"
          onClick={volverWelcome}
        >
          ← Regresar
        </button>
      </div>
    )
  }

  return children
}
