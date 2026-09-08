import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { obtenerObligacionesCliente, obtenerPagosCartera, registrarPagoCartera } from '../services/portfolioApi'
import { obtenerClientes } from '../services/clientsApi'

const money = (value) => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
}).format(Number(value || 0))

const fechaHoy = () => new Date().toISOString().slice(0, 10)
const nuevoFormulario = () => ({
  client_id: '',
  payment_date: fechaHoy(),
  payment_method: 'TRANSFERENCIA',
  reference: '',
  notes: '',
})

const nombreCliente = (cliente) => cliente?.full_name || [
  cliente?.first_name,
  cliente?.middle_name,
  cliente?.last_name,
  cliente?.second_last_name,
].filter(Boolean).join(' ') || cliente?.business_name || 'Cliente sin nombre'

const formatDate = (value) => {
  if (!value) return '—'
  const fecha = new Date(`${value}T00:00:00`)
  return Number.isNaN(fecha.getTime()) ? '—' : new Intl.DateTimeFormat('es-CO').format(fecha)
}

export default function PortfolioPaymentsPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [searchParams] = useSearchParams()
  const [clientes, setClientes] = useState([])
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [obligaciones, setObligaciones] = useState([])
  const [pagos, setPagos] = useState([])
  const [formulario, setFormulario] = useState(nuevoFormulario())
  const [asignaciones, setAsignaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [cargandoObligaciones, setCargandoObligaciones] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const cargarPagos = useCallback(async () => {
    const resultado = await obtenerPagosCartera(token)
    setPagos(Array.isArray(resultado) ? resultado : [])
  }, [token])

  const cargarClientes = useCallback(async () => {
    const acumulados = []
    const pageSize = 100
    let page = 1
    while (true) {
      const resultado = await obtenerClientes(token, { page, pageSize, search: '' })
      const items = Array.isArray(resultado) ? resultado : Array.isArray(resultado?.items) ? resultado.items : []
      acumulados.push(...items)
      if (items.length < pageSize) break
      page += 1
    }
    setClientes(acumulados)
  }, [token])

  useEffect(() => {
    if (!token) return undefined
    Promise.all([cargarPagos(), cargarClientes()]).catch((error) => {
      if (error.status === 401) manejarSesionExpirada()
      else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar los pagos.' })
    }).finally(() => setCargando(false))
    return undefined
  }, [token, cargarPagos, cargarClientes, manejarSesionExpirada])

  const clientesFiltrados = useMemo(() => {
    const termino = busquedaCliente.trim().toLowerCase()
    const candidatos = termino
      ? clientes.filter((cliente) => `${nombreCliente(cliente)} ${cliente.identification_number || ''}`.toLowerCase().includes(termino))
      : clientes
    return candidatos.slice(0, 8)
  }, [clientes, busquedaCliente])

  const cargarObligaciones = async (clientId) => {
    if (!clientId) {
      setObligaciones([])
      setAsignaciones([])
      return
    }
    try {
      setCargandoObligaciones(true)
      const resultado = await obtenerObligacionesCliente(clientId, token)
      const activas = (Array.isArray(resultado) ? resultado : [])
        .filter((item) => item.status === 'ACTIVE' && Number(item.balance) > 0)
      setObligaciones(activas)
      setAsignaciones([])
    } catch (error) {
      if (error.status === 401) manejarSesionExpirada()
      else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar las obligaciones del cliente.' })
    } finally {
      setCargandoObligaciones(false)
    }
  }

  const seleccionarCliente = async (cliente) => {
    setClienteSeleccionado(cliente)
    setBusquedaCliente(nombreCliente(cliente))
    setFormulario((actual) => ({ ...actual, client_id: cliente.id }))
    await cargarObligaciones(cliente.id)
  }

  const seleccionarObligacion = (index, obligationId) => {
    const obligation = obligaciones.find((item) => item.id === obligationId)
    setAsignaciones((actuales) => actuales.map((item, itemIndex) => (
      itemIndex === index
        ? { obligation_id: obligationId, amount: obligation ? String(obligation.balance) : '' }
        : item
    )))
  }

  const seleccionarPrimeraObligacion = (event) => {
    const obligationId = event.target.value
    if (!obligationId) {
      setAsignaciones([])
      return
    }
    const obligation = obligaciones.find((item) => item.id === obligationId)
    setAsignaciones([{ obligation_id: obligationId, amount: String(obligation?.balance || '') }])
  }

  const agregarAsignacion = () => {
    const usada = new Set(asignaciones.map((item) => item.obligation_id))
    const siguiente = obligaciones.find((item) => !usada.has(item.id))
    if (!siguiente) return
    setAsignaciones((actuales) => [
      ...actuales,
      { obligation_id: siguiente.id, amount: String(siguiente.balance) },
    ])
  }

  const actualizarAsignacion = (index, amount) => {
    setAsignaciones((actuales) => actuales.map((item, itemIndex) => (
      itemIndex === index ? { ...item, amount } : item
    )))
  }

  const eliminarAsignacion = (index) => {
    setAsignaciones((actuales) => actuales.filter((_, itemIndex) => itemIndex !== index))
  }

  const totalAsignado = useMemo(
    () => asignaciones.reduce((total, item) => total + Number(item.amount || 0), 0),
    [asignaciones],
  )

  const guardar = async (event) => {
    event.preventDefault()
    if (!clienteSeleccionado || !asignaciones.length) {
      setMensaje({ tipo: 'warning', texto: 'Selecciona un cliente y al menos una obligación.' })
      return
    }

    const allocations = asignaciones
      .filter((item) => Number(item.amount) > 0)
      .map((item) => ({ obligation_id: item.obligation_id, amount: Number(item.amount) }))

    if (!allocations.length || !Number.isFinite(totalAsignado) || totalAsignado <= 0) {
      setMensaje({ tipo: 'warning', texto: 'Ingresa un valor de pago válido.' })
      return
    }

    const excedeSaldo = allocations.some((item) => {
      const obligation = obligaciones.find((actual) => actual.id === item.obligation_id)
      return obligation && item.amount > Number(obligation.balance)
    })
    if (excedeSaldo) {
      setMensaje({ tipo: 'warning', texto: 'El valor aplicado no puede superar el saldo pendiente de la obligación.' })
      return
    }

    try {
      setGuardando(true)
      setMensaje(null)
      await registrarPagoCartera({
        client_id: formulario.client_id,
        payment_date: formulario.payment_date || undefined,
        payment_method: formulario.payment_method,
        amount: totalAsignado,
        reference: formulario.reference || undefined,
        notes: formulario.notes || undefined,
        allocations,
      }, token)
      setFormulario(nuevoFormulario())
      setBusquedaCliente('')
      setClienteSeleccionado(null)
      setAsignaciones([])
      setObligaciones([])
      await cargarPagos()
      setMostrarFormulario(false)
      setMensaje({ tipo: 'success', texto: 'Pago registrado y aplicado correctamente.' })
    } catch (error) {
      if (error.status === 401) manejarSesionExpirada()
      else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible registrar el pago.' })
    } finally {
      setGuardando(false)
    }
  }

  const cancelarRegistro = () => {
    setMostrarFormulario(false)
    setFormulario(nuevoFormulario())
    setBusquedaCliente('')
    setClienteSeleccionado(null)
    setObligaciones([])
    setAsignaciones([])
    setMensaje(null)
  }

  const clientePorId = useMemo(
    () => Object.fromEntries(clientes.map((cliente) => [String(cliente.id), nombreCliente(cliente)])),
    [clientes],
  )

  const pagoSeleccionado = searchParams.get('payment')?.trim().toLowerCase()

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold mb-1">Pagos</h2>
          <p className="text-muted mb-0">Consulta los pagos registrados y registra nuevos abonos.</p>
        </div>
        {!mostrarFormulario && (
          <button type="button" className="btn btn-primary" onClick={() => { setMostrarFormulario(true); setMensaje(null) }}>
            + Registrar pago
          </button>
        )}
      </div>

      {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}

      {mostrarFormulario && (
        <div className="card border-0 shadow-sm mb-4 position-relative" aria-busy={guardando}>
          {guardando && (
            <div
              className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center rounded"
              style={{ zIndex: 20, backgroundColor: 'rgba(var(--bs-body-bg-rgb), 0.78)', backdropFilter: 'blur(1px)' }}
              role="status"
              aria-live="polite"
            >
              <div className="spinner-border mb-3" aria-hidden="true" />
              <div className="fw-semibold">Registrando pago...</div>
              <div className="text-muted small mt-1">Aplicando el pago a las obligaciones seleccionadas.</div>
            </div>
          )}
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="mb-1">Registrar pago</h5>
                <div className="text-muted small">Cliente → obligación/referencia → valor aplicado.</div>
              </div>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={cancelarRegistro} disabled={guardando}>Cancelar</button>
            </div>

            <form onSubmit={guardar}>
              <div className="mb-4 position-relative">
                <label className="form-label fw-semibold" htmlFor="pago-cliente">Cliente</label>
                <input
                  id="pago-cliente"
                  className="form-control"
                  value={busquedaCliente}
                  onChange={(event) => {
                    setBusquedaCliente(event.target.value)
                    if (clienteSeleccionado && event.target.value !== nombreCliente(clienteSeleccionado)) {
                      setClienteSeleccionado(null)
                      setAsignaciones([])
                      setObligaciones([])
                    }
                  }}
                  placeholder="Digita nombre o identificación..."
                  autoComplete="off"
                  required={!clienteSeleccionado}
                  disabled={guardando}
                />
                {busquedaCliente.trim() && !clienteSeleccionado && (
                  <div className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 10 }}>
                    {clientesFiltrados.map((cliente) => (
                      <button key={cliente.id} type="button" className="list-group-item list-group-item-action text-start" onClick={() => void seleccionarCliente(cliente)} disabled={guardando}>
                        <div className="fw-semibold">{nombreCliente(cliente)}</div>
                        <div className="small text-muted">{cliente.identification_number || 'Sin identificación'}</div>
                      </button>
                    ))}
                    {!clientesFiltrados.length && <div className="list-group-item text-muted">No se encontraron clientes.</div>}
                  </div>
                )}
                {clienteSeleccionado && (
                  <div className="small text-success mt-1">
                    Cliente seleccionado: {nombreCliente(clienteSeleccionado)} — {clienteSeleccionado.identification_number || 'Sin identificación'}
                  </div>
                )}
              </div>

              {clienteSeleccionado && (
                <>
                  <div className="card bg-body-tertiary border mb-4">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <h6 className="fw-semibold mb-1">Aplicación del pago</h6>
                          <div className="small text-muted">Selecciona la obligación y el valor a aplicar. Por defecto se propone el saldo pendiente.</div>
                        </div>
                        {asignaciones.length > 0 && obligaciones.length > asignaciones.length && (
                          <button type="button" className="btn btn-outline-primary btn-sm" onClick={agregarAsignacion} disabled={guardando}>+ Otra obligación</button>
                        )}
                      </div>

                      {cargandoObligaciones && <div className="text-muted py-2">Cargando obligaciones...</div>}
                      {!cargandoObligaciones && !obligaciones.length && (
                        <div className="alert alert-info mb-0">El cliente no tiene obligaciones activas con saldo pendiente.</div>
                      )}

                      {!cargandoObligaciones && obligaciones.length > 0 && asignaciones.length === 0 && (
                        <div>
                          <label className="form-label fw-semibold" htmlFor="pago-obligacion">Obligación / Referencia</label>
                          <select id="pago-obligacion" className="form-select" value="" onChange={seleccionarPrimeraObligacion} required disabled={guardando}>
                            <option value="">Selecciona una obligación...</option>
                            {obligaciones.map((item) => (
                              <option key={item.id} value={item.id}>{item.sale_number || item.id} — saldo {money(item.balance)}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {asignaciones.map((asignacion, index) => {
                        const obligation = obligaciones.find((item) => item.id === asignacion.obligation_id)
                        const otras = obligaciones.filter((item) => item.id === asignacion.obligation_id || !asignaciones.some((actual) => actual.obligation_id === item.id))
                        return (
                          <div className="border rounded p-3 mb-3" key={`${asignacion.obligation_id}-${index}`}>
                            <div className="row g-3 align-items-end">
                              <div className="col-lg-7">
                                <label className="form-label fw-semibold">Obligación / Referencia</label>
                                <select className="form-select" value={asignacion.obligation_id} onChange={(event) => seleccionarObligacion(index, event.target.value)} disabled={guardando}>
                                  {otras.map((item) => (
                                    <option key={item.id} value={item.id}>{item.sale_number || item.id} — saldo {money(item.balance)}</option>
                                  ))}
                                </select>
                                <div className="small text-muted mt-1">Saldo pendiente: <strong>{money(obligation?.balance)}</strong></div>
                              </div>
                              <div className="col-lg-4">
                                <label className="form-label fw-semibold">Valor a aplicar</label>
                                <input
                                  className="form-control"
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  max={obligation?.balance || undefined}
                                  value={asignacion.amount}
                                  onChange={(event) => actualizarAsignacion(index, event.target.value)}
                                  required
                                  disabled={guardando}
                                />
                                <div className="form-text">Puedes registrar un valor menor al saldo.</div>
                              </div>
                              <div className="col-lg-1 text-end">
                                {asignaciones.length > 1 && <button type="button" className="btn btn-outline-danger" onClick={() => eliminarAsignacion(index)} title="Quitar obligación" disabled={guardando}>×</button>}
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {asignaciones.length > 0 && (
                        <div className="d-flex justify-content-end align-items-center gap-2">
                          <span className="text-muted">Total del pago:</span>
                          <strong className="fs-5">{money(totalAsignado)}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card border mb-4">
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Fecha del pago</label>
                          <input className="form-control" type="date" value={formulario.payment_date} onChange={(event) => setFormulario((actual) => ({ ...actual, payment_date: event.target.value }))} disabled={guardando} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Medio de pago</label>
                          <select className="form-select" value={formulario.payment_method} onChange={(event) => setFormulario((actual) => ({ ...actual, payment_method: event.target.value }))} disabled={guardando}>
                            <option>TRANSFERENCIA</option>
                            <option>EFECTIVO</option>
                            <option>TARJETA</option>
                            <option>OTRO</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Referencia del pago</label>
                          <input className="form-control" maxLength="100" value={formulario.reference} onChange={(event) => setFormulario((actual) => ({ ...actual, reference: event.target.value }))} placeholder="Comprobante, consignación..." disabled={guardando} />
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-semibold">Notas</label>
                          <input className="form-control" maxLength="500" value={formulario.notes} onChange={(event) => setFormulario((actual) => ({ ...actual, notes: event.target.value }))} disabled={guardando} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-end">
                    <button className="btn btn-primary" type="submit" disabled={guardando || cargandoObligaciones || !asignaciones.length || totalAsignado <= 0}>
                      {guardando ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Registrando...</> : 'Registrar pago'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {!mostrarFormulario && (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Referencia</th>
                  <th>Obligaciones</th>
                  <th className="text-end">Valor</th>
                  <th>Medio de pago</th>
                </tr>
              </thead>
              <tbody>
                {cargando && <tr><td colSpan="6" className="text-center py-5"><div className="spinner-border" /><div className="text-muted mt-2">Consultando pagos...</div></td></tr>}
                {!cargando && !pagos.length && <tr><td colSpan="6" className="text-center text-muted py-5">No hay pagos registrados.</td></tr>}
                {!cargando && pagos.map((pago) => {
                  const seleccionado = pagoSeleccionado && String(pago.id).toLowerCase() === pagoSeleccionado
                  return (
                    <tr key={pago.id} className={seleccionado ? 'table-active' : ''}>
                      <td>{formatDate(pago.payment_date)}</td>
                      <td><div className="fw-semibold">{clientePorId[String(pago.client_id)] || 'Cliente no disponible'}</div></td>
                      <td>{pago.reference || '—'}</td>
                      <td>
                        {pago.allocations?.length
                          ? pago.allocations.map((allocation) => {
                            const obligation = obligaciones.find((item) => item.id === allocation.obligation_id)
                            return <div key={allocation.id || allocation.obligation_id} className="small">{obligation?.sale_number || allocation.obligation_id}</div>
                          })
                          : '—'}
                      </td>
                      <td className="text-end fw-bold">{money(pago.amount)}</td>
                      <td>{pago.payment_method || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
