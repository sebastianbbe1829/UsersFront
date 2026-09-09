import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Can from '../components/Can'
import { obtenerClientes } from '../services/clientsApi'
import { obtenerCupoCliente } from '../services/portfolioApi'
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
const toCents = (value) => Math.round(Number(value) || 0)
const fromCents = (cents) => cents
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
.sales-pos{height:calc(100vh - 120px);min-height:560px;overflow:hidden}.sales-pos-col{height:100%;overflow:auto;min-width:0}.sales-product-col{height:100%;overflow:hidden;min-width:0}.sales-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.65rem}.sales-product{border:1px solid var(--bs-border-color);background:var(--bs-body-bg);border-radius:.65rem;overflow:hidden;cursor:pointer;text-align:left}.sales-product:hover:not(:disabled){box-shadow:0 .35rem .9rem rgba(0,0,0,.12);transform:translateY(-1px)}.sales-img{height:68px;width:100%;object-fit:cover}.sales-placeholder{height:68px;display:flex;align-items:center;justify-content:center;background:var(--bs-tertiary-bg);font-size:28px}.sales-product .p-2{padding:.35rem!important}.sales-tabs{display:none}.sales-customer{border:1px solid var(--bs-border-color);border-radius:.65rem;padding:.65rem;background:var(--bs-tertiary-bg)}.sales-customer-title{font-size:.82rem;font-weight:700}.sales-customer-selected{background:var(--bs-body-bg)}.sales-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:2000;display:flex;align-items:center;justify-content:center;padding:1rem}.sales-modal{width:min(460px,100%);background:var(--bs-body-bg);color:var(--bs-body-color);border-radius:.75rem;box-shadow:0 1rem 3rem rgba(0,0,0,.25);overflow:hidden}.sales-modal-header{padding:.9rem 1rem;border-bottom:1px solid var(--bs-border-color);display:flex;align-items:center;justify-content:space-between}.sales-modal-body{padding:1rem}.sales-modal-footer{padding:.75rem 1rem;border-top:1px solid var(--bs-border-color);display:flex;justify-content:flex-end}.sales-processing{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:2100;display:flex;align-items:center;justify-content:center;padding:1rem}.sales-processing-card{width:min(360px,100%);background:var(--bs-body-bg);color:var(--bs-body-color);border-radius:.75rem;box-shadow:0 1rem 3rem rgba(0,0,0,.25);padding:1.5rem;text-align:center}@media(max-width:991.98px){.sales-pos{height:auto;min-height:0;overflow:visible}.sales-pos-col,.sales-product-col{height:auto;overflow:visible}.sales-tabs{display:flex;position:sticky;top:0;z-index:20;background:var(--bs-body-bg);padding:.45rem 0}.sales-panel{display:none}.sales-panel.active{display:block}.sales-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:575.98px){.sales-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.sales-img,.sales-placeholder{height:62px}}
`

const splitPercentages = (count) => {
  if (!count) return []
  const base = Math.floor((100 / count) * 100) / 100
  const remainder = Math.round((100 - base * (count - 1)) * 100) / 100
  return Array.from({ length: count }, (_, index) => index === count - 1 ? remainder : base)
}

export default function SalesPOSPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [inventory, setInventory] = useState([])
  const [clients, setClients] = useState([])
  const [clientCredits, setClientCredits] = useState({})
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
  const [sendingEmail, setSendingEmail] = useState(false)
  const [saleCanEmail, setSaleCanEmail] = useState(false)
  const [saleEmailMessage, setSaleEmailMessage] = useState(null)
  const [message, setMessage] = useState(null)
  const [lastSale, setLastSale] = useState(null)
  const [validationModal, setValidationModal] = useState(null)
  const [saleSuccessModal, setSaleSuccessModal] = useState(null)

  const openValidation = (title, text) => setValidationModal({ title, text })
  const closeValidation = () => setValidationModal(null)
  const closeSaleSuccess = () => { setSaleSuccessModal(null); setSaleEmailMessage(null) }

  useEffect(() => {
    document.body.style.overflow = (validationModal || saleSuccessModal || saving || freezing) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [validationModal, saleSuccessModal, saving, freezing])

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

  const participantIds = participants.map((p) => p.id).join(',')
  useEffect(() => {
    if (!token || !participantIds) return undefined
    let cancelled = false
    const loadCredits = async () => {
      const entries = await Promise.all(participants.map(async (participant) => {
        try {
          const credit = await obtenerCupoCliente(participant.id, token)
          return [participant.id, credit]
        } catch (e) {
          if (e.status === 401) manejarSesionExpirada()
          return [participant.id, null]
        }
      }))
      if (cancelled) return
      setClientCredits((current) => ({ ...current, ...Object.fromEntries(entries) }))
    }
    void loadCredits()
    return () => { cancelled = true }
  }, [manejarSesionExpirada, participantIds, token])

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
  const totalPesos = Math.round(total)
  const effectivePayments = useMemo(() => payments.map((p) => {
    if (p.method === 'CREDITO' && mode === 'client') return { ...p, amount: String(totalPesos) }
    if (!p.amount && payments.length === 1) return { ...p, amount: String(totalPesos) }
    return p
  }), [payments, mode, totalPesos])
  const totalCents = totalPesos
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
    const credit = clientCredits[client?.id]
    if (credit && credit.credit_available != null) return Number(credit.credit_available)
    return null
  }
  const amountForParticipant = (participant) => Math.max(0, Math.round(totalPesos * (Number(participant?.percentage) || 0) / 100))

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
      const percentages = splitPercentages(next.length)
      setParticipants(next.map((p, index) => ({ ...p, percentage: percentages[index] })))
    } else {
      setParticipants([{ ...client, percentage: 100 }])
    }
    setClientSearch('')
  }
  const removeClient = (id) => setParticipants((current) => {
    const next = current.filter((x) => x.id !== id)
    if (mode !== 'split' || !next.length) return next
    const percentages = splitPercentages(next.length)
    return next.map((p, index) => ({ ...p, percentage: percentages[index] }))
  })
  const setClientPct = (id, value) => setParticipants((p) => p.map((x) => x.id === id ? { ...x, percentage: value } : x))
  const changePayment = (i, field, value) => setPayments((p) => p.map((x, n) => n === i ? { ...x, [field]: value } : x))
  const changePaymentMethod = (i, method) => setPayments((current) => current.map((p, n) => n === i ? { ...p, method, amount: String(Math.max(0, totalPesos - current.reduce((s, x, k) => k === i ? s : s + toCents(x.amount), 0))) } : p))
  const addPayment = () => setPayments((p) => [...p, { method: 'EFECTIVO', amount: String(Math.max(0, totalPesos - paidCents)) }])
  const removePayment = (i) => setPayments((p) => p.filter((_, n) => n !== i))
  const customersPayload = () => mode === 'generic' ? [{ allocation_percentage: 100, is_generic: true }] : participants.map((p) => ({ client_id: p.id, allocation_percentage: Number(p.percentage), is_generic: false }))
  const draftPayload = () => ({ items: cart.map((x) => ({ product_id: x.product.id, quantity: x.quantity })), customers: customersPayload(), discount_percentage: discountValue, alias: mode === 'generic' ? (genericAlias.trim() || null) : null })
  const reset = ({ keepLastSale = false } = {}) => {
    setCart([]); setSearch(''); setMode('generic'); setParticipants([]); setClientSearch(''); setGenericAlias(''); setDiscount('0'); setPayments([{ method: 'EFECTIVO', amount: '' }]); setAutoconsumption(false); setActiveDraftId(null)
    if (!keepLastSale) { setLastSale(null); setSaleSuccessModal(null); setSaleEmailMessage(null) }
  }
  const resume = (draft) => {
    const payload = draft.payload || {}
    const items = Array.isArray(payload.items) ? payload.items : []
    const restored = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id)
      const inv = stock.get(item.product_id)
      if (!product || !inv) return null
      return { product, quantity: Number(item.quantity || 0), price: Number(payload.is_autoconsumption ? inv.purchase_price : inv.sale_price) || 0 }
    }).filter(Boolean)
    setCart(restored)
    setAutoconsumption(Boolean(payload.is_autoconsumption))
    setDiscount(String(payload.discount_percentage ?? '0'))
    if (payload.customers?.length) {
      const restoredClients = payload.customers.filter((c) => c.client_id).map((c) => ({ ...clients.find((x) => x.id === c.client_id), id: c.client_id, percentage: Number(c.allocation_percentage) }))
      setParticipants(restoredClients)
      setMode(restoredClients.length > 1 ? 'split' : 'client')
    } else {
      setParticipants([]); setMode('generic')
    }
    setActiveDraftId(draft.id)
    setTab('sale')
  }
  const freeze = async () => {
    if (!cart.length) return openValidation('Venta vacía', 'Agrega al menos un producto antes de congelar la venta.')
    if (mode === 'client' && participants.length !== 1) return openValidation('Cliente requerido', 'Selecciona un cliente registrado para congelar esta venta.')
    if (mode === 'split' && (participants.length < 2 || Math.abs(allocated - 100) > .01)) return openValidation('Distribución incompleta', 'La distribución de la venta debe sumar exactamente 100 %.')
    setFreezing(true); setMessage(null)
    try {
      const data = draftPayload()
      if (activeDraftId) await eliminarVentaCongelada(activeDraftId, token)
      const draft = autoconsumption ? await congelarVentaAutoconsumo(data, token) : await congelarVenta(data, token)
      setActiveDraftId(draft.id)
      await loadFrozen()
    } catch (e) {
      if (e.status === 401) return manejarSesionExpirada()
      setMessage({ type: 'danger', text: userMessage(e, 'No fue posible congelar la venta.') })
    } finally { setFreezing(false) }
  }
  const submit = async () => {
    if (!cart.length) return openValidation('Venta vacía', 'Agrega al menos un producto antes de registrar la venta.')
    if (mode === 'client' && participants.length !== 1) return openValidation('Cliente requerido', 'Selecciona un cliente registrado para registrar la venta.')
    if (mode === 'split' && (participants.length < 2 || Math.abs(allocated - 100) > .01)) return openValidation('Distribución incompleta', 'La distribución de la venta debe sumar exactamente 100 %.')
    if (creditSelected && mode !== 'client') return openValidation('Cliente requerido para crédito', 'Una venta a crédito requiere un único cliente registrado. Selecciona Cliente y asigna la venta antes de registrarla.')
    if (!paidOk) return openValidation('Pago incompleto', differenceCents > 0 ? `Aún falta completar ${money(difference)}.` : `El pago supera el total en ${money(Math.abs(difference))}.`)
    setSaving(true); setMessage(null); setSaleSuccessModal(null); setSaleEmailMessage(null)
    try {
      const data = { items: cart.map((x) => ({ product_id: x.product.id, quantity: x.quantity })), customers: customersPayload(), payments: effectivePayments.map((p) => ({ payment_method: p.method, amount: toCents(p.amount) })), discount_percentage: discountValue }
      const sale = autoconsumption ? await crearVentaAutoconsumo(data, token) : await crearVenta(data, token)
      if (activeDraftId) await eliminarVentaCongelada(activeDraftId, token)
      const canEmail = mode !== 'generic' && participants.some((participant) => String(participant.email || '').trim())
      setLastSale(sale)
      setSaleCanEmail(canEmail)
      setSaleSuccessModal(sale)
      reset({ keepLastSale: true })
      await Promise.all([loadCatalog(), loadFrozen()])
    } catch (e) {
      if (e.status === 401) return manejarSesionExpirada()
      setMessage({ type: 'danger', text: userMessage(e, 'No fue posible registrar la venta.') })
    } finally { setSaving(false) }
  }

  const print = () => { try { abrirFactura(lastSale) } catch { setSaleEmailMessage({ type: 'warning', text: 'No fue posible generar la factura.' }) } }
  const email = async () => {
    if (!saleCanEmail || !lastSale || sendingEmail) return
    setSendingEmail(true); setSaleEmailMessage(null)
    try {
      const r = await enviarFacturaPorCorreo(lastSale.id, token)
      setSaleEmailMessage({ type: 'success', text: `Factura enviada correctamente a ${r.recipients.join(', ')}.` })
    } catch (e) {
      if (e.status === 401) return manejarSesionExpirada()
      setSaleEmailMessage({ type: 'danger', text: userMessage(e, 'No fue posible enviar la factura.') })
    } finally { setSendingEmail(false) }
  }

  const customerBlock = (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-body"><strong>Cliente</strong></div>
      <div className="card-body">
        <div className="btn-group w-100 mb-2" role="group">
          {[['generic', 'Consumidor final'], ['client', 'Cliente'], ['split', 'Venta dividida']].map(([value, label]) => <button key={value} type="button" className={`btn btn-sm ${mode === value ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => changeMode(value)}>{label}</button>)}
        </div>
        {mode === 'generic' ? <input className="form-control form-control-sm" placeholder="Alias opcional" value={genericAlias} onChange={(e) => setGenericAlias(e.target.value)} /> : <>
          <input className="form-control form-control-sm" placeholder="Buscar cliente" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
          <div className="mt-2 d-grid gap-1">{filteredClients.map((client) => <button key={client.id} type="button" className="btn btn-sm btn-outline-secondary text-start" onClick={() => addClient(client)}>{client.full_name}<span className="d-block small text-muted">{client.identification_number}</span></button>)}</div>
          <div className="mt-2 d-grid gap-2">{participants.map((p) => <div key={p.id} className="sales-customer sales-customer-selected"><div className="d-flex justify-content-between align-items-start gap-2"><div><strong className="small">{p.full_name}</strong><div className="small text-muted">Participación en la venta: <strong>{Number(p.percentage || 0).toFixed(2)}%</strong></div><div className="small text-muted">Cupo disponible: <strong>{availableCredit(p) == null ? 'Consultando...' : money(availableCredit(p))}</strong></div><div className="small text-primary">Debe pagar: <strong>{money(amountForParticipant(p))}</strong></div></div><button className="btn btn-sm btn-link text-danger p-0" onClick={() => removeClient(p.id)}>×</button></div>{mode === 'split' && <div className="mt-2"><input type="number" min="0.01" max="100" step="0.01" className="form-control form-control-sm" value={p.percentage} onChange={(e) => setClientPct(p.id, e.target.value)} /></div>}</div>)}</div>
        </>}
      </div>
    </div>
  )

  if (loading) return <div className="d-flex justify-content-center py-5"><div className="spinner-border" role="status"></div></div>

  return <>
    <style>{STYLE}</style>
    <div className="container-fluid pt-0 pb-2">
      <div className="d-flex justify-content-between align-items-center mb-1"><div><div className="d-flex align-items-center gap-2"><button className="btn btn-sm btn-link text-decoration-none p-0" onClick={() => navigate('/welcome')}>← Volver</button><h4 className="mb-0">Punto de venta</h4></div><div className="small text-muted">Registra ventas, pagos y facturación.</div></div><div className="d-flex gap-2"><button className="btn btn-sm btn-outline-danger" onClick={() => reset()}>Limpiar</button></div></div>
      {message && <div className={`alert alert-${message.type} py-2`}>{message.text}</div>}
      <div className="sales-tabs"><button className={`btn btn-sm flex-fill ${tab === 'products' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('products')}>Productos</button><button className={`btn btn-sm flex-fill ${tab === 'sale' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('sale')}>Venta</button><button className={`btn btn-sm flex-fill ${tab === 'payment' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('payment')}>Pago</button></div>
      <div className="row g-2 sales-pos">
        <div className={`col-lg-4 sales-pos-col sales-product-col sales-panel ${tab === 'products' ? 'active' : ''}`}>
          <div className="card border-0 shadow-sm h-100"><div className="card-header bg-body d-flex justify-content-between align-items-center"><strong>Productos</strong><span className="small text-muted">Máximo 6 destacados</span></div><div className="card-body"><input className="form-control mb-2" placeholder="Buscar producto por código o nombre" value={search} onChange={(e) => setSearch(e.target.value)} /><div className="sales-grid">{shownProducts.map((p) => { const inv = stock.get(p.id); const available = Number(inv?.quantity || 0); return <button key={p.id} className="sales-product" disabled={!available} onClick={() => addProduct(p)}>{p.image_url ? <img className="sales-img" src={p.image_url} alt={p.name} /> : <div className="sales-placeholder">🛒</div>}<div className="p-2"><strong className="small d-block text-truncate">{p.name}</strong><span className="small text-muted d-block">{p.code || 'Sin código'}</span><span className="small fw-semibold">{money(autoconsumption ? inv?.purchase_price : inv?.sale_price)}</span><span className={`small d-block ${available ? 'text-success' : 'text-danger'}`}>{available ? `Stock: ${available}` : 'Sin stock'}</span></div></button> })}</div></div></div>
        </div>
        <div className={`col-lg-5 sales-pos-col sales-panel ${tab === 'sale' ? 'active' : ''}`}>
          {customerBlock}
          <div className="card border-0 shadow-sm mt-2"><div className="card-header bg-body"><strong>Detalle de venta</strong></div><div className="card-body p-2">{!cart.length ? <div className="text-muted small">Agrega productos desde la sección Productos.</div> : cart.map((x) => <div key={x.product.id} className="d-flex justify-content-between align-items-center border-bottom py-2"><div className="me-2"><strong className="small">{x.product.name}</strong><div className="small text-muted">{money(x.price)} × {x.quantity}</div></div><div className="btn-group btn-group-sm"><button className="btn btn-outline-secondary" onClick={() => changeQty(x.product.id, -1)}>−</button><button className="btn btn-outline-secondary disabled">{x.quantity}</button><button className="btn btn-outline-secondary" onClick={() => changeQty(x.product.id, 1)}>+</button></div></div>)}</div></div>
          <div className="card border-0 shadow-sm mt-2"><div className="card-header bg-body"><strong>Descuento y opciones</strong></div><div className="card-body"><div className="row g-2 align-items-end"><div className="col-6"><label className="form-label small mb-1">Descuento %</label><input type="number" min="0" max="100" step="0.01" className="form-control form-control-sm" value={discount} disabled={autoconsumption} onChange={(e) => setDiscount(e.target.value)} /></div><div className="col-6 form-check form-switch pt-4"><input className="form-check-input" type="checkbox" id="autoconsumo" checked={autoconsumption} onChange={(e) => toggleAutoconsumption(e.target.checked)} /><label className="form-check-label small" htmlFor="autoconsumo">Autoconsumo</label></div></div></div></div>
        </div>
        <div className={`col-lg-3 sales-pos-col sales-panel ${tab === 'payment' || tab === 'sale' ? 'active' : ''}`}>
          <div className="card border-0 shadow-sm h-100 d-flex flex-column"><div className="card-header bg-body"><strong>Resumen y pago</strong></div><div className="card-body d-flex flex-column"><div className="d-flex justify-content-between small"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="d-flex justify-content-between small"><span>Descuento</span><strong>{money(discountAmount)}</strong></div><hr /><div className="d-flex justify-content-between"><span>Total</span><strong className="fs-4">{money(totalPesos)}</strong></div><div className="mt-3"><div className="d-flex justify-content-between align-items-center mb-2"><strong className="small">Pagos</strong><button className="btn btn-sm btn-outline-primary" onClick={addPayment}>+ Método</button></div>{effectivePayments.map((p, i) => <div className="row g-1 mb-2" key={i}><div className="col-7"><select className="form-select form-select-sm" value={p.method} onChange={(e) => changePaymentMethod(i, e.target.value)}>{METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</select></div><div className="col-5"><input type="number" min="0" step="1" className="form-control form-control-sm" value={p.amount} onChange={(e) => changePayment(i, 'amount', e.target.value)} /></div>{payments.length > 1 && <div className="col-12 text-end"><button className="btn btn-sm btn-link text-danger p-0" onClick={() => removePayment(i)}>Eliminar</button></div>}</div>)}</div><div className={`small mt-2 ${paidOk ? 'text-success' : difference > 0 ? 'text-warning' : 'text-danger'}`}>{paidOk ? '✓ Pago completo' : difference > 0 ? `Faltan ${money(difference)}` : `Sobran ${money(Math.abs(difference))}`}</div><div className="mt-auto d-grid gap-2 pt-3"><button className="btn btn-primary btn-lg" disabled={saving || !cart.length || !paidOk || freezing} onClick={() => void submit()}>{saving ? 'Registrando...' : 'Registrar venta'}</button><button className="btn btn-outline-warning" disabled={!cart.length || freezing || saving} onClick={() => void freeze()}>{freezing ? 'Congelando...' : '⏸️ Congelar venta'}</button></div></div></div>
        </div>
      </div>
      <div className="card border-0 shadow-sm mt-2">
        <div className="card-header bg-body d-flex justify-content-between align-items-center"><strong>⏸️ Ventas congeladas</strong><span className="badge text-bg-secondary">{frozen.length}</span></div>
        <div className="card-body p-2">{!frozen.length ? <div className="small text-muted">No hay ventas congeladas. Puedes congelar una para atender a otro cliente y recuperarla después.</div> : <div className="row g-2">{frozen.map((d) => <div className="col-md-6 col-xl-4" key={d.id}><div className="border rounded p-2 d-flex justify-content-between align-items-center"><div><strong>{d.payload?.alias ? `${d.payload.alias} · ` : ''}{d.draft_number}</strong><div className="small text-muted">{d.payload?.items?.length || 0} producto(s){d.payload?.is_autoconsumption ? ' · Autoconsumo' : ''}</div></div><button className="btn btn-sm btn-outline-primary" onClick={() => resume(d)}>Recuperar</button></div></div>)}</div>}</div>
      </div>
    </div>
    {validationModal && <div className="sales-modal-backdrop" role="presentation"><div className="sales-modal" role="dialog" aria-modal="true" aria-labelledby="sales-validation-title"><div className="sales-modal-header"><strong id="sales-validation-title">⚠️ {validationModal.title}</strong><button className="btn-close" aria-label="Cerrar" onClick={closeValidation}></button></div><div className="sales-modal-body">{validationModal.text}</div><div className="sales-modal-footer"><button className="btn btn-primary" onClick={closeValidation}>Entendido</button></div></div></div>}
    {saleSuccessModal && <div className="sales-modal-backdrop" role="presentation"><div className="sales-modal" role="dialog" aria-modal="true" aria-labelledby="sales-success-title"><div className="sales-modal-header"><strong id="sales-success-title">✓ Venta realizada correctamente</strong><button className="btn-close" aria-label="Cerrar" onClick={closeSaleSuccess}></button></div><div className="sales-modal-body"><div className="fs-5 fw-semibold mb-1">{saleSuccessModal.sale_number}</div><div className="text-muted">Total de la venta</div><div className="fs-3 fw-bold mb-3">{money(saleSuccessModal.total)}</div><div className="alert alert-success py-2 mb-0">La venta fue registrada correctamente.</div>{saleEmailMessage && <div className={`alert alert-${saleEmailMessage.type} py-2 mt-2 mb-0`}>{saleEmailMessage.text}</div>}</div><div className="sales-modal-footer"><div className="d-flex gap-2"><button className="btn btn-outline-success" onClick={print}>🖨️ Factura</button>{saleCanEmail && <Can permission="SALES_EMAIL"><button className="btn btn-success" disabled={sendingEmail} onClick={() => void email()}>{sendingEmail ? 'Enviando...' : '✉️ Enviar'}</button></Can>}<button className="btn btn-primary" onClick={closeSaleSuccess}>Entendido</button></div></div></div></div>}
    {(saving || freezing) && <div className="sales-processing" role="presentation"><div className="sales-processing-card" role="status" aria-live="polite" aria-label={freezing ? 'Congelando venta' : 'Registrando venta'}><div className="spinner-border mb-3" role="status" aria-hidden="true"></div><div className="fw-semibold fs-5">{freezing ? 'Congelando venta...' : 'Registrando venta...'}</div><div className="small text-muted mt-1">{freezing ? 'Por favor espera mientras guardamos la venta congelada.' : 'Por favor espera mientras procesamos la venta.'}</div></div></div>}
  </>
}