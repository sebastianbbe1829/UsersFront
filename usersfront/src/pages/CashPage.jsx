import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  abrirCaja,
  cerrarCaja,
  obtenerCajaActual,
  obtenerCajas,
  obtenerResumenCaja,
  registrarMovimientoCaja,
} from '../services/cashApi'

const money = (value) => Number(value || 0).toLocaleString('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const emptySummary = {
  sales_cash: 0,
  sales_transfer: 0,
  sales_card: 0,
  sales_credit: 0,
  portfolio_cash: 0,
  manual_income: 0,
  manual_expense: 0,
  expected_cash: 0,
  counted_cash: null,
  difference: null,
}

export default function CashPage() {
  const { token } = useAuth()
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [summary, setSummary] = useState(emptySummary)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [openingAmount, setOpeningAmount] = useState('0')
  const [movementType, setMovementType] = useState('INCOME')
  const [movementAmount, setMovementAmount] = useState('')
  const [movementDescription, setMovementDescription] = useState('')
  const [countedCash, setCountedCash] = useState('')
  const [closingNotes, setClosingNotes] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [register, registers] = await Promise.all([
        obtenerCajaActual(token),
        obtenerCajas(token),
      ])
      setCurrent(register)
      setHistory(Array.isArray(registers) ? registers : registers?.items || [])
      if (register) {
        setSummary(await obtenerResumenCaja(register.id, token))
      } else {
        setSummary(emptySummary)
      }
    } catch (err) {
      setError(err.message || 'No fue posible cargar Caja.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      load()
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [load])

  const run = async (operation, successMessage) => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await operation()
      setMessage(successMessage)
      await load()
    } catch (err) {
      setError(err.message || 'No fue posible completar la operación.')
    } finally {
      setSaving(false)
    }
  }

  const open = () => run(
    () => abrirCaja(Number(openingAmount || 0), token),
    'Caja abierta correctamente.',
  )

  const movement = () => {
    if (!current) return
    if (!movementAmount || Number(movementAmount) <= 0) {
      setError('El valor del movimiento debe ser mayor que cero.')
      return
    }
    return run(
      () => registrarMovimientoCaja(current.id, {
        movement_type: movementType,
        amount: Number(movementAmount),
        description: movementDescription.trim() || null,
      }, token),
      movementType === 'INCOME' ? 'Ingreso registrado.' : 'Egreso registrado.',
    ).then(() => {
      setMovementAmount('')
      setMovementDescription('')
    })
  }

  const close = () => {
    if (!current) return
    if (countedCash === '' || Number(countedCash) < 0) {
      setError('Indica el efectivo contado para cerrar la caja.')
      return
    }
    return run(
      () => cerrarCaja(current.id, {
        counted_cash: Number(countedCash),
        closing_notes: closingNotes.trim() || null,
      }, token),
      'Caja cerrada correctamente.',
    ).then(() => {
      setCountedCash('')
      setClosingNotes('')
    })
  }

  if (loading) {
    return <section className="container-fluid py-4 cash-page"><div className="text-center py-5"><div className="spinner-border text-primary" /><div className="mt-3 text-muted">Cargando Caja...</div></div></section>
  }

  return (
    <section className="container-fluid py-3 cash-page">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h2 className="mb-1">Caja</h2>
          <div className="text-muted">Apertura, movimientos, consulta y cierre de caja.</div>
        </div>
        {current && <span className="badge text-bg-success px-3 py-2">Caja abierta #{current.id}</span>}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {!current ? (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body p-4">
            <h5 className="mb-1">Abrir caja</h5>
            <p className="text-muted">Define el efectivo inicial disponible.</p>
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-4">
                <label className="form-label">Efectivo inicial</label>
                <input className="form-control" type="number" min="0" step="1" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} />
              </div>
              <div className="col-12 col-md-auto">
                <button className="btn btn-primary" disabled={saving} onClick={open}>{saving ? 'Abriendo...' : 'Abrir caja'}</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3"><div className="card shadow-sm border-0 h-100"><div className="card-body"><div className="text-muted small">Saldo inicial</div><div className="fs-4 fw-semibold">{money(current.opening_amount)}</div></div></div></div>
            <div className="col-12 col-sm-6 col-xl-3"><div className="card shadow-sm border-0 h-100"><div className="card-body"><div className="text-muted small">Ventas efectivo</div><div className="fs-4 fw-semibold">{money(summary.sales_cash)}</div></div></div></div>
            <div className="col-12 col-sm-6 col-xl-3"><div className="card shadow-sm border-0 h-100"><div className="card-body"><div className="text-muted small">Cartera efectivo</div><div className="fs-4 fw-semibold">{money(summary.portfolio_cash)}</div></div></div></div>
            <div className="col-12 col-sm-6 col-xl-3"><div className="card shadow-sm border-0 h-100"><div className="card-body"><div className="text-muted small">Efectivo esperado</div><div className="fs-4 fw-bold">{money(summary.expected_cash)}</div></div></div></div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <h5>Resumen de medios de pago</h5>
                  <div className="table-responsive"><table className="table align-middle mb-0"><tbody>
                    <tr><td>Efectivo</td><td className="text-end">{money(summary.sales_cash)}</td></tr>
                    <tr><td>Tarjeta</td><td className="text-end">{money(summary.sales_card)}</td></tr>
                    <tr><td>Transferencia</td><td className="text-end">{money(summary.sales_transfer)}</td></tr>
                    <tr><td>Crédito</td><td className="text-end">{money(summary.sales_credit)}</td></tr>
                  </tbody></table></div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <h5>Ingresos y egresos manuales</h5>
                  <div className="d-flex justify-content-between py-2"><span>Ingresos</span><strong>{money(summary.manual_income)}</strong></div>
                  <div className="d-flex justify-content-between py-2"><span>Egresos</span><strong>{money(summary.manual_expense)}</strong></div>
                  <div className="d-flex justify-content-between py-2 border-top mt-2"><span>Efectivo esperado</span><strong>{money(summary.expected_cash)}</strong></div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm border-0 h-100"><div className="card-body">
                <h5>Registrar movimiento manual</h5>
                <div className="row g-3">
                  <div className="col-12 col-sm-4"><label className="form-label">Tipo</label><select className="form-select" value={movementType} onChange={(e) => setMovementType(e.target.value)}><option value="INCOME">Ingreso</option><option value="EXPENSE">Egreso</option></select></div>
                  <div className="col-12 col-sm-8"><label className="form-label">Valor</label><input className="form-control" type="number" min="0.01" step="1" value={movementAmount} onChange={(e) => setMovementAmount(e.target.value)} /></div>
                  <div className="col-12"><label className="form-label">Descripción</label><input className="form-control" maxLength="500" value={movementDescription} onChange={(e) => setMovementDescription(e.target.value)} /></div>
                  <div className="col-12"><button className="btn btn-outline-primary" disabled={saving} onClick={movement}>{saving ? 'Registrando...' : 'Registrar movimiento'}</button></div>
                </div>
              </div></div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm border-0 h-100"><div className="card-body">
                <h5>Cierre y arqueo</h5>
                <div className="mb-3"><label className="form-label">Efectivo contado</label><input className="form-control" type="number" min="0" step="1" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} /></div>
                <div className="mb-3"><label className="form-label">Notas de cierre</label><textarea className="form-control" rows="2" maxLength="500" value={closingNotes} onChange={(e) => setClosingNotes(e.target.value)} /></div>
                <div className="d-flex justify-content-between mb-3"><span>Diferencia estimada</span><strong>{countedCash === '' ? '—' : money(Number(countedCash) - Number(summary.expected_cash || 0))}</strong></div>
                <button className="btn btn-danger" disabled={saving} onClick={close}>{saving ? 'Cerrando...' : 'Cerrar caja'}</button>
              </div></div>
            </div>
          </div>
        </>
      )}

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <h5>Historial de cajas</h5>
          <div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>ID</th><th>Estado</th><th>Apertura</th><th>Cierre</th><th className="text-end">Esperado</th><th className="text-end">Contado</th><th className="text-end">Diferencia</th></tr></thead><tbody>
            {history.length === 0 ? <tr><td colSpan="7" className="text-center text-muted py-4">No hay cajas registradas.</td></tr> : history.map((register) => <tr key={register.id}><td>#{register.id}</td><td><span className={`badge ${register.status === 'OPEN' ? 'text-bg-success' : 'text-bg-secondary'}`}>{register.status}</span></td><td>{register.opened_at ? new Date(register.opened_at).toLocaleString('es-CO') : '—'}</td><td>{register.closed_at ? new Date(register.closed_at).toLocaleString('es-CO') : '—'}</td><td className="text-end">{money(register.expected_cash)}</td><td className="text-end">{money(register.counted_cash)}</td><td className="text-end">{register.difference == null ? '—' : money(register.difference)}</td></tr>)}
          </tbody></table></div>
        </div>
      </div>
    </section>
  )
}
