import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Can from '../components/Can'
import { obtenerClientes } from '../services/clientsApi'
import { obtenerInventario, obtenerProductosInventario } from '../services/inventoryApi'
import { abrirFactura } from '../utils/salesInvoice'
import {
  crearVenta,
  crearVentaAutoconsumo,
  congelarVenta,
  congelarVentaAutoconsumo,
  obtenerVentasCongeladas,
  eliminarVentaCongelada,
  enviarFacturaPorCorreo,
} from '../services/salesApi'

const money = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v || 0))
const toCents = (value) => Math.round((Number(value) || 0) * 100)
const fromCents = (cents) => cents / 100
const METHODS = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'PSE', 'OTRO', 'CREDITO']

const userMessage = (error, fallback) => {
  const raw = String(error?.message || '')
  if (/Payment total must equal sale total/i.test(raw)) return 'El valor de los pagos debe coincidir exactamente con el total de la venta.'
  if (/Insufficient inventory|stock/i.test(raw)) return 'No hay inventario suficiente para uno de los productos seleccionados.'
  if (/not eligible for sale/i.test(raw)) return 'El cliente seleccionado no está habilitado para realizar esta venta.'
  if (/credit/i.test(raw) && /available|limit|insufficient/i.test(raw)) return 'El cupo de crédito disponible no es suficiente para esta venta.'
  return fallback
}

const STYLE = `
.sales-pos{height:calc(100vh - 190px);min-height:560px;overflow:hidden}.sales-pos-col{height:100%;overflow:auto;min-width:0}.sales-product-col{height:100%;overflow:hidden;min-width:0}.sales-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.65rem}.sales-product{border:1px solid var(--bs-border-color);background:var(--bs-body-bg);border-radius:.65rem;overflow:hidden;cursor:pointer;text-align:left}.sales-product:hover:not(:disabled){box-shadow:0 .35rem .9rem rgba(0,0,0,.12);transform:translateY(-1px)}.sales-img{height:90px;width:100%;object-fit:cover}.sales-placeholder{height:90px;display:flex;align-items:center;justify-content:center;background:var(--bs-tertiary-bg);font-size:32px}.sales-tabs{display:none}.sales-customer{border:1px solid var(--bs-border-color);border-radius:.65rem;padding:.65rem;background:var(--bs-tertiary-bg)}.sales-customer-title{font-size:.82rem;font-weight:700}.sales-customer-selected{background:var(--bs-body-bg)}.sales-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:2000;display:flex;align-items:center;justify-content:center;padding:1rem}.sales-modal{width:min(460px,100%);background:var(--bs-body-bg);color:var(--bs-body-color);border-radius:.75rem;box-shadow:0 1rem 3rem rgba(0,0,0,.25);overflow:hidden}.sales-modal-header{padding:.9rem 1rem;border-bottom:1px solid var(--bs-border-color);display:flex;align-items:center;justify-content:space-between}.sales-modal-body{padding:1rem}.sales-modal-footer{padding:.75rem 1rem;border-top:1px solid var(--bs-border-color);display:flex;justify-content:flex-end}@media(max-width:991.98px){.sales-pos{height:auto;min-height:0;overflow:visible}.sales-pos-col,.sales-product-col{height:auto;overflow:visible}.sales-tabs{display:flex;position:sticky;top:0;z-index:20;background:var(--bs-body-bg);padding:.45rem 0}.sales-panel{display:none}.sales-panel.active{display:block}.sales-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:575.98px){.sales-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.sales-img,.sales-placeholder{height:82px}}
`

export default function SalesPOSPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [inventory, setInventory] = useState([])
  const [clients, setClients] = useState([])
  const [frozen, setFrozen] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [mode, setMode] = useState('generic')
  const [participants, setParticipants] = useState([])
  const [genericAlias, setGenericAlias] = useState('')
  const [discount, setDiscount] = useState('0')
  const [payments, setPayments] = useState([{ method: 'EFECTIVO', amount: '' }])
  const [autoconsumption, setAutoconsumption] = useState(false)
  const [activeDraftId, setActiveDraftId] = useState(null)
  const [tab, setTab] = useState('products')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [freezing, setFreezing] = useState(false)
  const [message, setMessage] = useState(null)
  const [lastSale, setLastSale] = useState(null)
  const [validationModal, setValidationModal] = useState(null)

  const openValidation = (title, text) => setValidationModal({ title, text })
  const closeValidation = () => setValidationModal(null)

  useEffect(() => {
    document.body.style.overflow = validationModal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [validationModal])

  const loadCatalog = async () => {
    const [p, i] = await Promise.all([obtenerProductosInventario(token, true), obtenerInventario(token)])
    setProducts(Array.isArray(p) ? p : [])
    setInventory(Array.isArray(i) ? i : [])
  }

  const loadFrozen = async () => {
    const d = await obtenerVentasCongeladas(token)
    setFrozen(Array.isArray(d) ? d : [])
  }

  useEffect(() => {
    if (!token) return undefined
    let cancelled = false
    const load = async () => {
      try {
        const [p, i, c, d] = await Promise.all([
          obtenerProductosInventario(token, true),
          obtenerInventario(token),
          obtenerClientes(token, { page: 1, pageSize: 100 }),
          obtenerVentasCongeladas(token),
        ])
        if (cancelled) return
        setProducts(Array.isArray(p) ? p : [])
        setInventory(Array.isArray(i) ? i : [])
        setClients(Array.isArray(c?.items) ? c.items : Array.isArray(c) ? c : [])
        setFrozen(Array.isArray(d) ? d : [])
      } catch (e) {
        if (!cancelled) {
          if (e.status === 401) return manejarSesionExpirada()
          setMessage({ type: 'danger', text: userMessage(e, 'No fue posible cargar el POS.') })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [manejarSesionExpirada, token])

  const stock = useMemo(() => new Map(inventory.map((i) => [i.product_id, i])), [inventory])
  const shownProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = term ? products.filter((p) => `${p.code || ''} ${p.name || ''}`.toLowerCase().includes(term)) : products
    return filtered.slice(0, 6)
  }, [products, search])
  const subtotal = useMemo(() => cart.reduce((s, x) => s + Number(x.price) * Number(x.quantity), 0), [cart])
  const discountValue = autoconsumption ? 0 : Math.min(100, Math.max(0, Number(discount) || 0))
  const discountAmount = subtotal * discountValue / 100
  const total = Math.max(0, subtotal - discountAmount)
  const effectivePayments = useMemo(() => payments.map((p) => {
    if (p.method === 'CREDITO' && mode === 'client') return { ...p, amount: String(Math.round(total)) }
    if (!p.amount && payments.length === 1) return { ...p, amount: String(Math.round(total)) }
    return p
  }), [payments, mode, total])
  const totalCents = toCents(total)
  const paidCents = effectivePayments.reduce((s, p) => s + toCents(p.amount), 0)
  const differenceCents = totalCents - paidCents
  const difference = fromCents(differenceCents)
  const paidOk = differenceCents === 0
  const allocated = participants.reduce((s, p) => s + (Number(p.percentage) || 0), 0)
  const remaining = Math.max(0, 100 - allocated)
  const creditSelected = effectivePayments.some((p) => p.method === 'CREDITO' && Number(p.amount) > 0)
  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLowerCase()
    const available = clients.filter((c) => !participants.some((p) => p.id === c.id))
    return (term ? available.filter((c) => `${c.full_name || ''} ${c.identification_number || ''}`.toLowerCase().includes(term)) : available).slice(0, 8)
  }, [clientSearch, clients, participants])
  const availableCredit = (client) => {
    const explicit = Number(client?.credit_available)
    if (Number.isFinite(explicit)) return explicit
    return Math.max(0, Number(client?.credit_limit || 0) - Number(client?.credit_used || 0))
  }

  const addProduct = (product) => {
    const inv = stock.get(product.id)
    const max = Number(inv?.quantity || 0)
    if (!max) return
    const price = Number(autoconsumption ? inv?.purchase_price : inv?.sale_price) || 0
    setCart((current) => {
      const found = current.find((x) => x.product.id === product.id)
      if (!found) return [...current, { product, quantity: 1, price }]
      if (found.quantity >= max) return current
      return current.map((x) => x.product.id === product.id ? { ...x, quantity: x.quantity + 1 } : x)
    })
  }

  const changeQty = (id, delta) => setCart((current) => current.map((x) => x.product.id !== id ? x : { ...x, quantity: Math.min(Number(stock.get(id)?.quantity || 0), Math.max(0, x.quantity + delta)) }).filter((x) => x.quantity > 0))
  const toggleAutoconsumption = (value) => {
    setAutoconsumption(value)
    if (value) setDiscount('0')
    setCart((current) => current.map((x) => ({ ...x, price: Number(value ? stock.get(x.product.id)?.purchase_price : stock.get(x.product.id)?.sale_price) || 0 })))
  }
  const changeMode = (next) => {
    setMode(next)
    if (next === 'generic') setParticipants([])
    if (next !== 'generic') setGenericAlias('')
    if (next === 'client' && participants.length > 1) setParticipants((p) => p.slice(0, 1))
    if (next === 'split') setPayments((p) => p.map((x) => x.method === 'CREDITO' ? { ...x, method: 'EFECTIVO' } : x))
  }
  const addClient = (client) => {
    if (mode === 'client' && participants.length) return
    if (mode === 'split') {
      const next = [...participants, { ...client, percentage: 0 }]
      const pct = 100 / next.length
      setParticipants(next.map((p) => ({ ...p, percentage: pct })))
    } else {
      setParticipants([{ ...client, percentage: 100 }])
    }
    setClientSearch('')
  }
  const removeClient = (id) => setParticipants((p) => p.filter((x) => x.id !== id))
  const setClientPct = (id, value) => setParticipants((p) => p.map((x) => x.id === id ? { ...x, percentage: value } : x))
  const changePayment = (i, field, value) => setPayments((p) => p.map((x, n) => n === i ? { ...x, [field]: value } : x))
  const changePaymentMethod = (i, method) => setPayments((current) => current.map((p, n) => n === i ? { ...p, method, amount: String(Math.max(0, total - current.reduce((s, x, k) => k === i ? s : s + Number(x.amount || 0), 0))) } : p))
  const addPayment = () => setPayments((p) => [...p, {
    method: 'EFECTIVO',
    amount: String(Math.max(0, total - p.reduce((s, x) => s + Number(x.amount || 0), 0))),
  }])
  const removePayment = (i) => setPayments((p) => p.filter((_, n) => n !== i))
  const customersPayload = () => mode === 'generic' ? [{ allocation_percentage: 100, is_generic: true }] : participants.map((p) => ({ client_id: p.id, allocation_percentage: Number(p.percentage), is_generic: false }))
  const draftPayload = () => ({ items: cart.map((x) => ({ product_id: x.product.id, quantity: x.quantity })), customers: customersPayload(), discount_percentage: discountValue, alias: mode === 'generic' ? (genericAlias.trim() || null) : null })
  const reset = ({ keepLastSale = false } = {}) => {
    setCart([]); setSearch(''); setMode('generic'); setParticipants([]); setClientSearch(''); setGenericAlias(''); setDiscount('0'); setPayments([{ method: 'EFECTIVO', amount: '' }]); setAutoconsumption(false); setActiveDraftId(null)
    if (!keepLastSale) setLastSale(null)
  }

  const freeze = async () => {
    if (!cart.length) return openValidation('Venta sin productos', 'Agrega al menos un producto antes de congelar la venta.')
    if (mode === 'client' && participants.length !== 1) return openValidation('Cliente requerido', 'Selecciona un cliente registrado antes de congelar la venta.')
    if (mode === 'split' && (participants.length < 2 || Math.abs(allocated - 100) > .01)) return openValidation('Distribución incompleta', 'La distribución de la venta debe sumar exactamente 100 %.')
    setFreezing(true); setMessage(null)
    try {
      const data = draftPayload()
      const draft = autoconsumption ? await congelarVentaAutoconsumo(data, token) : await congelarVenta(data, token)
      setMessage({ type: 'success', text: `Venta ${draft.draft_number}${draft.payload?.alias ? ` · ${draft.payload.alias}` : ''} congelada. Puedes atender a otro cliente.` })
      reset()
      await loadFrozen()
    } catch (e) {
      if (e.status === 401) return manejarSesionExpirada()
      setMessage({ type: 'danger', text: userMessage(e, 'No fue posible congelar la venta.') })
    } finally { setFreezing(false) }
  }

  const resume = (draft) => {
    const payload = draft.payload || {}
    const restored = (payload.items || []).map((item) => {
      const product = products.find((p) => p.id === item.product_id)
      const inv = stock.get(item.product_id)
      return product ? { product, quantity: Number(item.quantity), price: Number(payload.is_autoconsumption ? inv?.purchase_price : inv?.sale_price) || 0 } : null
    }).filter(Boolean)
    const restoredClients = (payload.customers || []).filter((c) => c.client_id).map((c) => {
      const client = clients.find((x) => x.id === c.client_id)
      return client ? { ...client, percentage: Number(c.allocation_percentage) } : null
    }).filter(Boolean)
    setCart(restored)
    setParticipants(restoredClients)
    setMode(restoredClients.length > 1 ? 'split' : restoredClients.length ? 'client' : 'generic')
    setGenericAlias(restoredClients.length ? '' : String(payload.alias || ''))
    setDiscount(String(payload.discount_percentage || 0))
    setAutoconsumption(Boolean(payload.is_autoconsumption))
    setPayments([{ method: 'EFECTIVO', amount: '' }])
    setActiveDraftId(draft.id)
    setTab('products')
    setMessage({ type: 'success', text: `Venta ${draft.draft_number}${payload.alias ? ` · ${payload.alias}` : ''} recuperada.` })
  }

  const deleteFrozen = async (draft) => {
    try {
      await eliminarVentaCongelada(draft.id, token)
      if (activeDraftId === draft.id) setActiveDraftId(null)
      await loadFrozen()
    } catch (e) {
      if (e.status === 401) return manejarSesionExpirada()
      setMessage({ type: 'danger', text: userMessage(e, 'No fue posible eliminar la venta congelada.') })
    }
  }

  const submit = async () => {
    if (!cart.length) return openValidation('Venta sin productos', 'Agrega al menos un producto antes de registrar la venta.')
    if (mode === 'client' && participants.length !== 1) return openValidation('Cliente requerido', 'Selecciona un cliente registrado para registrar la venta.')
    if (mode === 'split' && (participants.length < 2 || Math.abs(allocated - 100) > .01)) return openValidation('Distribución incompleta', 'La distribución de la venta debe sumar exactamente 100 %.')
    if (creditSelected && mode !== 'client') return openValidation('Cliente requerido para crédito', 'Una venta a crédito requiere un único cliente registrado. Selecciona Cliente y asigna la venta antes de registrarla.')
    if (!paidOk) return openValidation('Pago incompleto', differenceCents > 0 ? `Aún falta completar ${money(difference)}.` : `El pago supera el total en ${money(Math.abs(difference))}.`)
    setSaving(true); setMessage(null)
    try {
      const data = {
        items: cart.map((x) => ({ product_id: x.product.id, quantity: x.quantity })),
        customers: customersPayload(),
        payments: effectivePayments.map((p) => ({ payment_method: p.method, amount: Number(p.amount) })),
        discount_percentage: discountValue,
      }
      const sale = autoconsumption ? await crearVentaAutoconsumo(data, token) : await crearVenta(data, token)
      setLastSale(sale)
      setMessage({ type: 'success', text: `Venta ${sale.sale_number || sale.id || ''} registrada correctamente.` })
      if (activeDraftId) {
        try { await eliminarVentaCongelada(activeDraftId, token) } catch (_) { /* La venta ya quedó registrada; no bloquear el flujo por el borrado del borrador. */ }
      }
      reset({ keepLastSale: true })
      await Promise.all([loadCatalog(), loadFrozen()])
    } catch (e) {
      if (e.status === 401) return manejarSesionExpirada()
      setMessage({ type: 'danger', text: userMessage(e, 'No fue posible registrar la venta.') })
    } finally { setSaving(false) }
  }

  if (loading) return <div className="container-fluid py-3">Cargando POS...</div>

  return (
    <>
      <style>{STYLE}</style>
      <div className="container-fluid py-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <div>
            <h4 className="mb-0">Punto de venta</h4>
            <div className="small text-muted">Registra ventas, congela cuentas y continúa después.</div>
          </div>
          <Can permission="SALES_READ">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/sales')}>Consulta de ventas</button>
          </Can>
        </div>
        {message && <div className={`alert alert-${message.type} py-2`} role="alert">{message.text}</div>}

        <div className="sales-tabs gap-1 mb-2">
          <button className={`btn btn-sm ${tab === 'products' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('products')}>Productos</button>
          <button className={`btn btn-sm ${tab === 'sale' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('sale')}>Venta</button>
          <button className={`btn btn-sm ${tab === 'frozen' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('frozen')}>Congeladas ({frozen.length})</button>
        </div>

        <div className="row g-3 sales-pos">
          <div className={`col-lg-5 sales-pos-col sales-panel ${tab === 'sale' ? 'active' : ''}`}>
            <div className="card shadow-sm mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2"><strong>Venta actual</strong><span className="badge text-bg-light">{cart.length} producto(s)</span></div>
                {cart.length === 0 ? <div className="text-muted small py-3">Agrega productos desde el catálogo.</div> : cart.map((x) => (
                  <div key={x.product.id} className="d-flex align-items-center gap-2 border-bottom py-2">
                    <div className="flex-grow-1"><div className="fw-semibold small">{x.product.name}</div><div className="text-muted small">{money(x.price)} c/u</div></div>
                    <div className="btn-group btn-group-sm"><button className="btn btn-outline-secondary" onClick={() => changeQty(x.product.id, -1)}>-</button><button className="btn btn-outline-secondary" disabled>{x.quantity}</button><button className="btn btn-outline-secondary" onClick={() => changeQty(x.product.id, 1)}>+</button></div>
                    <div className="text-end fw-semibold small" style={{ minWidth: 88 }}>{money(Number(x.price) * Number(x.quantity))}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sales-customer mb-2">
              <div className="sales-customer-title mb-2">👥 ¿A quién registrar la venta?</div>
              <div className="btn-group w-100 btn-group-sm mb-2">
                <button className={`btn ${mode === 'generic' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => changeMode('generic')}>Consumidor final</button>
                <button className={`btn ${mode === 'client' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => changeMode('client')}>Cliente</button>
                <button className={`btn ${mode === 'split' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => changeMode('split')}>Venta dividida</button>
              </div>
              {mode === 'generic' && (
                <>
                  <div className="small text-muted mb-2">La venta se registrará como consumidor final.</div>
                  <label className="form-label small mb-1">Alias de la cuenta (opcional)</label>
                  <input className="form-control form-control-sm" value={genericAlias} maxLength={100} onChange={(e) => setGenericAlias(e.target.value)} placeholder="Ej. Mesa 1, Cliente barra..." />
                </>
              )}
              {mode !== 'generic' && (
                <>
                  <input className="form-control form-control-sm mb-2" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Buscar por nombre o identificación..." />
                  {filteredClients.length > 0 && <div className="list-group mb-2">{filteredClients.map((client) => <button type="button" key={client.id} className="list-group-item list-group-item-action py-2" onClick={() => addClient(client)}><strong>{client.full_name}</strong><div className="small text-muted">{client.identification_number || 'Sin identificación'}</div></button>)}</div>}
                  {participants.map((client) => <div key={client.id} className="sales-customer-selected border rounded p-2 mb-2"><div className="d-flex justify-content-between"><div><strong>{client.full_name}</strong><div className="small text-muted">Cupo disponible: {money(availableCredit(client))}</div></div><button className="btn btn-sm btn-outline-danger" onClick={() => removeClient(client.id)}>×</button></div>{mode === 'split' && <div className="input-group input-group-sm mt-2"><span className="input-group-text">%</span><input type="number" min="0" max="100" step="0.01" className="form-control" value={client.percentage} onChange={(e) => setClientPct(client.id, e.target.value)} /></div>}</div>)}
                  {mode === 'split' && <div className={`small fw-semibold ${Math.abs(allocated - 100) < .01 ? 'text-success' : 'text-danger'}`}>Distribuido: {allocated.toFixed(2)} % · Restante: {remaining.toFixed(2)} %</div>}
                </>
              )}
            </div>

            <div className="card shadow-sm mb-3"><div className="card-body">
              <div className="d-flex justify-content-between"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
              <div className="d-flex justify-content-between align-items-center"><span>Descuento</span><div className="input-group input-group-sm" style={{ maxWidth: 120 }}><input type="number" min="0" max="100" step="0.01" className="form-control text-end" value={discount} disabled={autoconsumption} onChange={(e) => setDiscount(e.target.value)} /><span className="input-group-text">%</span></div></div>
              <div className="d-flex justify-content-between mt-1"><span>Total</span><strong className="fs-5">{money(total)}</strong></div>
            </div></div>

            <div className="card shadow-sm mb-3"><div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2"><strong>Pagos</strong><button className="btn btn-outline-primary btn-sm" onClick={addPayment}>+ Medio</button></div>
              {payments.map((p, i) => <div className="row g-2 mb-2" key={`${i}-${p.method}`}><div className="col-6"><select className="form-select form-select-sm" value={p.method} onChange={(e) => changePaymentMethod(i, e.target.value)}>{METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</select></div><div className="col-5"><input type="number" min="0" step="0.01" className="form-control form-control-sm text-end" value={p.amount} onChange={(e) => changePayment(i, 'amount', e.target.value)} /></div><div className="col-1 d-flex align-items-center justify-content-end">{payments.length > 1 && <button className="btn btn-sm btn-outline-danger" onClick={() => removePayment(i)}>×</button>}</div></div>)}
              <div className="d-flex justify-content-between small mt-2"><span>{differenceCents > 0 ? 'Falta' : differenceCents < 0 ? 'Sobra' : 'Pagado'}</span><strong className={differenceCents === 0 ? 'text-success' : 'text-danger'}>{money(Math.abs(difference))}</strong></div>
            </div></div>

            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-outline-secondary" disabled={!cart.length || freezing || saving} onClick={() => void freeze()}>{freezing ? 'Congelando...' : '❄ Congelar venta'}</button>
              <button className="btn btn-primary btn-lg" disabled={!cart.length || !paidOk || saving || freezing} onClick={() => void submit()}>{saving ? 'Registrando...' : '✓ Registrar venta'}</button>
              <button className="btn btn-outline-secondary" disabled={!cart.length || saving || freezing} onClick={() => reset()}>Limpiar</button>
            </div>
            <div className="form-check form-switch mt-2"><input className="form-check-input" type="checkbox" id="autoconsumption" checked={autoconsumption} onChange={(e) => toggleAutoconsumption(e.target.checked)} /><label className="form-check-label small" htmlFor="autoconsumption">Autoconsumo</label></div>
          </div>

          <div className={`col-lg-4 sales-product-col sales-panel ${tab === 'products' ? 'active' : ''}`}>
            <div className="card shadow-sm h-100"><div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2"><strong>Productos</strong><span className="small text-muted">⭐ Productos destacados</span></div>
              <input className="form-control form-control-sm mb-2" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o código..." />
              <div className="small text-muted mb-2">Busca por nombre o código para encontrar otros.</div>
              <div className="sales-grid">{shownProducts.map((product) => { const inv = stock.get(product.id); const qty = Number(inv?.quantity || 0); return <button type="button" className="sales-product p-2" key={product.id} disabled={!qty} onClick={() => addProduct(product)}><div className="sales-placeholder">🛒</div><div className="fw-semibold small mt-1">{product.name}</div><div className="small text-muted">{money(autoconsumption ? inv?.purchase_price : inv?.sale_price)}</div><div className={`small ${qty ? 'text-success' : 'text-danger'}`}>Stock: {qty}</div></button> })}</div>
            </div></div>
          </div>

          <div className={`col-lg-3 sales-pos-col sales-panel ${tab === 'frozen' ? 'active' : ''}`}>
            <div className="card shadow-sm h-100"><div className="card-body"><div className="d-flex justify-content-between align-items-center mb-2"><strong>Ventas congeladas</strong><span className="badge text-bg-secondary">{frozen.length}</span></div>{frozen.length === 0 ? <div className="small text-muted">No hay ventas congeladas.</div> : frozen.map((d) => <div key={d.id} className="border rounded p-2 mb-2"><strong>{d.draft_number}</strong>{d.payload?.alias && <div className="fw-semibold small">👤 {d.payload.alias}</div>}<div className="small text-muted">{d.payload?.items?.length || 0} producto(s){d.payload?.is_autoconsumption ? ' · Autoconsumo' : ''}</div><div className="d-flex gap-1 mt-2"><button className="btn btn-sm btn-primary" onClick={() => resume(d)}>Continuar</button><button className="btn btn-sm btn-outline-danger" onClick={() => void deleteFrozen(d)}>Eliminar</button></div></div>)}</div></div>
          </div>
        </div>

        {lastSale && <div className="card shadow-sm mt-3"><div className="card-body d-flex flex-wrap gap-2 align-items-center"><strong>Venta registrada</strong><span>{lastSale.sale_number || lastSale.id}</span><button className="btn btn-sm btn-outline-primary" onClick={() => abrirFactura(lastSale)}>Ver factura</button><button className="btn btn-sm btn-outline-secondary" onClick={() => void enviarFacturaPorCorreo(lastSale.id, token)}>Enviar por correo</button></div></div>}
      </div>

      {validationModal && <div className="sales-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) closeValidation() }} onKeyDown={(e) => { if (e.key === 'Escape') closeValidation() }}><div className="sales-modal" role="dialog" aria-modal="true" aria-labelledby="sales-validation-title"><div className="sales-modal-header"><strong id="sales-validation-title">{validationModal.title}</strong><button className="btn-close" aria-label="Cerrar" onClick={closeValidation} /></div><div className="sales-modal-body">{validationModal.text}</div><div className="sales-modal-footer"><button className="btn btn-primary" onClick={closeValidation}>Entendido</button></div></div></div>}
    </>
  )
}
