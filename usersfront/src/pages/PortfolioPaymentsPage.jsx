import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  obtenerObligacionesCliente,
  obtenerPagosCartera,
  registrarPagoCartera,
} from '../services/portfolioApi'
import { obtenerClientes } from '../services/clientsApi'

const money = (value) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(Number(value || 0))

const fechaHoy = () => new Date().toISOString().slice(0, 10)
const nuevoFormulario = () => ({ client_id: '', payment_date: fechaHoy(), payment_method: 'TRANSFERENCIA', amount: '', reference: '', notes: '' })

const nombreCliente = (cliente) => cliente?.full_name || [
  cliente?.first_name,
  cliente?.middle_name,
  cliente?.last_name,
  cliente?.second_last_name,
].filter(Boolean).join(' ') || cliente?.business_name || 'Cliente sin nombre'

export default function PortfolioPaymentsPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [clientes, setClientes] = useState([])
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [obligaciones, setObligaciones] = useState([])
  const [pagos, setPagos] = useState([])
  const [formulario, setFormulario] = useState(nuevoFormulario)
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
    Promise.all([cargarPagos(), cargarClientes()])
      .catch((error) => {
        if (error.status === 401) manejarSesionExpirada()
        else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar los pagos.' })
      })
      .finally(() => setCargando(false))
    return undefined
  }, [token, cargarPagos, cargarClientes, manejarSesionExpirada])

  const clientesFiltrados = useMemo(() => {
    const termino = busquedaCliente.trim().toLowerCase()
    if (!termino) return clientes.slice(0, 8)
    return clientes.filter((cliente) => {
      const texto = `${nombreCliente(cliente)} ${cliente.identification_number || ''}`.toLowerCase()
      return texto.includes(termino)
    }).slice(0, 8)
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
    setFormulario((actual) => ({ ...actual, client_id: cliente.id, amount: '' }))
    await cargarObligaciones(cliente.id)
  }

  const cambiarObligacion = (index, obligationId) => {
    const obligation = obligaciones.find((item) => item.id === obligationId)
    setAsignaciones((actuales) => actuales.map((item, itemIndex) => (
      itemIndex === index
        ? { ...item, obligation_id: obligationId, amount: obligation ? String(obligation.balance) : '' }
        : item
    )))
  }

  const agregarAsignacion = () => {
    const usada = new Set(asignaciones.map((item) => item.obligation_id))
    const siguiente = obligaciones.find((item) => !usada.has(item.id))
    if (!siguiente) return
    setAsignaciones((actuales) => [...actuales, { obligation_id: siguiente.id, amount: '0' }])
  }

  const actualizarAsignacion = (index, amount) => {
    setAsignaciones((actuales) => actuales.map((item, itemIndex) => itemIndex === index ? { ...item, amount } : item))
    if (asignaciones.length === 1) {
      setFormulario((actual) => ({ ...actual, amount }))
    }
  }

  const eliminarAsignacion = (index) => {
    setAsignaciones((actuales) => actuales.filter((_, itemIndex) => itemIndex !== index))
  }

  const totalAsignado = useMemo(
    () => asignaciones.reduce((total, item) => total + Number(item.amount || 0), 0),
    [asignaciones],
  )

  const seleccionarPrimeraObligacion = (event) => {
    const obligationId = event.target.value
    if (!obligationId) {
      setAsignaciones([])
      setFormulario((actual) => ({ ...actual, amount: '' }))
      return
    }
    const obligation = obligaciones.find((item) => item.id === obligationId)
    setAsignaciones([{ obligation_id: obligationId, amount: String(obligation?.balance || '') }])
    setFormulario((actual) => ({ ...actual, amount: String(obligation?.balance || '') }))
  }

  const guardar = async (event) => {
    event.preventDefault()
    const amount = Number(formulario.amount)
    if (!clienteSeleccionado || !Number.isFinite(amount) || amount <= 0) {
      setMensaje({ tipo: 'warning', texto: 'Selecciona un cliente y una obligación, e ingresa un valor válido.' })
      return
    }

    const allocations = asignaciones.filter((item) => Number(item.amount) > 0).map((item) => ({
      obligation_id: item.obligation_id,
      amount: Number(item.amount),
    }))
    if (!allocations.length || Math.abs(totalAsignado - amount) > 0.001) {
      setMensaje({ tipo: 'warning', texto: 'La suma de los abonos debe ser igual al valor del pago.' })
      return
    }

    try {
      setGuardando(true)
      setMensaje(null)
      await registrarPagoCartera({
        client_id: formulario.client_id,
        payment_date: formulario.payment_date || undefined,
        payment_method: formulario.payment_method,
        amount,
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

  const clienteNombre = Object.fromEntries(clientes.map((cliente) => [cliente.id, nombreCliente(cliente)]))

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold mb-1">Pagos</h2>
          <p className="text-muted mb-0">Consulta los pagos registrados y registra nuevos abonos.</p>
        </div>
        {!mostrarFormulario && <button type="button" className="btn btn-primary" onClick={() => { setMostrarFormulario(true); setMensaje(null) }}>+ Registrar pago</button>}
      </div>

      {mensaje && <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}

      {mostrarFormulario && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div><h5 className="mb-1">Registrar pago</h5><div className="text-muted small">Selecciona primero el cliente y luego la obligación a la que aplicarás el pago.</div></div>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={cancelarRegistro}>Cancelar</button>
            </div>

            <form onSubmit={guardar}>
              <div className="mb-4 position-relative">
                <label className="form-label fw-semibold" htmlFor="pago-cliente">Cliente</label>
                <input
                  id="pago-cliente"
                  className="form-control"
                  value={busquedaCliente}
                  onChange={(event) => { setBusquedaCliente(event.target.value); if (clienteSeleccionado && event.target.value !== nombreCliente(clienteSeleccionado)) setClienteSeleccionado(null) }}
                  placeholder="Digita nombre o identificación..."
                  autoComplete="off"
                  required={!clienteSeleccionado}
                />
                {busquedaCliente.trim() && !clienteSeleccionado && (
                  <div className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 10 }}>
                    {clientesFiltrados.map((cliente) => (
                      <button key={cliente.id} type="button" className="list-group-item list-group-item-action text-start" onClick={() => void seleccionarCliente(cliente)}>
                        <div className="fw-semibold">{nombreCliente(cliente)}</div>
                        <div className="small text-muted">{cliente.identification_number || 'Sin identificación'}</div>
                      </button>
                    ))}
                    {!clientesFiltrados.length && <div className="list-group-item text-muted">No se encontraron clientes.</div>}
                  </div>
                )}
                {clienteSeleccionado && <div className="small text-success mt-1">Cliente seleccionado: {nombreCliente(clienteSeleccionado)} — {clienteSeleccionado.identification_number || 'Sin identificación'}</div>}
              </div>

              {clienteSeleccionado && (
                <>
                  <div className="card bg-body-tertiary border mb-4">
                    <div className="card-body">
                      <label className="form-label fw-semibold" htmlFor="pago-obligacion">Obligación / Referencia</label>
                      {cargandoObligaciones ? <div className="text-muted">Cargando obligaciones...</div> : obligaciones.length ? (
                        <select id="pago-obligacion" className="form-select" value={asignaciones.length === 1 ? asignaciones[0].obligation_id : ''} onChange={seleccionarPrimeraObligacion} required>
                          <option value="">Selecciona una obligación...</option>
                          {obligaciones.map((item) => <option key={item.id} value={item.id}>{item.sale_number || item.id} — saldo {money(item.balance)}</option>)}
                        </select>
                      ) : <div className="text-muted">El cliente no tiene obligaciones activas con saldo pendiente.</div>}
                      {asignaciones.length === 1 && (() => {
                        const obligation = obligaciones.find((item) => item.id === asignaciones[0].obligation_id)
                        return obligation ? <div className="mt-3 p-3 rounded border bg-white"><div className="small text-muted">Saldo pendiente</div><div className="fs-5 fw-bold">{money(obligation.balance)}</div></div> : null
                      })()}
                    </div>
                  </div>

                  {asignaciones.length > 0 && (
                    <div className="mb-4">
                      <div className="row g-3 align-items-end">
                        <div className="col-md-5">
                          <label className="form-label fw-semibold">Valor del pago</label>
                          <input className="form-control" type="number" min="0.01" step="0.01" max={asignaciones.length === 1 ? obligaciones.find((item) => item.id === asignaciones[0].obligation_id)?.balance || undefined : undefined} value={formulario.amount} onChange={(event) => setFormulario((actual) => ({ ...actual, amount: event.target.value }))} required />
                          <div className="form-text">Se propone el saldo total, pero puedes registrar un valor menor.</div>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">Fecha</label>
                          <input className="form-control" type="date" value={formulario.payment_date} onChange={(event) => setFormulario((actual) => ({ ...actual, payment_date: event.target.value }))} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Medio de pago</label>
                          <select className="form-select" value={formulario.payment_method} onChange={(event) => setFormulario((actual) => ({ ...actual, payment_method: event.target.value }))}><option>TRANSFERENCIA</option><option>EFECTIVO</option><option>TARJETA</option><option>OTRO</option></select>
                        </div>
                      </div>
                    </div>
                  )}

                  {asignaciones.length > 1 && (
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2"><span className="fw-semibold">Distribución del pago</span><button type="button" className="btn btn-outline-primary btn-sm" onClick={agregarAsignacion}>Agregar obligación</button></div>
                      {asignaciones.map((asignacion, index) => {
                        const obligation = obligaciones.find((item) => item.id === asignacion.obligation_id)
                        return <div className="row g-2 mb-2" key={`${asignacion.obligation_id}-${index}`}><div className="col-md-7"><select className="form-select" value={asignacion.obligation_id} onChange={(event) => cambiarObligacion(index, event.target.value)}>{obligaciones.map((item) => <option key={item.id} value={item.id}>{item.sale_number || item.id} — saldo {money(item.balance)}</option>)}</select></div><div className="col-md-4"><input className="form-control" type="number" min="0.01" step="0.01" max={obligation?.balance || undefined} value={asignacion.amount} onChange={(event) => actualizarAsignacion(index, event.target.value)} /></div><div className="col-md-1"><button type="button" className="btn btn-outline-danger" onClick={() => eliminarAsignacion(index)}>×</button></div></div>
                      })}
                      <div className="text-end small text-muted">Total asignado: <strong>{money(totalAsignado)}</strong></div>
                    </div>
                  )}

                  <div className="row g-3 mb-4">
                    <div className="col-md-6"><label className="form-label fw-semibold">Referencia del pago</label><input className="form-control" maxLength="100" value={formulario.reference} onChange={(event) => setFormulario((actual) => ({ ...actual, reference: event.target.value }))} placeholder="Ej. comprobante, consignación..." /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold">Notas</label><input className="form-control" maxLength="500" value={formulario.notes} onChange={(event) => setFormulario((actual) => ({ ...actual, notes: event.target.value }))} /></div>
                  </div>

                  <div className="text-end"><button className="btn btn-primary" type="submit" disabled={guardando || cargandoObligaciones || !asignaciones.length}>{guardando ? 'Registrando...' : 'Registrar pago'}</button></div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {cargando ? <div className="text-center py-5"><div className="spinner-border" /></div> : <div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Fecha</th><th>Cliente</th><th>Medio</th><th className="text-end">Valor</th><th>Referencia</th></tr></thead><tbody>{pagos.map((pago) => <tr key={pago.id}><td>{pago.payment_date}</td><td>{clienteNombre[pago.client_id] || pago.client_id}</td><td>{pago.payment_method}</td><td className="text-end fw-semibold">{money(pago.amount)}</td><td>{pago.reference || '—'}</td></tr>)}</tbody></table>{!pagos.length && <div className="text-center text-muted py-5">No hay pagos registrados.</div>}</div>}
        </div>
      </div>
    </div>
  )
}
