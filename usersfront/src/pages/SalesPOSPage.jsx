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
.sales-pos{height:calc(100vh - 190px);min-height:560px;overflow:hidden}.sales-pos-col{height:100%;overflow:auto;min-width:0}.sales-product-col{height:100%;overflow:hidden;min-width:0}.sales-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.65rem}.sales-product{border:1px solid var(--bs-border-color);background:var(--bs-body-bg);border-radius:.65rem;overflow:hidden;cursor:pointer;text-align:left}.sales-product:hover:not(:disabled){box-shadow:0 .35rem .9rem rgba(0,0,0,.12);transform:translateY(-1px)}.sales-img{height:90px;width:100%;object-fit:cover}.sales-placeholder{height:90px;display:flex;align-items:center;justify-content:center;background:var(--bs-tertiary-bg);font-size:32px}.sales-tabs{display:none}@media(max-width:991.98px){.sales-pos{height:auto;min-height:0;overflow:visible}.sales-pos-col,.sales-product-col{height:auto;overflow:visible}.sales-tabs{display:flex;position:sticky;top:0;z-index:20;background:var(--bs-body-bg);padding:.45rem 0}.sales-panel{display:none}.sales-panel.active{display:block}.sales-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:575.98px){.sales-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.sales-img,.sales-placeholder{height:82px}}
`

export default function SalesPOSPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([]); const [inventory, setInventory] = useState([]); const [clients, setClients] = useState([]); const [frozen, setFrozen] = useState([])
  const [cart, setCart] = useState([]); const [search, setSearch] = useState(''); const [clientSearch, setClientSearch] = useState(''); const [mode, setMode] = useState('generic'); const [participants, setParticipants] = useState([])
  const [discount, setDiscount] = useState('0'); const [payments, setPayments] = useState([{ method: 'EFECTIVO', amount: '' }]); const [autoconsumption, setAutoconsumption] = useState(false); const [activeDraftId, setActiveDraftId] = useState(null)
  const [tab, setTab] = useState('products'); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [freezing, setFreezing] = useState(false); const [message, setMessage] = useState(null); const [lastSale, setLastSale] = useState(null)

  const loadCatalog = async () => { const [p, i] = await Promise.all([obtenerProductosInventario(token, true), obtenerInventario(token)]); setProducts(Array.isArray(p) ? p : []); setInventory(Array.isArray(i) ? i : []) }
  const loadFrozen = async () => { const d = await obtenerVentasCongeladas(token); setFrozen(Array.isArray(d) ? d : []) }

  useEffect(() => {
    if (!token) return undefined
    let cancelled = false
    const load = async () => {
      try {
        const [p, i, c, d] = await Promise.all([obtenerProductosInventario(token, true), obtenerInventario(token), obtenerClientes(token, { page: 1, pageSize: 100 }), obtenerVentasCongeladas(token)])
        if (cancelled) return
        setProducts(Array.isArray(p) ? p : []); setInventory(Array.isArray(i) ? i : []); setClients(Array.isArray(c?.items) ? c.items : Array.isArray(c) ? c : []); setFrozen(Array.isArray(d) ? d : [])
      } catch (e) { if (!cancelled) { if (e.status === 401) return manejarSesionExpirada(); setMessage({ type: 'danger', text: userMessage(e, 'No fue posible cargar el punto de venta.') }) } } finally { if (!cancelled) setLoading(false) }
    }
    void load(); return () => { cancelled = true }
  }, [manejarSesionExpirada, token])

  const stock = useMemo(() => new Map(inventory.map((i) => [i.product_id, i])), [inventory])
  const shownProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = term ? products.filter((p) => `${p.code || ''} ${p.name || ''}`.toLowerCase().includes(term)) : products
    return filtered.slice(0, 6)
  }, [products, search])
  const subtotal = useMemo(() => cart.reduce((s, x) => s + Number(x.price) * Number(x.quantity), 0), [cart])
  const discountValue = autoconsumption ? 0 : Math.min(100, Math.max(0, Number(discount) || 0)); const discountAmount = subtotal * discountValue / 100; const total = Math.max(0, subtotal - discountAmount)
  const paid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0); const difference = total - paid; const paidOk = Math.abs(difference) < .01
  const allocated = participants.reduce((s, p) => s + (Number(p.percentage) || 0), 0); const remaining = Math.max(0, 100 - allocated)
  const creditSelected = payments.some((p) => p.method === 'CREDITO' && Number(p.amount) > 0)
  const filteredClients = useMemo(() => { const term = clientSearch.trim().toLowerCase(); const available = clients.filter((c) => !participants.some((p) => p.id === c.id)); return (term ? available.filter((c) => `${c.full_name || ''} ${c.identification_number || ''}`.toLowerCase().includes(term)) : available).slice(0, 8) }, [clientSearch, clients, participants])
  const availableCredit = (client) => { const explicit = Number(client?.credit_available); if (Number.isFinite(explicit)) return explicit; return Math.max(0, Number(client?.credit_limit || 0) - Number(client?.credit_used || 0)) }

  const addProduct = (product) => { const inv = stock.get(product.id); const max = Number(inv?.quantity || 0); if (!max) return; const price = Number(autoconsumption ? inv?.purchase_price : inv?.sale_price) || 0; setCart((current) => { const found = current.find((x) => x.product.id === product.id); if (!found) return [...current, { product, quantity: 1, price }]; if (found.quantity >= max) return current; return current.map((x) => x.product.id === product.id ? { ...x, quantity: x.quantity + 1 } : x) }) }
  const changeQty = (id, delta) => setCart((current) => current.map((x) => x.product.id !== id ? x : { ...x, quantity: Math.min(Number(stock.get(id)?.quantity || 0), Math.max(0, x.quantity + delta)) }).filter((x) => x.quantity > 0))
  const toggleAutoconsumption = (value) => { setAutoconsumption(value); if (value) setDiscount('0'); setCart((current) => current.map((x) => ({ ...x, price: Number(value ? stock.get(x.product.id)?.purchase_price : stock.get(x.product.id)?.sale_price) || 0 }))) }
  const changeMode = (next) => { setMode(next); if (next === 'generic') setParticipants([]); if (next === 'client' && participants.length > 1) setParticipants((p) => p.slice(0, 1)); if (next === 'split') setPayments((p) => p.map((x) => x.method === 'CREDITO' ? { ...x, method: 'EFECTIVO' } : x)) }
  const addClient = (client) => { if (mode === 'client' && participants.length) return; if (mode === 'split') { const next = [...participants, { ...client, percentage: 0 }]; const pct = 100 / next.length; setParticipants(next.map((p) => ({ ...p, percentage: pct }))) } else setParticipants([{ ...client, percentage: 100 }]); setClientSearch('') }
  const removeClient = (id) => setParticipants((p) => p.filter((x) => x.id !== id)); const setClientPct = (id, value) => setParticipants((p) => p.map((x) => x.id === id ? { ...x, percentage: value } : x))
  const changePayment = (i, field, value) => setPayments((p) => p.map((x, n) => n === i ? { ...x, [field]: value } : x))
  const changePaymentMethod = (i, method) => setPayments((current) => current.map((p, n) => n === i ? { ...p, method, amount: String(Math.max(0, total - current.reduce((s, x, k) => k === i ? s : s + Number(x.amount || 0), 0))) } : p))
  const addPayment = () => setPayments((p) => [...p, { method: 'EFECTIVO', amount: String(Math.max(0, total - paid)) }]); const removePayment = (i) => setPayments((p) => p.filter((_, n) => n !== i))
  const customersPayload = () => mode === 'generic' ? [{ allocation_percentage: 100, is_generic: true }] : participants.map((p) => ({ client_id: p.id, allocation_percentage: Number(p.percentage), is_generic: false }))
  const reset = ({ keepLastSale = false } = {}) => { setCart([]); setSearch(''); setMode('generic'); setParticipants([]); setClientSearch(''); setDiscount('0'); setPayments([{ method: 'EFECTIVO', amount: '' }]); setAutoconsumption(false); setActiveDraftId(null); if (!keepLastSale) setLastSale(null) }

  const freeze = async () => {
    if (!cart.length) return setMessage({ type: 'warning', text: 'Agrega productos antes de congelar la venta.' })
    if (mode === 'client' && participants.length !== 1) return setMessage({ type: 'warning', text: 'Selecciona el cliente antes de congelar.' })
    if (mode === 'split' && (participants.length < 2 || Math.abs(allocated - 100) > .01)) return setMessage({ type: 'warning', text: 'La distribución debe sumar 100 % antes de congelar.' })
    setFreezing(true); setMessage(null)
    try {
      const data = { items: cart.map((x) => ({ product_id: x.product.id, quantity: x.quantity })), customers: customersPayload(), discount_percentage: discountValue }
      const draft = autoconsumption ? await congelarVentaAutoconsumo(data, token) : await congelarVenta(data, token)
      setMessage({ type: 'success', text: `Venta ${draft.draft_number} congelada. Puedes atender a otro cliente.` }); reset(); await loadFrozen()
    } catch (e) { if (e.status === 401) return manejarSesionExpirada(); setMessage({ type: 'danger', text: userMessage(e, 'No fue posible congelar la venta.') }) } finally { setFreezing(false) }
  }

  const resume = (draft) => {
    const payload = draft.payload || {}; const restored = (payload.items || []).map((item) => { const product = products.find((p) => p.id === item.product_id); const inv = stock.get(item.product_id); return product ? { product, quantity: Number(item.quantity), price: Number(payload.is_autoconsumption ? inv?.purchase_price : inv?.sale_price) || 0 } : null }).filter(Boolean)
    const restoredClients = (payload.customers || []).filter((c) => c.client_id).map((c) => { const client = clients.find((x) => x.id === c.client_id); return client ? { ...client, percentage: Number(c.allocation_percentage) } : null }).filter(Boolean)
    setCart(restored); setParticipants(restoredClients); setMode(restoredClients.length > 1 ? 'split' : restoredClients.length ? 'client' : 'generic'); setDiscount(String(payload.discount_percentage || 0)); setAutoconsumption(Boolean(payload.is_autoconsumption)); setPayments([{ method: 'EFECTIVO', amount: '' }]); setActiveDraftId(draft.id); setLastSale(null); setTab('sale'); setMessage({ type: 'success', text: `Venta ${draft.draft_number} recuperada.` })
  }

  const submit = async () => {
    if (!cart.length) return setMessage({ type: 'warning', text: 'Agrega al menos un producto a la venta.' })
    if (mode === 'client' && participants.length !== 1) return setMessage({ type: 'warning', text: 'Selecciona un cliente registrado.' })
    if (mode === 'split' && (participants.length < 2 || Math.abs(allocated - 100) > .01)) return setMessage({ type: 'warning', text: 'La distribución debe sumar exactamente 100 %.' })
    if (creditSelected && mode !== 'client') return setMessage({ type: 'warning', text: 'Una venta a crédito requiere un único cliente registrado.' })
    if (!paidOk) return setMessage({ type: 'warning', text: difference > 0 ? 'Aún falta completar el pago.' : 'El pago supera el total.' })
    setSaving(true); setMessage(null)
    try {
      const data = { items: cart.map((x) => ({ product_id: x.product.id, quantity: x.quantity })), customers: customersPayload(), payments: payments.map((p) => ({ payment_method: p.method, amount: Number(p.amount) })), discount_percentage: discountValue }
      const sale = autoconsumption ? await crearVentaAutoconsumo(data, token) : await crearVenta(data, token)
      if (activeDraftId) await eliminarVentaCongelada(activeDraftId, token)
      setLastSale(sale); setMessage({ type: 'success', text: `Venta ${sale.sale_number} realizada correctamente por ${money(sale.total)}.` }); reset({ keepLastSale: true }); await Promise.all([loadCatalog(), loadFrozen()])
    } catch (e) { if (e.status === 401) return manejarSesionExpirada(); setMessage({ type: 'danger', text: userMessage(e, 'No fue posible registrar la venta.') }) } finally { setSaving(false) }
  }
  const print = () => { try { abrirFactura(lastSale) } catch { setMessage({ type: 'warning', text: 'No fue posible generar la factura.' }) } }
  const email = async () => { try { const r = await enviarFacturaPorCorreo(lastSale.id, token); setMessage({ type: 'success', text: `Factura enviada correctamente a ${r.recipients.join(', ')}.` }) } catch (e) { if (e.status === 401) return manejarSesionExpirada(); setMessage({ type: 'danger', text: userMessage(e, 'No fue posible enviar la factura.') }) } }

  if (loading) return <div className="text-center py-5"><div className="spinner-border" /><div className="text-muted mt-2">Preparando POS...</div></div>
  return <>
    <style>{STYLE}</style>
    <div className="d-flex justify-content-between align-items-center mb-2"><div><h3 className="fw-bold mb-0">🛒 POS</h3><div className="small text-muted">Productos · Venta · Cobro</div></div><div className="d-flex gap-2"><button className="btn btn-sm btn-outline-primary" onClick={() => navigate('../ventas/consulta')}>📋 Ventas</button><button className="btn btn-sm btn-outline-secondary" onClick={reset}>Nueva</button></div></div>
    {message && <div className={`alert alert-${message.type} py-2 mb-2`}>{message.text}</div>}
    {lastSale && <div className="alert alert-success py-2 d-flex flex-wrap justify-content-between align-items-center"><span><strong>Venta {lastSale.sale_number}</strong> · {money(lastSale.total)}</span><span className="d-flex gap-2"><button className="btn btn-sm btn-outline-success" onClick={print}>🖨️ Factura</button><Can permission="SALES_EMAIL"><button className="btn btn-sm btn-success" onClick={() => void email()}>✉️ Enviar</button></Can></span></div>}
    <div className="sales-tabs gap-1">{['products','sale','payment'].map((x) => <button key={x} className={`btn btn-sm flex-fill ${tab === x ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab(x)}>{x === 'products' ? '🛍️ Productos' : x === 'sale' ? `🧾 Venta (${cart.length})` : '💳 Cobro'}</button>)}</div>
    <div className="row g-2 sales-pos">
      <div className={`col-lg-4 sales-pos-col sales-product-col sales-panel ${tab === 'products' ? 'active' : ''}`}><div className="card border-0 shadow-sm h-100"><div className="card-body p-2"><div className="input-group input-group-sm mb-2"><span className="input-group-text">🔎</span><input className="form-control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto..." /></div><div className="small text-muted mb-2">⭐ Productos destacados · escribe un nombre o código para buscar otros</div><div className="sales-grid">{shownProducts.map((p) => { const inv = stock.get(p.id); const qty = Number(inv?.quantity || 0); const price = Number(autoconsumption ? inv?.purchase_price : inv?.sale_price) || 0; return <button key={p.id} className="sales-product p-0" onClick={() => addProduct(p)} disabled={!qty}>{p.image_url ? <img src={p.image_url} alt={p.name} className="sales-img" /> : <div className="sales-placeholder">📦</div>}<div className="p-2"><div className="small text-muted text-truncate">{p.code}</div><div className="fw-semibold small text-truncate">{p.name}</div><div className="fw-bold small">{money(price)}</div><span className={`badge ${qty ? 'text-bg-success' : 'text-bg-secondary'}`}>{qty}</span></div></button> })}</div>{search.trim() && !shownProducts.length && <div className="small text-muted text-center py-4">No encontramos productos con ese criterio.</div>}</div></div></div>
      <div className={`col-lg-5 sales-pos-col sales-panel ${tab === 'sale' ? 'active' : ''}`}><div className="card border-0 shadow-sm h-100"><div className="card-header bg-body d-flex justify-content-between align-items-center"><strong>🧾 Venta actual</strong><Can permission="SALES_AUTOCONSUME"><div className="form-check form-switch mb-0"><input className="form-check-input" type="checkbox" checked={autoconsumption} onChange={(e) => toggleAutoconsumption(e.target.checked)} id="sale-autoconsumption" /><label className="form-check-label small" htmlFor="sale-autoconsumption">Precio de compra</label></div></Can></div><div className="card-body p-2">{autoconsumption && <div className="alert alert-warning py-2 small">🎁 Autoconsumo: precio de compra, sin ganancia.</div>}{!cart.length && <div className="text-center text-muted py-4">Selecciona productos del catálogo.<br />La venta aparecerá aquí.</div>}{cart.map((x) => <div className="border-bottom py-2" key={x.product.id}><div className="d-flex justify-content-between"><div><div className="fw-semibold small">{x.product.name}</div><div className="text-muted small">{money(x.price)} c/u</div></div><strong className="small">{money(x.price * x.quantity)}</strong></div><div className="d-flex justify-content-between mt-1"><div className="btn-group btn-group-sm"><button className="btn btn-outline-secondary" onClick={() => changeQty(x.product.id,-1)}>−</button><span className="btn btn-light disabled">{x.quantity}</span><button className="btn btn-outline-secondary" onClick={() => changeQty(x.product.id,1)}>+</button></div><button className="btn btn-sm btn-link text-danger" onClick={() => changeQty(x.product.id,-x.quantity)}>Quitar</button></div></div>)}<hr className="my-2"/><label className="form-label small fw-semibold">👥 Destino de la venta</label><div className="btn-group w-100 btn-group-sm mb-2"><button className={`btn ${mode === 'generic' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => changeMode('generic')}>Consumidor final</button><button className={`btn ${mode === 'client' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => changeMode('client')}>Cliente</button><button className={`btn ${mode === 'split' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => changeMode('split')}>Venta dividida</button></div>{mode === 'generic' && <div className="alert alert-light border py-2 small mb-2">Consumidor final · sin cliente registrado</div>}{mode !== 'generic' && <><input className="form-control form-control-sm mb-2" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Buscar cliente por nombre o identificación..."/><div className="list-group mb-2">{filteredClients.map((c) => <button key={c.id} className="list-group-item list-group-item-action py-1 small" onClick={() => addClient(c)}>{c.full_name}<span className="text-muted ms-2">{c.identification_number || ''}</span></button>)}</div></>}{participants.map((p) => <div className="border rounded p-2 mb-2" key={p.id}><div className="d-flex justify-content-between align-items-start small"><div><strong>{p.full_name}</strong><div className="text-muted">Cupo disponible: <strong>{money(availableCredit(p))}</strong></div></div><button className="btn btn-sm btn-link text-danger p-0" onClick={() => removeClient(p.id)}>×</button></div>{mode === 'split' && <div className="input-group input-group-sm mt-1"><input className="form-control" type="number" value={p.percentage} min="0.01" max="100" step="0.01" onChange={(e) => setClientPct(p.id,e.target.value)}/><span className="input-group-text">%</span></div>}</div>)}{mode === 'split' && <div className={`alert py-1 small ${Math.abs(allocated-100)<.01 ? 'alert-success' : 'alert-warning'}`}>{Math.abs(allocated-100)<.01 ? '✓ 100 % distribuido' : `Faltan ${remaining.toFixed(2)} %`}</div>}</div></div></div>
      <div className={`col-lg-3 sales-pos-col sales-panel ${tab === 'payment' ? 'active' : ''}`}><div className="card border-0 shadow-sm h-100"><div className="card-header bg-body fw-bold">💳 Cobro</div><div className="card-body p-2 d-flex flex-column"><div className="d-flex justify-content-between small"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="d-flex justify-content-between small"><span>Descuento</span><strong>{money(discountAmount)}</strong></div><hr className="my-2"/><div className="d-flex justify-content-between"><strong>TOTAL</strong><strong className="fs-4">{money(total)}</strong></div>{!autoconsumption && <div className="input-group input-group-sm my-2"><span className="input-group-text">%</span><input className="form-control" type="number" min="0" max="100" value={discount} onChange={(e) => setDiscount(e.target.value)}/><span className="input-group-text">descuento</span></div>}<div className="d-flex justify-content-between align-items-center mt-2 mb-1"><span className="small fw-semibold">Pagos</span><button className="btn btn-sm btn-link p-0" onClick={addPayment}>+ método</button></div>{payments.map((p,i) => <div className="input-group input-group-sm mb-2" key={i}><select className="form-select" value={p.method} onChange={(e) => changePaymentMethod(i,e.target.value)}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select><input className="form-control" type="number" min="0" value={p.amount} onChange={(e) => changePayment(i,'amount',e.target.value)}/><button className="btn btn-outline-danger" disabled={payments.length===1} onClick={() => removePayment(i)}>×</button></div>)}<div className={`alert py-2 small ${paidOk ? 'alert-success' : 'alert-warning'}`}>{paidOk ? '✓ Pago completo' : difference > 0 ? `Faltan ${money(difference)}` : `Sobran ${money(Math.abs(difference))}`}</div><div className="mt-auto d-grid gap-2"><button className="btn btn-outline-warning" disabled={!cart.length || freezing || saving} onClick={() => void freeze()}>{freezing ? 'Congelando...' : '⏸️ Congelar venta'}</button><button className="btn btn-primary btn-lg" disabled={!cart.length || !paidOk || saving || freezing} onClick={() => void submit()}>{saving ? 'Registrando...' : '✓ Registrar venta'}</button></div></div></div></div>
    </div>
    <div className="card border-0 shadow-sm mt-2"><div className="card-header bg-body d-flex justify-content-between"><strong>⏸️ Ventas congeladas</strong><span className="badge text-bg-secondary">{frozen.length}</span></div><div className="card-body p-2">{!frozen.length ? <div className="small text-muted">No hay ventas congeladas. Puedes congelar una para atender a otro cliente y recuperarla después.</div> : <div className="row g-2">{frozen.map((d) => <div className="col-md-6 col-xl-4" key={d.id}><div className="border rounded p-2 d-flex justify-content-between align-items-center"><div><strong>{d.draft_number}</strong><div className="small text-muted">{d.payload?.items?.length || 0} producto(s){d.payload?.is_autoconsumption ? ' · Autoconsumo' : ''}</div></div><button className="btn btn-sm btn-outline-primary" onClick={() => resume(d)}>Recuperar</button></div></div>)}</div>}</div></div>
  </>
}
