import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { obtenerPayloadToken } from '../services/api'
import {
  cerrarCajaDelDia,
  cerrarDia,
  cerrarSucursalDelDia,
  descargarReporteDiaActual,
  iniciarDia,
  obtenerDiaActual,
  obtenerResumenCaja,
} from '../services/cashApi'

const money = (value) => Number(value || 0).toLocaleString('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const localDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const hasPermission = (token, permission) => {
  const payload = obtenerPayloadToken(token)
  return payload?.user_type === 'SUPER' || payload?.permissions?.includes(permission)
}

const errorMessage = (error) => error?.message || 'No fue posible completar la operación de Caja.'

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function CashPage() {
  const { token } = useAuth()
  const [day, setDay] = useState(null)
  const [businessDate, setBusinessDate] = useState(localDate)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState('')
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
  const canReadCash = hasPermission(token, 'CASH_READ')
  const dayIsOpen = day?.status === 'OPEN'
  const dayIsClosed = day?.status === 'CLOSED'

  // El access token cambia durante un refresh, pero la sesión lógica no cambia.
  // Cargar nuevamente toda la página por cada renovación provocaba el efecto visual de un F5.
  const tokenRef = useRef(token)
  tokenRef.current = token
  const tokenPayload = obtenerPayloadToken(token)
  const sessionKey = tokenPayload?.session_id
    || tokenPayload?.user_tenant_id
    || tokenPayload?.global_user_id
    || tokenPayload?.sub
    || ''

  const load = useCallback(async (tokenActual) => {
    setLoading(true)
    setError('')
    try {
      const currentDay = await obtenerDiaActual(tokenActual)
      setDay(currentDay)
      if (currentDay?.status === 'OPEN') setBusinessDate(currentDay.business_date)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!sessionKey) return undefined

    const timeoutId = setTimeout(() => load(tokenRef.current), 0)
    return () => clearTimeout(timeoutId)
  }, [sessionKey, load])

  const registersByBranch = useMemo(() => {
    const result = new Map()
    for (const register of day?.registers || []) {
      const branchId = String(register.branch_id)
      result.set(branchId, (result.get(branchId) || []).concat(register))
    }
    return result
  }, [day])

  const allBranchesClosed = dayIsOpen && Boolean(day?.branches?.length) && day.branches.every((branch) => branch.status === 'CLOSED')
  const allRegistersClosed = dayIsOpen && Boolean(day?.registers?.length) && day.registers.every((register) => register.status === 'CLOSED')

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
      await load(tokenRef.current)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const exportReport = async (format) => {
    if (!day?.id || !canReadCash) return
    setExporting(format)
    setError('')
    setMessage('')
    try {
      const blob = await descargarReporteDiaActual(format, token)
      const extension = format === 'pdf' ? 'pdf' : 'xlsx'
      downloadBlob(blob, `cierre_caja_${day.business_date}.${extension}`)
      setMessage(`${format === 'pdf' ? 'PDF' : 'Excel'} del día operativo generado correctamente.`)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setExporting('')
    }
  }

  const start = () => {
    if (!businessDate) {
      setError('Selecciona la fecha de operación.')
      return
    }
    run(
      () => iniciarDia(token, businessDate),
      `Día operativo ${businessDate} iniciado. Todas las sucursales y cajas activas quedaron abiertas.`,
    )
  }

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

  const closeFeedback = () => {
    setError('')
    setMessage('')
  }

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

  const feedback = error
    ? { type: 'danger', title: 'No fue posible completar la operación', text: error }
    : message
      ? { type: 'success', title: 'Operación completada', text: message }
      : null

  return (
    <section className="container-fluid py-3 cash-page">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h2 className="mb-1">Día operativo de Caja</h2>
          <div className="text-muted">Inicio, arqueo y cierre jerárquico de cajas, sucursales y día.</div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          {day && canReadCash && (
            <>
              <button type="button" className="btn btn-outline-danger" disabled={Boolean(exporting)} onClick={() => exportReport('pdf')} title="Imprimir resumen del día en PDF">
                {exporting === 'pdf' ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" /> : null}
                {exporting === 'pdf' ? 'Generando PDF...' : '📄 PDF'}
              </button>
              <button type="button" className="btn btn-outline-success" disabled={Boolean(exporting)} onClick={() => exportReport('xlsx')} title="Exportar resumen del día a Excel">
                {exporting === 'xlsx' ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" /> : null}
                {exporting === 'xlsx' ? 'Generando Excel...' : '📊 Excel'}
              </button>
            </>
          )}
          {day && (
            <span className={`badge ${dayIsOpen ? 'text-bg-success' : 'text-bg-secondary'} px-3 py-2`}>
              {day.business_date} · {dayIsOpen ? 'ABIERTO' : 'CERRADO'}
            </span>
          )}
        </div>
      </div>

      {(!day || dayIsClosed) && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body p-4">
            <h5 className="mb-2">{dayIsClosed ? 'El día operativo está cerrado' : 'No hay un día operativo abierto'}</h5>
            <p className="text-muted mb-3">
              {dayIsClosed
                ? 'El día cerrado no puede reabrirse. Selecciona una fecha para iniciar un nuevo ciclo operativo.'
                : 'Selecciona la fecha contable del día. Puede ser la fecha de hoy o una fecha futura.'}
            </p>
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-4">
                <label className="form-label">Fecha de operación</label>
                <input
                  className="form-control"
                  type="date"
                  value={businessDate}
                  onChange={(event) => setBusinessDate(event.target.value)}
                  disabled={saving || !canStart}
                />
              </div>
              <div className="col-12 col-md-auto">
                {canStart ? (
                  <button className="btn btn-primary" disabled={saving || !businessDate} onClick={start}>
                    {saving ? 'Iniciando día...' : 'Iniciar día'}
                  </button>
                ) : (
                  <div className="alert alert-warning mb-0">No tienes permiso para iniciar el día operativo.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {day && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="border rounded p-3 h-100">
                <div className="text-muted small">Sucursales</div>
                <div className="fs-4 fw-semibold">{day.branches.length}</div>
                <div className="small text-muted">{day.branches.filter((item) => item.status === 'CLOSED').length} cerradas</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="border rounded p-3 h-100">
                <div className="text-muted small">Cajas</div>
                <div className="fs-4 fw-semibold">{day.registers.length}</div>
                <div className="small text-muted">{day.registers.filter((item) => item.status === 'CLOSED').length} cerradas</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="border rounded p-3 h-100">
                <div className="text-muted small">Estado de cierre</div>
                {dayIsClosed ? (
                  <>
                    <div className="fs-5 fw-semibold">Día cerrado</div>
                    <div className="small text-muted">El día operativo ya está cerrado y no admite nuevas operaciones.</div>
                  </>
                ) : (
                  <>
                    <div className="fs-5 fw-semibold">{allBranchesClosed ? 'Listo para cerrar día' : 'Pendiente de cierres'}</div>
                    <div className="small text-muted">{allRegistersClosed ? 'Todas las cajas cerradas' : 'Hay cajas abiertas'}</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {dayIsOpen && (
            <>
              <div className="border rounded mb-4">
                <div className="p-3 border-bottom">
                  <h5 className="mb-1">Cajas del día</h5>
                  <div className="text-muted small">Cada caja debe realizar su arqueo antes de cerrar la sucursal.</div>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead><tr><th>Sucursal</th><th>Caja</th><th>Estado</th><th className="text-end">Esperado</th><th className="text-end">Contado</th><th className="text-end">Diferencia</th><th className="text-end">Acción</th></tr></thead>
                    <tbody>
                      {day.registers.length === 0 ? (
                        <tr><td colSpan="7" className="text-center text-muted py-4">No hay cajas activas para este día.</td></tr>
                      ) : day.registers.map((register) => (
                        <tr key={register.id}>
                          <td>{register.branch_name || '—'}</td>
                          <td>{register.cash_box_name || `Caja #${register.id}`}</td>
                          <td><span className={`badge ${register.status === 'OPEN' ? 'text-bg-success' : 'text-bg-secondary'}`}>{register.status === 'OPEN' ? 'ABIERTA' : 'CERRADA'}</span></td>
                          <td className="text-end">{register.expected_cash == null ? '—' : money(register.expected_cash)}</td>
                          <td className="text-end">{register.counted_cash == null ? '—' : money(register.counted_cash)}</td>
                          <td className="text-end">{register.difference == null ? '—' : money(register.difference)}</td>
                          <td className="text-end">
                            {register.status === 'OPEN' && canCloseBox ? <button className="btn btn-sm btn-outline-danger" disabled={saving} onClick={() => selectRegister(register)}>Arqueo y cierre</button> : <span className="text-muted small">{register.status === 'OPEN' ? 'Sin permiso de cierre' : 'Cerrada'}</span>}
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
                    <div className="col-12 col-md-4"><label className="form-label">Efectivo contado</label><input className="form-control" type="number" min="0" step="1" value={countedCash} onChange={(event) => setCountedCash(event.target.value)} /></div>
                    <div className="col-12 col-md-5"><label className="form-label">Notas de cierre</label><input className="form-control" maxLength="500" value={closingNotes} onChange={(event) => setClosingNotes(event.target.value)} /></div>
                    <div className="col-12 col-md-3"><button className="btn btn-danger w-100" disabled={saving} onClick={closeRegister}>{saving ? 'Cerrando...' : 'Confirmar cierre'}</button></div>
                  </div>
                  <div className="small text-muted mt-2">Diferencia estimada: {countedCash === '' ? '—' : money(Number(countedCash) - Number(selectedRegister.expected_cash || 0))}</div>
                </div>
              )}

              <div className="border rounded mb-4">
                <div className="p-3 border-bottom"><h5 className="mb-1">Sucursales del día</h5><div className="text-muted small">Una sucursal solo puede cerrarse cuando todas sus cajas estén cerradas.</div></div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead><tr><th>Sucursal</th><th>Estado</th><th>Cajas</th><th className="text-end">Acción</th></tr></thead>
                    <tbody>
                      {day.branches.map((branch) => {
                        const branchRegisters = registersByBranch.get(String(branch.branch_id)) || []
                        const openBoxes = branchRegisters.filter((register) => register.status === 'OPEN').length
                        const canCloseThisBranch = branch.status === 'OPEN' && openBoxes === 0 && canCloseBranch
                        return (
                          <tr key={branch.id}>
                            <td>{branch.branch_name}</td>
                            <td><span className={`badge ${branch.status === 'OPEN' ? 'text-bg-success' : 'text-bg-secondary'}`}>{branch.status === 'OPEN' ? 'ABIERTA' : 'CERRADA'}</span></td>
                            <td>{branchRegisters.length} total · {openBoxes} abiertas</td>
                            <td className="text-end">
                              {branch.status === 'CLOSED' ? <span className="text-muted small">Cerrada</span> : !canCloseBranch ? <span className="text-muted small">Sin permiso de cierre</span> : openBoxes > 0 ? <span className="text-muted small">Cierra primero las cajas</span> : <button className="btn btn-sm btn-outline-danger" disabled={saving || !canCloseThisBranch} onClick={() => closeBranch(branch)}>Cerrar sucursal</button>}
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
                  <div><h5 className="mb-1">Cierre del día</h5><div className="text-muted small">El día solo puede cerrarse cuando todas las sucursales estén cerradas.</div></div>
                  {canCloseDay && allBranchesClosed && <button className="btn btn-danger" disabled={saving} onClick={closeOperatingDay}>{saving ? 'Cerrando día...' : 'Cerrar día'}</button>}
                </div>
                <div className="p-3"><label className="form-label">Notas de cierre del día</label><textarea className="form-control" rows="2" maxLength="500" value={dayClosingNotes} onChange={(event) => setDayClosingNotes(event.target.value)} /></div>
              </div>
            </>
          )}

          {dayIsClosed && (
            <div className="alert alert-secondary">El día operativo ya está cerrado y no admite nuevas operaciones. Para continuar, inicia un nuevo día con otra fecha de operación.</div>
          )}
        </>
      )}

      {feedback && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,.5)', position: 'fixed', inset: 0, zIndex: 2100 }} role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{feedback.title}</h5>
                <button type="button" className="btn-close" onClick={closeFeedback} aria-label="Cerrar" />
              </div>
              <div className="modal-body">
                <p className="mb-0">{feedback.text}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className={`btn btn-${feedback.type}`} onClick={closeFeedback}>Aceptar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
