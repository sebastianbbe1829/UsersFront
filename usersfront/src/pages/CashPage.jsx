import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { obtenerPayloadToken } from '../services/api'
import {
  cerrarCajaDelDia,
  cerrarDia,
  cerrarSucursalDelDia,
  iniciarDia,
  obtenerDiaActual,
  obtenerResumenCaja,
} from '../services/cashApi'

const money = (value) => Number(value || 0).toLocaleString('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const hasPermission = (token, permission) => {
  const payload = obtenerPayloadToken(token)
  return payload?.user_type === 'SUPER' || payload?.permissions?.includes(permission)
}

const errorMessage = (error) => error?.message || 'No fue posible completar la operación de Caja.'

export default function CashPage() {
  const { token } = useAuth()
  const [day, setDay] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selectedRegister, setSelectedRegister] = useState(null)
  const [countedCash, setCountedCash] = useState('')
  const [closingNotes, setClosingNotes] = useState('')
  const [dayClosingNotes, setDayClosingNotes] = useState('')

  const canStart = hasPermission(token, 'CASH_DAY_START')
  const canCloseBox = hasPermission(token, 'CASH_CLOSE')
  const canCloseBranch = hasPermission(token, 'CASH_BRANCH_CLOSE')
  const canCloseDay = hasPermission(token, 'CASH_DAY_CLOSE')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setDay(await obtenerDiaActual(token))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    const timeoutId = setTimeout(load, 0)
    return () => clearTimeout(timeoutId)
  }, [load])

  const registersByBranch = useMemo(() => {
    const result = new Map()
    for (const register of day?.registers || []) {
      const branchId = String(register.branch_id)
      result.set(branchId, (result.get(branchId) || []).concat(register))
    }
    return result
  }, [day])

  const allBranchesClosed = Boolean(day?.branches?.length) && day.branches.every((branch) => branch.status === 'CLOSED')
  const allRegistersClosed = Boolean(day?.registers?.length) && day.registers.every((register) => register.status === 'CLOSED')

  const run = async (operation, successMessage) => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await operation()
      setMessage(successMessage)
      setSelectedRegister(null)
      setCountedCash('')
      setClosingNotes('')
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const start = () => run(
    () => iniciarDia(token),
    'Día operativo iniciado. Todas las sucursales y cajas activas quedaron abiertas.',
  )

  const selectRegister = async (register) => {
    if (register.status !== 'OPEN') return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const summary = await obtenerResumenCaja(register.id, token)
      setSelectedRegister({ ...register, expected_cash: summary.expected_cash })
      setCountedCash('')
      setClosingNotes('')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const closeRegister = () => {
    if (!selectedRegister) return
    if (countedCash === '' || Number(countedCash) < 0) {
      setError('Indica el efectivo contado para realizar el arqueo.')
      return
    }
    run(
      () => cerrarCajaDelDia(selectedRegister.id, {
        counted_cash: Number(countedCash),
        closing_notes: closingNotes.trim() || null,
      }, token),
      `Caja ${selectedRegister.cash_box_name || `#${selectedRegister.id}`} cerrada correctamente.`,
    )
  }

  const closeBranch = (branch) => run(
    () => cerrarSucursalDelDia(branch.branch_id, token),
    `Sucursal ${branch.branch_name} cerrada correctamente.`,
  )

  const closeOperatingDay = () => run(
    () => cerrarDia(dayClosingNotes.trim() || null, token),
    'Día operativo cerrado correctamente.',
  )

  if (loading) {
    return (
      <section className="container-fluid py-4 cash-page">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <div className="mt-3 text-muted">Cargando día operativo...</div>
        </div>
      </section>
    )
  }

  return (
    <section className="container-fluid py-3 cash-page">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h2 className="mb-1">Día operativo de Caja</h2>
          <div className="text-muted">
            Inicio, arqueo y cierre jerárquico de cajas, sucursales y día.
          </div>
        </div>
        {day && (
          <span className={`badge ${day.status === 'OPEN' ? 'text-bg-success' : 'text-bg-secondary'} px-3 py-2`}>
            {day.business_date} · {day.status === 'OPEN' ? 'ABIERTO' : 'CERRADO'}
          </span>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {!day ? (
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <h5 className="mb-2">El día de hoy no ha sido iniciado</h5>
            <p className="text-muted mb-4">
              Al iniciar el día se abrirán automáticamente todas las sucursales y todas las cajas físicas activas.
            </p>
            {canStart ? (
              <button className="btn btn-primary" disabled={saving} onClick={start}>
                {saving ? 'Iniciando día...' : 'Iniciar día'}
              </button>
            ) : (
              <div className="alert alert-warning mb-0">
                No tienes permiso para iniciar el día operativo.
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="border rounded p-3 h-100">
                <div className="text-muted small">Sucursales</div>
                <div className="fs-4 fw-semibold">{day.branches.length}</div>
                <div className="small text-muted">
                  {day.branches.filter((item) => item.status === 'CLOSED').length} cerradas
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="border rounded p-3 h-100">
                <div className="text-muted small">Cajas</div>
                <div className="fs-4 fw-semibold">{day.registers.length}</div>
                <div className="small text-muted">
                  {day.registers.filter((item) => item.status === 'CLOSED').length} cerradas
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="border rounded p-3 h-100">
                <div className="text-muted small">Estado de cierre</div>
                <div className="fs-5 fw-semibold">
                  {allBranchesClosed ? 'Listo para cerrar día' : 'Pendiente de cierres'}
                </div>
                <div className="small text-muted">
                  {allRegistersClosed ? 'Todas las cajas cerradas' : 'Hay cajas abiertas'}
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded mb-4">
            <div className="p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div>
                <h5 className="mb-1">Cajas del día</h5>
                <div className="text-muted small">Cada caja debe realizar su arqueo antes de cerrar la sucursal.</div>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Sucursal</th>
                    <th>Caja</th>
                    <th>Estado</th>
                    <th className="text-end">Esperado</th>
                    <th className="text-end">Contado</th>
                    <th className="text-end">Diferencia</th>
                    <th className="text-end">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {day.registers.length === 0 ? (
                    <tr><td colSpan="7" className="text-center text-muted py-4">No hay cajas activas para este día.</td></tr>
                  ) : day.registers.map((register) => (
                    <tr key={register.id}>
                      <td>{register.branch_name || '—'}</td>
                      <td>{register.cash_box_name || `Caja #${register.id}`}</td>
                      <td>
                        <span className={`badge ${register.status === 'OPEN' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                          {register.status === 'OPEN' ? 'ABIERTA' : 'CERRADA'}
                        </span>
                      </td>
                      <td className="text-end">{register.expected_cash == null ? '—' : money(register.expected_cash)}</td>
                      <td className="text-end">{register.counted_cash == null ? '—' : money(register.counted_cash)}</td>
                      <td className="text-end">{register.difference == null ? '—' : money(register.difference)}</td>
                      <td className="text-end">
                        {register.status === 'OPEN' && canCloseBox ? (
                          <button className="btn btn-sm btn-outline-danger" disabled={saving} onClick={() => selectRegister(register)}>
                            Arqueo y cierre
                          </button>
                        ) : register.status === 'OPEN' ? (
                          <span className="text-muted small">Sin permiso de cierre</span>
                        ) : (
                          <span className="text-muted small">Cerrada</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedRegister && (
            <div className="border rounded p-3 mb-4">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <div>
                  <h5 className="mb-1">Arqueo: {selectedRegister.cash_box_name || `Caja #${selectedRegister.id}`}</h5>
                  <div className="text-muted small">{selectedRegister.branch_name || 'Sucursal'} · efectivo esperado {money(selectedRegister.expected_cash)}</div>
                </div>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedRegister(null)}>Cancelar</button>
              </div>
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-4">
                  <label className="form-label">Efectivo contado</label>
                  <input className="form-control" type="number" min="0" step="1" value={countedCash} onChange={(event) => setCountedCash(event.target.value)} />
                </div>
                <div className="col-12 col-md-5">
                  <label className="form-label">Notas de cierre</label>
                  <input className="form-control" maxLength="500" value={closingNotes} onChange={(event) => setClosingNotes(event.target.value)} />
                </div>
                <div className="col-12 col-md-3">
                  <button className="btn btn-danger w-100" disabled={saving} onClick={closeRegister}>
                    {saving ? 'Cerrando...' : 'Confirmar cierre'}
                  </button>
                </div>
              </div>
              <div className="small text-muted mt-2">
                Diferencia estimada: {countedCash === '' ? '—' : money(Number(countedCash) - Number(selectedRegister.expected_cash || 0))}
              </div>
            </div>
          )}

          <div className="border rounded mb-4">
            <div className="p-3 border-bottom">
              <h5 className="mb-1">Sucursales del día</h5>
              <div className="text-muted small">Una sucursal solo puede cerrarse cuando todas sus cajas estén cerradas.</div>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Sucursal</th>
                    <th>Estado</th>
                    <th>Cajas</th>
                    <th className="text-end">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {day.branches.map((branch) => {
                    const branchRegisters = registersByBranch.get(String(branch.branch_id)) || []
                    const openBoxes = branchRegisters.filter((register) => register.status === 'OPEN').length
                    const canCloseThisBranch = branch.status === 'OPEN' && openBoxes === 0 && canCloseBranch
                    return (
                      <tr key={branch.id}>
                        <td>{branch.branch_name}</td>
                        <td>
                          <span className={`badge ${branch.status === 'OPEN' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                            {branch.status === 'OPEN' ? 'ABIERTA' : 'CERRADA'}
                          </span>
                        </td>
                        <td>{branchRegisters.length} total · {openBoxes} abiertas</td>
                        <td className="text-end">
                          {branch.status === 'CLOSED' ? (
                            <span className="text-muted small">Cerrada</span>
                          ) : !canCloseBranch ? (
                            <span className="text-muted small">Sin permiso de cierre</span>
                          ) : openBoxes > 0 ? (
                            <span className="text-muted small">Cierra primero las cajas</span>
                          ) : (
                            <button className="btn btn-sm btn-outline-danger" disabled={saving || !canCloseThisBranch} onClick={() => closeBranch(branch)}>
                              Cerrar sucursal
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border rounded">
            <div className="p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div>
                <h5 className="mb-1">Cierre del día</h5>
                <div className="text-muted small">El día solo puede cerrarse cuando todas las sucursales estén cerradas.</div>
              </div>
              {day.status === 'OPEN' && canCloseDay && allBranchesClosed && (
                <button className="btn btn-danger" disabled={saving} onClick={closeOperatingDay}>
                  {saving ? 'Cerrando día...' : 'Cerrar día'}
                </button>
              )}
            </div>
            {day.status === 'OPEN' && (
              <div className="p-3">
                <label className="form-label">Notas de cierre del día</label>
                <textarea className="form-control" rows="2" maxLength="500" value={dayClosingNotes} onChange={(event) => setDayClosingNotes(event.target.value)} />
                {!canCloseDay && <div className="small text-muted mt-2">No tienes permiso para cerrar el día.</div>}
                {canCloseDay && !allBranchesClosed && <div className="small text-muted mt-2">Todavía hay sucursales abiertas.</div>}
              </div>
            )}
            {day.status === 'CLOSED' && (
              <div className="p-3 text-muted">El día operativo ya está cerrado y no admite nuevas operaciones.</div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
