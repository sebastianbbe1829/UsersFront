import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { enviarFacturaPorCorreo, obtenerVentas } from '../services/salesApi'
import { abrirFactura } from '../utils/salesInvoice'

const money = (value) => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
}).format(Number(value || 0))

const formatDate = (value) => {
  if (!value) return '—'

  // El backend entrega created_at sin offset, pero el valor corresponde a UTC.
  // Agregamos Z para que el navegador lo convierta correctamente a la hora local
  // del usuario (Colombia: UTC-5).
  const fecha = new Date(typeof value === 'string' && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? `${value}Z` : value)
  if (Number.isNaN(fecha.getTime())) return '—'

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(fecha)
}

function SalesHistoryPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedSale, setSelectedSale] = useState(null)
  const [sendingId, setSendingId] = useState(null)
  const [message, setMessage] = useState(null)

  const loadSales = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await obtenerVentas(token, { limit: 500, offset: 0 })
      setSales(Array.isArray(result) ? result : [])
    } catch (requestError) {
      if (requestError.status === 401) return manejarSesionExpirada()
      setError(requestError.message || 'No fue posible consultar las ventas.')
    } finally {
      setLoading(false)
    }
  }, [manejarSesionExpirada, token])

  useEffect(() => {
    if (!token) return undefined
    const timer = setTimeout(() => void loadSales(), 0)
    return () => clearTimeout(timer)
  }, [loadSales, token])

  const filteredSales = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return sales
    return sales.filter((sale) => {
      const customers = sale.customers?.map((customer) => customer.customer_name).join(' ') || ''
      return `${sale.sale_number} ${sale.status} ${customers}`.toLowerCase().includes(term)
    })
  }, [sales, search])

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
        <h2 className="fw-bold mb-1">📋 Consulta de ventas</h2>
        <p className="text-muted mb-0">Consulta el historial, revisa el detalle y gestiona la factura.</p>
      </div>
      <button type="button" className="btn btn-outline-secondary" onClick={() => void loadSales()} disabled={loading}>↻ Actualizar</button>
    </div>

    {message && <div className={`alert alert-${message.type}`} role="alert">{message.text}</div>}
    {error && <div className="alert alert-danger" role="alert">{error}</div>}

    <div className="card shadow-sm border-0 mb-4">
      <div className="card-body">
        <div className="input-group input-group-lg">
          <span className="input-group-text">🔎</span>
          <input className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por número, estado o cliente..." />
        </div>
      </div>
    </div>

    <div className="card shadow-sm border-0">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead><tr><th>Venta</th><th>Fecha</th><th>Cliente(s)</th><th>Total</th><th>Estado</th><th className="text-end">Acciones</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="6" className="text-center py-5"><div className="spinner-border" /><div className="text-muted mt-2">Consultando ventas...</div></td></tr>}
            {!loading && !filteredSales.length && <tr><td colSpan="6" className="text-center text-muted py-5">No encontramos ventas.</td></tr>}
            {!loading && filteredSales.map((sale) => <tr key={sale.id}>
              <td><strong>{sale.sale_number}</strong></td>
              <td>{formatDate(sale.created_at)}</td>
              <td>{sale.customers?.map((customer) => customer.customer_name).join(', ') || 'Consumidor final'}</td>
              <td className="fw-bold">{money(sale.total)}</td>
              <td><span className="badge text-bg-success">{sale.status}</span></td>
              <td><div className="d-flex justify-content-end gap-2 flex-wrap">
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setSelectedSale(sale)}>👁️ Ver</button>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => printSale(sale)}>🖨️ Imprimir</button>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => void emailSale(sale)} disabled={sendingId === sale.id}>{sendingId === sale.id ? 'Enviando...' : '✉️ Enviar'}</button>
              </div></td>
            </tr>)}
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
            <div className="row g-4 mt-2"><div className="col-md-6"><h6>Cliente(s)</h6><ul>{selectedSale.customers?.map((customer) => <li key={customer.id}>{customer.customer_name} — {customer.allocation_percentage}% — {money(customer.allocation_amount)}</li>)}</ul></div><div className="col-md-6"><h6>Pagos</h6><ul>{selectedSale.payments?.map((payment) => <li key={payment.id}>{payment.payment_method} — {money(payment.amount)}</li>)}</ul></div></div>
            <div className="text-end mt-3"><div>Subtotal: {money(selectedSale.subtotal)}</div><div>Descuento: {money(selectedSale.discount_amount)}</div><div className="fs-5 fw-bold">Total: {money(selectedSale.total)}</div></div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => printSale(selectedSale)}>🖨️ Imprimir factura</button><button type="button" className="btn btn-primary" onClick={() => void emailSale(selectedSale)} disabled={sendingId === selectedSale.id}>{sendingId === selectedSale.id ? 'Enviando...' : '✉️ Enviar factura'}</button><button type="button" className="btn btn-secondary" onClick={() => setSelectedSale(null)}>Cerrar</button></div>
        </div>
      </div>
    </div>}
  </div>
}

export default SalesHistoryPage
