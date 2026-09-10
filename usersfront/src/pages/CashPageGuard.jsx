import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { obtenerContextoCaja } from '../services/cashApi'
import CashPage from './CashPage'

export default function CashPageGuard() {
  const { token } = useAuth()
  const [state, setState] = useState({ loading: true, context: null, error: '' })

  useEffect(() => {
    let active = true
    obtenerContextoCaja(token)
      .then((context) => {
        if (active) setState({ loading: false, context, error: '' })
      })
      .catch((error) => {
        if (active) setState({ loading: false, context: null, error: error.message || 'No fue posible validar el contexto de caja.' })
      })
    return () => { active = false }
  }, [token])

  if (state.loading) {
    return <section className="container-fluid py-4"><div className="text-center py-5"><div className="spinner-border text-primary" /><div className="mt-3 text-muted">Validando sucursal y caja...</div></div></section>
  }

  if (state.error) {
    return <section className="container-fluid py-4"><div className="alert alert-danger"><strong>No fue posible validar tu caja.</strong><div className="mt-1">{state.error}</div></div></section>
  }

  const context = state.context

  if (!context?.assigned) {
    return <section className="container-fluid py-4"><div className="alert alert-warning shadow-sm"><h5 className="alert-heading">⚠️ Caja no asignada</h5><p className="mb-0">Tu usuario tiene permiso para consultar Caja, pero no está asignado a ninguna sucursal y caja. Contacta al administrador para poder operar.</p></div></section>
  }

  if (context.cash_box_status !== 'ACTIVE') {
    return <section className="container-fluid py-4"><div className="alert alert-danger shadow-sm"><h5 className="alert-heading">⚠️ Caja inactiva</h5><p className="mb-1">Tu caja asignada no está activa.</p><strong>{context.branch_name} · {context.cash_box_name}</strong></div></section>
  }

  return <CashPage />
}
