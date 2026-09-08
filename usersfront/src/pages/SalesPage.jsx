import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { obtenerClientes } from '../services/clientsApi'
import { obtenerInventario, obtenerProductosInventario } from '../services/inventoryApi'
import { crearVenta } from '../services/salesApi'

const money = (value) => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
}).format(Number(value || 0))

const PAYMENT_METHODS = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'PSE', 'OTRO']

function SalesPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [products, setProducts] = useState([])
  const [inventory, setInventory] = useState([])
  const [clients, setClients] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [customerMode, setCustomerMode] = useState('generic')
  const [participants, setParticipants] = useState([])
  const [discount, setDiscount] = useState('0')
  const [payments, setPayments] = useState([{ method: 'EFECTIVO', amount: '' }])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const [productsResult, inventoryResult, clientsResult] = await Promise.all([
        obtenerProductosInventario(token, true),
        obtenerInventario(token),
        obtenerClientes(token, { page: 1, pageSize: 100 }),
      ])
      setProducts(Array.isArray(productsResult) ? productsResult : [])
      setInventory(Array.isArray(inventoryResult) ? inventoryResult : [])
      setClients(Array.isArray(clientsResult?.items) ? clientsResult.items : Array.isArray(clientsResult) ? clientsResult : [])
      setMessage(null)
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMessage({ type: 'danger', text: error.message || 'No fue posible cargar el punto de venta.' })
    } finally {
      setLoading(false)
    }
  }, [manejarSesionExpirada, token])

  useEffect(() => { void load() }, [load])

  const inventoryByProduct = useMemo(
    () => new Map(inventory.map((item) => [item.product_id, item])),
    [inventory],
  )

  const productCards = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products.filter((product) => {
      if (!term) return true
      return `${product.code || ''} ${product.name || ''}`.toLowerCase().includes(term)
    })
  }, [products, search])

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0),
    [cart],
  )
  const discountValue = Math.min(100, Math.max(0, Number(discount) || 0))
  const discountAmount = subtotal * discountValue / 100
  const total = subtotal - discountAmount
  const paymentTotal = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
  const paymentDifference = total - paymentTotal
  const paymentComplete = Math.abs(paymentDifference) <= 0.01
  const allocatedPercentage = participants.reduce((sum, item) => sum + Number(item.percentage), 0)
  const remainingPercentage = Math.max(0, 100 - allocatedPercentage)

  const addProduct = (product) => {
    const stock = Number(inventoryByProduct.get(product.id)?.quantity || 0)
    if (stock <= 0) return
    setCart((current) => {
      const found = current.find((item) => item.product.id === product.id)
      if (!found) return [...current, {
        product,
        quantity: 1,
        price: Number(inventoryByProduct.get(product.id)?.sale_price || 0),
      }]
      if (Number(found.quantity) >= stock) return current
      return current.map((item) => item.product.id === product.id
        ? { ...item, quantity: item.quantity + 1 }
        : item)
    })
  }

  const changeQuantity = (productId, delta) => {
    setCart((current) => current
      .map((item) => {
        if (item.product.id !== productId) return item
        const max = Number(inventoryByProduct.get(productId)?.quantity || 0)
        return { ...item, quantity: Math.min(max, Math.max(0, item.quantity + delta)) }
      })
      .filter((item) => item.quantity > 0))
  }

  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLowerCase()
    const available = clients.filter((client) => !participants.some((item) => item.id === client.id))
    if (!term) return available.slice(0, 8)
    return available.filter((client) => `${client.full_name || ''} ${client.identification_number || ''}`.toLowerCase().includes(term)).slice(0, 8)
  }, [clientSearch, clients, participants])

  const addParticipant = (client) => {
    if (customerMode === 'split' && remainingPercentage <= 0) return
    if (customerMode === 'client' && participants.length >= 1) return
    setParticipants((current) => [...current, { ...client, percentage: remainingPercentage || 0 }])
    setClientSearch('')
  }

  const removeParticipant = (clientId) => {
    setParticipants((current) => current.filter((item) => item.id !== clientId))
  }

  const changeParticipantPercentage = (clientId, value) => {
    setParticipants((current) => current.map((item) => item.id === clientId ? { ...item, percentage: value } : item))
  }

  const addPayment = () => {
    const remaining = Math.max(0, total - paymentTotal)
    setPayments((current) => [...current, { method: 'EFECTIVO', amount: remaining > 0 ? String(remaining) : '' }])
  }

  const removePayment = (index) => {
    setPayments((current) => current.filter((_, paymentIndex) => paymentIndex !== index))
  }

  const changePayment = (index, field, value) => {
    setPayments((current) => current.map((payment, paymentIndex) => (
      paymentIndex === index ? { ...payment, [field]: value } : payment
    )))
  }

  const resetSale = () => {
    setCart([])
    setCustomerMode('generic')
    setParticipants([])
    setClientSearch('')
    setDiscount('0')
    setPayments([{ method: 'EFECTIVO', amount: '' }])
  }

  const submit = async () => {
    if (!cart.length) {
      setMessage({ type: 'warning', text: 'Agrega al menos un producto a la venta.' })
      return
    }
    if (customerMode === 'split' && (participants.length < 2 || Math.abs(allocatedPercentage - 100) > 0.01)) {
      setMessage({ type: 'warning', text: 'Para dividir la venta agrega al menos dos clientes y distribuye exactamente el 100 %.' })
      return
    }
    if (customerMode === 'client' && participants.length !== 1) {
      setMessage({ type: 'warning', text: 'Selecciona un cliente registrado.' })
      return
    }
    if (!paymentComplete) {
      setMessage({ type: 'warning', text: paymentDifference > 0 ? 'Aún falta completar el pago de la venta.' : 'El pago supera el total de la venta.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const customers = customerMode === 'generic'
        ? [{ allocation_percentage: 100, is_generic: true }]
        : participants.map((item) => ({
          client_id: item.id,
          allocation_percentage: Number(item.percentage),
          is_generic: false,
        }))
      const sale = await crearVenta({
        items: cart.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
        customers,
        payments: payments.map((payment) => ({
          payment_method: payment.method,
          amount: Number(payment.amount),
        })),
        discount_percentage: discountValue,
      }, token)
      setMessage({ type: 'success', text: `Venta ${sale.sale_number} realizada correctamente por ${money(sale.total)}.` })
      resetSale()
      await load()
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMessage({ type: 'danger', text: error.message || 'No fue posible registrar la venta.' })
    } finally {
      setSaving(false)
    }
  }

  return <>
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <h2 className="fw-bold mb-1">🛒 Punto de venta</h2>
        <p className="text-muted mb-0">Selecciona productos, cliente, descuento y forma de pago en una sola pantalla.</p>
      </div>
      <button type="button" className="btn btn-outline-secondary" onClick={resetSale} disabled={saving}>Nueva venta</button>
    </div>

    {message && <div className={`alert alert-${message.type}`} role="alert">{message.text}</div>}

    {loading ? <div className="text-center py-5"><div className="spinner-border" /><div className="text-muted mt-2">Preparando punto de venta...</div></div> : (
      <div className="row g-4">
        <div className="col-xl-8">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="input-group input-group-lg">
                <span className="input-group-text">🔎</span>
                <input className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre o código..." />
              </div>
            </div>
          </div>

          <div className="row g-3">
            {productCards.map((product) => {
              const stock = Number(inventoryByProduct.get(product.id)?.quantity || 0)
              const price = Number(inventoryByProduct.get(product.id)?.sale_price || 0)
              return <div className="col-sm-6 col-lg-4" key={product.id}>
                <button type="button" className="card h-100 w-100 text-start border-0 shadow-sm" onClick={() => addProduct(product)} disabled={stock <= 0}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between gap-2 mb-3"><span className="fs-2">📦</span><span className={stock > 0 ? 'badge text-bg-success align-self-start' : 'badge text-bg-secondary align-self-start'}>{stock > 0 ? `${stock} disponibles` : 'Sin stock'}</span></div>
                    <div className="fw-bold">{product.name}</div>
                    <small className="text-muted">{product.code}</small>
                    <div className="mt-3 fw-bold fs-5">{money(price)}</div>
                  </div>
                </button>
              </div>
            })}
            {!productCards.length && <div className="col-12"><div className="alert alert-light border">No encontramos productos con esa búsqueda.</div></div>}
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card shadow-sm border-0 position-sticky" style={{ top: '20px' }}>
            <div className="card-header bg-white fw-bold fs-5">🧾 Tu venta</div>
            <div className="card-body">
              {!cart.length && <div className="text-center text-muted py-4">Tu carrito está vacío.<br />Selecciona productos para comenzar.</div>}
              {cart.map((item) => <div key={item.product.id} className="border-bottom py-3">
                <div className="fw-semibold">{item.product.name}</div>
                <div className="small text-muted mb-2">{money(item.price)} c/u</div>
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <div className="btn-group"><button className="btn btn-outline-secondary btn-sm" onClick={() => changeQuantity(item.product.id, -1)}>−</button><span className="btn btn-light btn-sm disabled">{item.quantity}</span><button className="btn btn-outline-secondary btn-sm" onClick={() => changeQuantity(item.product.id, 1)}>+</button></div>
                  <strong>{money(item.price * item.quantity)}</strong>
                </div>
              </div>)}

              <hr />
              <div className="mb-3">
                <label className="form-label fw-semibold">👥 Cliente(s) de la venta</label>
                <div className="btn-group w-100 mb-2">
                  <button className={`btn ${customerMode === 'generic' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setCustomerMode('generic')}>Consumidor final</button>
                  <button className={`btn ${customerMode === 'client' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setCustomerMode('client')}>Un cliente</button>
                  <button className={`btn ${customerMode === 'split' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setCustomerMode('split')}>Dividir</button>
                </div>
                {customerMode !== 'generic' && <>
                  <input className="form-control mb-2" value={clientSearch} onChange={(event) => setClientSearch(event.target.value)} placeholder="Buscar cliente..." />
                  {customerMode === 'split' && <div className="small text-muted mb-2">Agrega clientes y asigna el porcentaje que corresponde a cada uno.</div>}
                  <div className="list-group mb-2">
                    {filteredClients.map((client) => <button type="button" key={client.id} className="list-group-item list-group-item-action" onClick={() => addParticipant(client)}>{client.full_name}</button>)}
                  </div>
                  {participants.map((participant) => <div className="border rounded p-2 mb-2" key={participant.id}>
                    <div className="d-flex justify-content-between align-items-center gap-2">
                      <strong className="small">{participant.full_name}</strong>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeParticipant(participant.id)}>×</button>
                    </div>
                    <div className="input-group input-group-sm mt-2">
                      <input type="number" min="0.01" max="100" step="0.01" className="form-control" value={participant.percentage} onChange={(event) => changeParticipantPercentage(participant.id, event.target.value)} />
                      <span className="input-group-text">%</span>
                    </div>
                    <div className="small text-muted mt-1">{money(total * Number(participant.percentage) / 100)}</div>
                  </div>)}
                  {customerMode === 'split' && <div className={`alert py-2 mb-0 ${Math.abs(allocatedPercentage - 100) < 0.01 ? 'alert-success' : 'alert-warning'}`}>
                    {Math.abs(allocatedPercentage - 100) < 0.01 ? '✓ Venta distribuida al 100 %' : `Faltan ${remainingPercentage.toFixed(2)} % por distribuir`}
                  </div>}
                </>}
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">🏷️ Descuento (%)</label>
                <input type="number" min="0" max="100" step="0.01" className="form-control" value={discount} onChange={(event) => setDiscount(event.target.value)} />
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label fw-semibold mb-0">💳 Métodos de pago</label>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={addPayment} disabled={saving}>+ Agregar pago</button>
                </div>
                {payments.map((payment, index) => <div className="border rounded p-2 mb-2" key={`payment-${index}`}>
                  <div className="d-flex align-items-center gap-2">
                    <select className="form-select" value={payment.method} onChange={(event) => changePayment(index, 'method', event.target.value)}>
                      {PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}
                    </select>
                    <input type="number" min="0" step="0.01" className="form-control" value={payment.amount} onChange={(event) => changePayment(index, 'amount', event.target.value)} placeholder="Valor" />
                    {payments.length > 1 && <button type="button" className="btn btn-outline-danger" onClick={() => removePayment(index)} aria-label="Eliminar pago">×</button>}
                  </div>
                </div>)}
                <div className="small mt-2">
                  <div className="d-flex justify-content-between"><span>Total pagado</span><strong>{money(paymentTotal)}</strong></div>
                  {paymentDifference > 0.01 && <div className="d-flex justify-content-between text-warning"><span>Pendiente</span><strong>{money(paymentDifference)}</strong></div>}
                  {paymentDifference < -0.01 && <div className="d-flex justify-content-between text-danger"><span>Excedente</span><strong>{money(Math.abs(paymentDifference))}</strong></div>}
                  {paymentComplete && <div className="alert alert-success py-2 mt-2 mb-0">✓ Pago completo</div>}
                </div>
              </div>

              <div className="bg-light rounded p-3 mb-3">
                <div className="d-flex justify-content-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                <div className="d-flex justify-content-between text-success"><span>Descuento</span><span>- {money(discountAmount)}</span></div>
                <hr className="my-2" />
                <div className="d-flex justify-content-between fs-4 fw-bold"><span>Total</span><span>{money(total)}</span></div>
              </div>

              <button type="button" className="btn btn-success btn-lg w-100" disabled={!cart.length || saving || !paymentComplete} onClick={submit}>
                {saving ? 'Procesando venta...' : '✓ Finalizar venta'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
}

export default SalesPage