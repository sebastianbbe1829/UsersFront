import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { obtenerObligaciones, obtenerPagosCartera } from '../services/portfolioApi'
import { obtenerClientes } from '../services/clientsApi'
import { obtenerTenantDesdeUrl } from '../utils/tenant'

const money = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value || 0))
const formatDate = (value) => {
  if (!value) return '—'
  const fecha = new Date(typeof value === 'string' && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? `${value}Z` : value)
  if (Number.isNaN(fecha.getTime())) return '—'
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(fecha)
}
const statusLabel = { ACTIVE: 'Activa', SETTLED: 'Saldada', CANCELLED: 'Cancelada' }
const statusClass = { ACTIVE: 'text-bg-warning', SETTLED: 'text-bg-success', CANCELLED: 'text-bg-secondary' }
const nombreCliente = (cliente) => cliente?.full_name || [cliente?.first_name, cliente?.middle_name, cliente?.last_name, cliente?.second_last_name].filter(Boolean).join(' ') || cliente?.business_name || 'Cliente no disponible'

export default function PortfolioObligationsPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const navigate = useNavigate()
  const cargaInicialRef = useRef(false)
  const [obligaciones, setObligaciones] = useState([])
  const [clientes, setClientes] = useState([])
  const [pagos, setPagos] = useState([])
  const [clientId, setClientId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [cargando, setCargando] = useState(true)
  const [cargandoClientes, setCargandoClientes] = useState(true)
  const [mensaje, setMensaje] = useState(null)

  const cargarClientes = useCallback(async () => {
    setCargandoClientes(true)
    try {
      const pageSize = 100
      const acumulados = []
      let page = 1
      while (true) {
        const resultado = await obtenerClientes(token, { page, pageSize, search: '' })
        const items = Array.isArray(resultado) ? resultado : Array.isArray(resultado?.items) ? resultado.items : []
        acumulados.push(...items)
        if (items.length < pageSize) break
        page += 1
      }
      setClientes(acumulados)
    } finally {
      setCargandoClientes(false)
    }
  }, [token])

  const cargarPagos = useCallback(async () => {
    const resultado = await obtenerPagosCartera(token)
    setPagos(Array.isArray(resultado) ? resultado : [])
  }, [token])

  const cargar = useCallback(async (filtros = {}) => {
    try {
      setMensaje(null)
      const resultado = await obtenerObligaciones(token, filtros)
      setObligaciones(Array.isArray(resultado) ? resultado : [])
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar las obligaciones.' })
    } finally {
      setCargando(false)
    }
  }, [token, manejarSesionExpirada])

  useEffect(() => {
    if (!token || cargaInicialRef.current) return undefined
    cargaInicialRef.current = true
    void Promise.all([cargar(), cargarClientes(), cargarPagos()])
    return undefined
  }, [token, cargar, cargarClientes, cargarPagos])

  const consultarConFiltros = useCallback(async (cliente, desde, hasta) => {
    if (desde && hasta && desde > hasta) {
      setMensaje({ tipo: 'warning', texto: 'La fecha inicial no puede ser posterior a la fecha final.' })
      return
    }
    setCargando(true)
    await cargar({ clientId: cliente || null, dateFrom: desde || null, dateTo: hasta || null })
  }, [cargar])

  const cambiarCliente = async (event) => {
    const value = event.target.value
    setClientId(value)
    await consultarConFiltros(value, dateFrom, dateTo)
  }
  const cambiarFechaDesde = async (event) => {
    const value = event.target.value
    setDateFrom(value)
    await consultarConFiltros(clientId, value, dateTo)
  }
  const cambiarFechaHasta = async (event) => {
    const value = event.target.value
    setDateTo(value)
    await consultarConFiltros(clientId, dateFrom, value)
  }
  const limpiarFiltros = async () => {
    setClientId('')
    setDateFrom('')
    setDateTo('')
    setCargando(true)
    await cargar()
  }

  const clientesOrdenados = useMemo(() => [...clientes].sort((a, b) => nombreCliente(a).toLocaleLowerCase('es-CO').localeCompare(nombreCliente(b).toLocaleLowerCase('es-CO'), 'es-CO')), [clientes])
  const clientePorId = useMemo(() => Object.fromEntries(clientes.map((cliente) => [String(cliente.id), cliente])), [clientes])
  const pagosPorObligacion = useMemo(() => {
    const resultado = {}
    pagos.forEach((pago) => {
      ;(pago.allocations || []).forEach((allocation) => {
        if (!resultado[allocation.obligation_id]) resultado[allocation.obligation_id] = []
        resultado[allocation.obligation_id].push({ pago, allocation })
      })
    })
    return resultado
  }, [pagos])

  const abrirVenta = (item) => {
    const sale = item.sale_number || item.sale_id
    const tenant = obtenerTenantDesdeUrl()
    if (!sale || !tenant) {
      setMensaje({ tipo: 'warning', texto: 'Esta obligación no tiene una venta asociada.' })
      return
    }
    navigate(`/${encodeURIComponent(tenant)}/ventas/consulta?sale=${encodeURIComponent(sale)}`)
  }
  const abrirPago = (paymentId) => {
    const tenant = obtenerTenantDesdeUrl()
    if (!paymentId || !tenant) {
      setMensaje({ tipo: 'warning', texto: 'No fue posible abrir el pago asociado.' })
      return
    }
    navigate(`/${encodeURIComponent(tenant)}/cartera/pagos?payment=${encodeURIComponent(paymentId)}`)
  }

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div><h2 className="fw-bold mb-1">Obligaciones</h2><p className="text-muted mb-0">Consulta y seguimiento de las obligaciones generadas por ventas a crédito.</p></div>
      </div>
      {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}
      <div className="card border-0 shadow-sm mb-4"><div className="card-body"><div className="row g-3 align-items-end">
        <div className="col-lg-5"><label className="form-label fw-semibold" htmlFor="obligaciones-cliente">Cliente</label><select id="obligaciones-cliente" className="form-select" value={clientId} onChange={(event) => void cambiarCliente(event)} disabled={cargandoClientes || cargando}><option value="">{cargandoClientes ? 'Cargando clientes...' : 'Todos los clientes'}</option>{clientesOrdenados.map((cliente) => <option key={cliente.id} value={cliente.id}>{nombreCliente(cliente)} — {cliente.identification_number || 'Sin identificación'}</option>)}</select></div>
        <div className="col-sm-6 col-lg-2"><label className="form-label fw-semibold" htmlFor="obligaciones-desde">Desde</label><input id="obligaciones-desde" type="date" className="form-control" value={dateFrom} onChange={(event) => void cambiarFechaDesde(event)} disabled={cargando} /></div>
        <div className="col-sm-6 col-lg-2"><label className="form-label fw-semibold" htmlFor="obligaciones-hasta">Hasta</label><input id="obligaciones-hasta" type="date" className="form-control" value={dateTo} onChange={(event) => void cambiarFechaHasta(event)} disabled={cargando} /></div>
        <div className="col-lg-3 d-flex justify-content-end"><button type="button" className="btn btn-outline-secondary" onClick={() => void limpiarFiltros()} disabled={cargando || (!clientId && !dateFrom && !dateTo)}>Limpiar</button></div>
      </div><div className="small text-muted mt-3">La consulta se actualiza automáticamente al cambiar cliente o fechas.</div></div></div>

      <div className="card border-0 shadow-sm"><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Cliente</th><th>Venta</th><th>Fecha</th><th className="text-end">Valor inicial</th><th className="text-end">Saldo</th><th>Estado</th><th>Pagos</th></tr></thead><tbody>
        {cargando && <tr><td colSpan="7" className="text-center py-5"><div className="spinner-border" /><div className="text-muted mt-2">Consultando obligaciones...</div></td></tr>}
        {!cargando && !obligaciones.length && <tr><td colSpan="7" className="text-center text-muted py-5">No hay obligaciones para los filtros seleccionados.</td></tr>}
        {!cargando && obligaciones.map((item) => {
          const cliente = clientePorId[String(item.client_id)]
          const pagosAsociados = pagosPorObligacion[item.id] || []
          return <tr key={item.id}>
            <td><div className="fw-semibold">{nombreCliente(cliente)}</div><div className="small text-muted">{cliente?.identification_number || '—'}</div></td>
            <td>{item.sale_number || item.sale_id ? <button type="button" className="btn btn-link btn-sm p-0 fw-semibold text-decoration-none" onClick={() => abrirVenta(item)} title="Abrir esta venta">{item.sale_number || 'Ver venta'}</button> : '—'}</td>
            <td>{formatDate(item.created_at)}</td><td className="text-end">{money(item.initial_amount)}</td><td className="text-end fw-bold">{money(item.balance)}</td>
            <td><span className={`badge ${statusClass[item.status] || 'text-bg-secondary'}`}>{statusLabel[item.status] || item.status}</span></td>
            <td>{pagosAsociados.length ? pagosAsociados.map(({ pago, allocation }) => <button key={allocation.id || `${pago.id}-${allocation.obligation_id}`} type="button" className="btn btn-link btn-sm p-0 d-block text-decoration-none" onClick={() => abrirPago(pago.id)} title="Abrir este pago">{pago.reference || 'Pago'} — {money(allocation.amount)}</button>) : <span className="text-muted">—</span>}</td>
          </tr>
        })}
      </tbody></table></div></div>
    </div>
  )
}
