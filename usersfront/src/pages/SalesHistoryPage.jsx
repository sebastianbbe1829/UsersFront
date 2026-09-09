import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { enviarFacturaPorCorreo, obtenerVentas } from '../services/salesApi'
import { obtenerObligaciones } from '../services/portfolioApi'
import { abrirFactura } from '../utils/salesInvoice'
import { obtenerTenantDesdeUrl } from '../utils/tenant'

const money = (value) => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
}).format(Number(value || 0))

const formatDate = (value) => {
  if (!value) return '—'
  const fecha = new Date(typeof value === 'string' && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? `${value}Z` : value)
  if (Number.isNaN(fecha.getTime())) return '—'
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(fecha)
}

const dateKey = (value) => {
  if (!value) return ''
  const fecha = new Date(typeof value === 'string' && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? `${value}Z` : value)
  if (Number.isNaN(fecha.getTime())) return ''
  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, '0')
  const day = String(fecha.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function SalesHistoryPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [sales, setSales] = useState([])
  const [obligaciones, setObligaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState(() => searchParams.get('sale') || '')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [selectedSale, setSelectedSale] = useState(null)
  const [sendingId, setSendingId] = useState(null)
  const [message, setMessage] = useState(null)

  const loadSales = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const loadedSales = await obtenerVentas(token, { limit: 500, offset: 0 })
      setSales(Array.isArray(loadedSales) ? loadedSales : [])

      try {
        const loadedObligations = await obtenerObligaciones(token)
        setObligaciones(Array.isArray(loadedObligations) ? loadedObligations : [])
      } catch (obligationError) {
        if (obligationError.status === 401) return manejarSesionExpirada()
        setObligaciones([])
      }

      const sale = searchParams.get('sale')?.trim().toLowerCase()
      if (sale) {
        const encontrada = (Array.isArray(loadedSales) ? loadedSales : []).find((item) => String(item.sale_number || '').trim().toLowerCase() === sale)
        if (encontrada) setSelectedSale(encontrada)
      }
    } catch (requestError) {
      if (requestError.status === 401) return manejarSesionExpirada()
      setError(requestError.message || 'No fue posible consultar las ventas.')
    } finally {
      setLoading(false)
    }
  }, [manejarSesionExpirada, searchParams, token])

  useEffect(() => {
    if (!token) return undefined
    const timer = setTimeout(() => void loadSales(), 0)
    return () => clearTimeout(timer)
  }, [loadSales, token])

  const filteredSales = useMemo(() => {
    const term = search.trim().toLowerCase()
    return sales.filter((sale) => {
      const customers = sale.customers?.map((customer) => customer.customer_name).join(' ') || ''
      const matchesSearch = !term || `${sale.sale_number} ${sale.status} ${customers}`.toLowerCase().includes(term)
      const saleDate = dateKey(sale.created_at)
      const matchesDesde = !desde || (saleDate && saleDate >= desde)
      const matchesHasta = !hasta || (saleDate && saleDate <= hasta)
      return matchesSearch && matchesDesde && matchesHasta
    })
  }, [sales, search, desde, hasta])

  const obligacionesPorVenta = useMemo(() => {
    const resultado = {}
    obligaciones.forEach((obligation) => {
      if (!obligation.sale_id) return
      const saleId = String(obligation.sale_id)
      if (!resultado[saleId]) resultado[saleId] = []
      resultado[saleId].push(obligation)
    })
    return resultado
  }, [obligaciones])

  const abrirPago = (paymentId) => {
    const tenant = obtenerTenantDesdeUrl()
    if (!tenant || !paymentId) return
    navigate(`/${encodeURIComponent(tenant)}/cartera/pagos?payment=${encodeURIComponent(paymentId)}`)
  }

  const abrirObligacion = (obligationId) => {
    const tenant = obtenerTenantDesdeUrl()
    if (!tenant || !obligationId) return
    navigate(`/${encodeURIComponent(tenant)}/cartera/obligaciones?obligation=${encodeURIComponent(obligationId)}`)
  }

  const limpiarFiltros = () => {
    setSearch('')
    setDesde('')
    setHasta('')
  }

  const printSale = (sale) => {
    try {
      abrirFactura(sale)
    } catch (requestError) {
      setMessage({ type: 'warning', text: requestError.message })
    }
  }

  const emailSale = async (sale) => {
    setSendingId(sale.id)
    setMessage(null)
    try {
      const result = await enviarFacturaPorCorreo(sale.id, token)
      setMessage({ type: 'success', text: `Factura ${sale.sale_number} enviada a ${result.recipients.join(', ')}.` })
    } catch (requestError) {
      if (requestError.status === 401) return manejarSesionExpirada()
      setMessage({ type: requestError.status === 503 ? 'warning' : 'danger', text: requestError.message || 'No fue posible enviar la factura.' })
    } finally {
      setSendingId(null)
    }
  }

  return <div>
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="btn btn-sm btn-link text-decoration-none p-0" onClick={() => navigate('/welcome')}>← Volver</button>
          <h2 className="fw-bold mb-1">📋 Consulta de ventas</h2>
        </div>
        <p className="text-muted mb-0">Consulta el historial, revisa el detalle y gestiona la factura.</p>
      </div>
      <button type="button" className="btn btn-outline-secondary" onClick={() => void loadSales()} disabled={loading}>↻ Actualizar</button>
    </div>

    {message && <div className={`alert alert-${message.type}`} role="alert">{message.text}</div>}
    {error && <div className="alert alert-danger" role="alert">{error}</div>}

    <div className="card shadow-sm border-0 mb-4">
      <div className="card-body">
        <div className="row g-3 align-items-end">
          <div className="col-lg-6">
            <label className="form-label fw-semibold" htmlFor="ventas-busqueda">Buscar</label>
            <div className="input-group">
              <span className="input-group-text">🔎</span>
              <input id="ventas-busqueda" className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Número, estado o cliente..." />
            </div>
          </div>
          <div className="col-sm-6 col-lg-2">
            <label className="form-label fw-semibold" htmlFor="ventas-desde">Desde</label>
            <input id="ventas-desde" type="date" className="form-control" value={desde} onChange={(event) => setDesde(event.target.value)} />
          </div>
          <div className="col-sm-6 col-lg-2">
            <label className="form-label fw-semibold" htmlFor="ventas-hasta">Hasta</label>
            <input id="ventas-hasta" type="date" className="form-control" value={hasta} onChange={(event) => setHasta(event.target.value)} />
          </div>
          <div className="col-lg-2 d-flex justify-content-end">
            <button type="button" className="btn btn-outline-secondary" onClick={limpiarFiltros} disabled={!search && !desde && !hasta}>Limpiar</button>
          </div>
        </div>
      </div>
    </div>

    <div className="card shadow-sm border-0">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead><tr><th>Venta</th><th>Fecha</th><th>Cliente(s)</th><th>Total</th><th>Estado</th><th>Pagos</th><th>Obligaciones</th><th className="text-end">Acciones</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="8" className="text-center py-5"><div className="spinner-border" /><div className="text-muted mt-2">Consultando ventas...</div></td></tr>}
            {!loading && !filteredSales.length && <tr><td colSpan="8" className="text-center text-muted py-5">No encontramos ventas para los filtros seleccionados.</td></tr>}
            {!loading && filteredSales.map((sale) => {
              const saleObligations = obligacionesPorVenta[String(sale.id)] || []
              return <tr key={sale.id}>
                <td><strong>{sale.sale_number}</strong></td>
                <td>{formatDate(sale.created_at)}</td>
                <td>{sale.customers?.map((customer) => customer.customer_name).join(', ') || 'Consumidor final'}</td>
                <td className="fw-bold">{money(sale.total)}</td>
                <td><span className="badge text-bg-success">{sale.status}</span></td>
                <td>
                  {sale.payments?.length
                    ? sale.payments.map((payment) => <button key={payment.id} type="button" className="btn btn-link btn-sm p-0 d-block text-decoration-none text-start" onClick={() => abrirPago(payment.id)} title="Abrir este pago">{payment.payment_method} — {money(payment.amount)}</button>)
                    : <span className="text-muted">—</span>}
                </td>
                <td>
                  {saleObligations.length
                    ? saleObligations.map((obligation) => <button key={obligation.id} type="button" className="btn btn-link btn-sm p-0 d-block text-decoration-none text-start" onClick={() => abrirObligacion(obligation.id)} title="Abrir esta obligación">{obligation.sale_number || 'Obligación'} — {money(obligation.balance)}</button>)
                    : <span className="text-muted">—</span>}
                </td>
                <td><div className="d-flex justify-content-end gap-2 flex-wrap">
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setSelectedSale(sale)}>👁️ Ver</button>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => printSale(sale)}>🖨️ Imprimir</button>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => void emailSale(sale)} disabled={sendingId === sale.id}>{sendingId === sale.id ? 'Enviando...' : '✉️ Enviar'}</button>
                </div></td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
    </div>

    {selectedSale && <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,.45)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
        <div className="modal-content">
          <div className="modal-header"><h5 className="modal-title">🧾 Venta {selectedSale.sale_number}</h5><button type="button" className="btn-close" onClick={() => setSelectedSale(null)} aria-label="Cerrar" /></div>
          <div className="modal-body">
            <div className="row g-3 mb-4"><div className="col-md-6"><strong>Fecha:</strong> {formatDate(selectedSale.created_at)}</div><div className="col-md-6"><strong>Estado:</strong> {selectedSale.status}</div></div>
            <div className="table-responsive"><table className="table table-sm"><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Total</th></tr></thead><tbody>{selectedSale.items?.map((item) => <tr key={item.id}><td>{item.product_name}</td><td>{item.quantity}</td><td>{money(item.unit_price)}</td><td>{money(item.line_total)}</td></tr>)}</tbody></table></div>
            <div className="row g-4 mt-2">
              <div className="col-md-6"><h6>Cliente(s)</h6><ul>{selectedSale.customers?.map((customer) => <li key={customer.id}>{customer.customer_name} — {customer.allocation_percentage}% — {money(customer.allocation_amount)}</li>)}</ul></div>
              <div className="col-md-6"><h6>Pagos</h6>{selectedSale.payments?.length ? <ul>{selectedSale.payments.map((payment) => <li key={payment.id}><button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => abrirPago(payment.id)}>{payment.payment_method} — {money(payment.amount)}</button></li>)}</ul> : <div className="text-muted">Sin pagos registrados.</div>}</div>
              <div className="col-12"><h6>Obligaciones</h6>{(obligacionesPorVenta[String(selectedSale.id)] || []).length ? <ul>{(obligacionesPorVenta[String(selectedSale.id)] || []).map((obligation) => <li key={obligation.id}><button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => abrirObligacion(obligation.id)}>{obligation.sale_number || 'Obligación'} — saldo {money(obligation.balance)}</button></li>)}</ul> : <div className="text-muted">Sin obligaciones asociadas.</div>}</div>
            </div>
            <div className="text-end mt-3"><div>Subtotal: {money(selectedSale.subtotal)}</div><div>Descuento: {money(selectedSale.discount_amount)}</div><div className="fs-5 fw-bold">Total: {money(selectedSale.total)}</div></div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => printSale(selectedSale)}>🖨️ Imprimir factura</button><button type="button" className="btn btn-primary" onClick={() => void emailSale(selectedSale)} disabled={sendingId === selectedSale.id}>{sendingId === selectedSale.id ? 'Enviando...' : '✉️ Enviar factura'}</button><button type="button" className="btn btn-secondary" onClick={() => setSelectedSale(null)}>Cerrar</button></div>
        </div>
      </div>
    </div>}
  </div>
}

export default SalesHistoryPage
