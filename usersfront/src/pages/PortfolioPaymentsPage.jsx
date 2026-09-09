import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { obtenerObligacionesCliente, obtenerPagosCartera, registrarPagoCartera, revertirPagoCartera } from '../services/portfolioApi'
import { obtenerClientes } from '../services/clientsApi'
import { obtenerTenantDesdeUrl } from '../utils/tenant'

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
  const fecha = new Date(typeof value === 'string' && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? `${value}Z` : value)
  return Number.isNaN(fecha.getTime()) ? '—' : new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(fecha)
}

const estadoPagoLabel = (status) => status === 'APLICADO' ? 'Aplicado' : status === 'ANULADO' ? 'Anulado' : status || '—'
const PAYMENT_METHODS = ['TRANSFERENCIA', 'EFECTIVO', 'TARJETA', 'PSE', 'OTRO', 'CARTERA']

export default function PortfolioPaymentsPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const cargaInicialRef = useRef(false)
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
  const [procesandoPagoId, setProcesandoPagoId] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

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
    if (!token || cargaInicialRef.current) return undefined
    cargaInicialRef.current = true
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

  const revertir = async (pago) => {
    if (pago.status !== 'APLICADO' || procesandoPagoId) return
    const confirmado = window.confirm(
      `¿Confirmas anular el pago de ${money(pago.amount)}? Esta acción revertirá su aplicación sobre las obligaciones.`,
    )
    if (!confirmado) return

    try {
      setProcesandoPagoId(pago.id)
      setMensaje(null)
      await revertirPagoCartera(pago.id, token)
      await cargarPagos()
      setMensaje({ tipo: 'success', texto: 'Pago anulado correctamente y sus aplicaciones fueron revertidas.' })
    } catch (error) {
      if (error.status === 401) manejarSesionExpirada()
      else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible anular el pago.' })
    } finally {
      setProcesandoPagoId(null)
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

  const limpiarFiltros = () => {
    setFiltroCliente('')
    setFiltroDesde('')
    setFiltroHasta('')
    setFiltroEstado('')
    if (searchParams.has('payment')) setSearchParams({}, { replace: true })
  }

  const clientePorId = useMemo(
    () => Object.fromEntries(clientes.map((cliente) => [String(cliente.id), nombreCliente(cliente)])),
    [clientes],
  )

  const pagoSeleccionado = searchParams.get('payment')?.trim()
  const estadosPago = ['APLICADO', 'ANULADO']

  const pagosFiltrados = useMemo(() => {
    const paymentId = pagoSeleccionado?.toLowerCase()
    return pagos.filter((pago) => {
      if (paymentId && String(pago.id).toLowerCase() !== paymentId) return false
      if (filtroCliente && String(pago.client_id) !== String(filtroCliente)) return false
      if (filtroDesde && String(pago.payment_date || '').slice(0, 10) < filtroDesde) return false
      if (filtroHasta && String(pago.payment_date || '').slice(0, 10) > filtroHasta) return false
      if (filtroEstado && String(pago.status || '') !== filtroEstado) return false
      return true
    })
  }, [pagos, pagoSeleccionado, filtroCliente, filtroDesde, filtroHasta, filtroEstado])

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <button type="button" className="btn btn-sm btn-link text-decoration-none p-0" onClick={() => navigate('/welcome')}>← Volver</button>
            <h2 className="fw-bold mb-1">Pagos</h2>
          </div>
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
                            {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
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
          <div className="card-body border-bottom">
            <div className="row g-3 align-items-end">
              <div className="col-lg-4">
                <label className="form-label fw-semibold" htmlFor="pagos-filtro-cliente">Cliente</label>
                <select id="pagos-filtro-cliente" className="form-select" value={filtroCliente} onChange={(event) => setFiltroCliente(event.target.value)} disabled={cargando}>
                  <option value="">Todos los clientes</option>
                  {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{nombreCliente(cliente)} — {cliente.identification_number || 'Sin identificación'}</option>)}
                </select>
              </div>
              <div className="col-sm-6 col-lg-2">
                <label className="form-label fw-semibold" htmlFor="pagos-filtro-desde">Desde</label>
                <input id="pagos-filtro-desde" type="date" className="form-control" value={filtroDesde} onChange={(event) => setFiltroDesde(event.target.value)} disabled={cargando} />
              </div>
              <div className="col-sm-6 col-lg-2">
                <label className="form-label fw-semibold" htmlFor="pagos-filtro-hasta">Hasta</label>
                <input id="pagos-filtro-hasta" type="date" className="form-control" value={filtroHasta} onChange={(event) => setFiltroHasta(event.target.value)} disabled={cargando} />
              </div>
              <div className="col-lg-2">
                <label className="form-label fw-semibold" htmlFor="pagos-filtro-estado">Estado</label>
                <select id="pagos-filtro-estado" className="form-select" value={filtroEstado} onChange={(event) => setFiltroEstado(event.target.value)} disabled={cargando}>
                  <option value="">Todos</option>
                  {estadosPago.map((estado) => <option key={estado} value={estado}>{estadoPagoLabel(estado)}</option>)}
                </select>
              </div>
              <div className="col-lg-2 d-flex justify-content-end">
                <button type="button" className="btn btn-outline-secondary" onClick={limpiarFiltros} disabled={cargando || (!filtroCliente && !filtroDesde && !filtroHasta && !filtroEstado && !pagoSeleccionado)}>Limpiar</button>
              </div>
            </div>
            {pagoSeleccionado && <div className="small text-primary mt-3">Mostrando el pago seleccionado desde la obligación. <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={() => setSearchParams({}, { replace: true })}>Mostrar todos</button></div>}
          </div>
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
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando && <tr><td colSpan="8" className="text-center py-5"><div className="spinner-border" /><div className="text-muted mt-2">Consultando pagos...</div></td></tr>}
                {!cargando && !pagosFiltrados.length && <tr><td colSpan="8" className="text-center text-muted py-5">No hay pagos para los filtros seleccionados.</td></tr>}
                {!cargando && pagosFiltrados.map((pago) => (
                  <tr key={pago.id} className={pagoSeleccionado && String(pago.id).toLowerCase() === pagoSeleccionado.toLowerCase() ? 'table-active' : ''}>
                    <td>{formatDate(pago.created_at || pago.payment_date)}</td>
                    <td><div className="fw-semibold">{clientePorId[String(pago.client_id)] || 'Cliente no disponible'}</div></td>
                    <td>{pago.reference || '—'}</td>
                    <td>
                      {pago.allocations?.length
                        ? pago.allocations.map((allocation) => (
                          <button
                            key={allocation.id || allocation.obligation_id}
                            type="button"
                            className="btn btn-link btn-sm p-0 d-block text-decoration-none text-start"
                            onClick={() => {
                              const tenant = obtenerTenantDesdeUrl()
                              if (tenant && allocation.obligation_id) navigate(`/${encodeURIComponent(tenant)}/cartera/obligaciones?obligation=${encodeURIComponent(allocation.obligation_id)}`)
                            }}
                            title="Abrir esta obligación"
                          >
                            {allocation.obligation_id}
                          </button>
                        ))
                        : '—'}
                    </td>
                    <td className="text-end fw-bold">{money(pago.amount)}</td>
                    <td>{pago.payment_method || '—'}</td>
                    <td>
                      <span className={`badge ${pago.status === 'APLICADO' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                        {estadoPagoLabel(pago.status)}
                      </span>
                    </td>
                    <td className="text-end">
                      {pago.status === 'APLICADO' ? (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => void revertir(pago)}
                          disabled={procesandoPagoId !== null}
                        >
                          {procesandoPagoId === pago.id
                            ? <><span className="spinner-border spinner-border-sm me-1" aria-hidden="true" />Anulando...</>
                            : 'Anular'}
                        </button>
                      ) : (
                        <span className="text-muted small">Sin acciones</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
