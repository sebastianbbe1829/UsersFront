import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Can from '../components/Can'
import { obtenerClientes } from '../services/clientsApi'
import { obtenerInventario, obtenerProductosInventario } from '../services/inventoryApi'
import { crearVenta, enviarFacturaPorCorreo } from '../services/salesApi'
import { abrirFactura } from '../utils/salesInvoice'

const money = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v || 0))
const toCents = (value) => Math.round((Number(value) || 0) * 100)
const fromCents = (cents) => cents / 100
const roundMoney = (value) => fromCents(toCents(value))
const METHODS = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'PSE', 'OTRO', 'CREDITO']

const mensajeUsuario = (error, fallback) => {
  const raw = String(error?.message || '').trim()
  const creditMatch = raw.match(/Client credit limit exceeded\.\s*Available credit:\s*([\d.,]+)/i)
  if (creditMatch) {
    const available = Number(creditMatch[1].replace(/,/g, ''))
    return `El cupo de crédito del cliente no es suficiente. Cupo disponible: ${money(available)}.`
  }
  if (/Payment total must equal sale total/i.test(raw)) return 'El valor de los pagos debe coincidir exactamente con el total de la venta.'
  if (/Insufficient stock|not enough stock|stock available/i.test(raw)) return 'No hay inventario suficiente para uno de los productos seleccionados.'
  if (/not eligible for sale|client.*not.*eligible/i.test(raw)) return 'El cliente seleccionado no está habilitado para realizar esta venta.'
  if (/compliance|restrictive list|listed|blocked/i.test(raw)) return 'El cliente tiene una restricción que impide realizar esta venta.'
  if (/Product .* not found|product.*not found/i.test(raw)) return 'Uno de los productos seleccionados ya no está disponible.'
  if (/Client .* not found|client.*not found/i.test(raw)) return 'El cliente seleccionado ya no está disponible.'
  if (/credit.*limit|available credit/i.test(raw)) return 'El cupo de crédito disponible del cliente no es suficiente para esta venta.'
  return fallback
}

const tituloMensaje = (type) => {
  if (type === 'success') return 'Operación exitosa'
  if (type === 'warning') return 'Revisa la información'
  return 'No fue posible completar la operación'
}

export default function SalesCheckoutPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([]); const [inventory, setInventory] = useState([]); const [clients, setClients] = useState([])
  const [cart, setCart] = useState([]); const [search, setSearch] = useState(''); const [clientSearch, setClientSearch] = useState(''); const [mode, setMode] = useState('generic'); const [participants, setParticipants] = useState([])
  const [discount, setDiscount] = useState('0'); const [payments, setPayments] = useState([{ method: 'EFECTIVO', amount: '' }]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [sending, setSending] = useState(false); const [message, setMessage] = useState(null); const [lastSale, setLastSale] = useState(null); const [creditModal, setCreditModal] = useState(false)

  useEffect(() => {
    if (!token) return undefined
    let cancelled = false
    const load = async () => {
      try {
        const [p, i, c] = await Promise.all([obtenerProductosInventario(token, true), obtenerInventario(token), obtenerClientes(token, { page: 1, pageSize: 100 })])
        if (cancelled) return
        setProducts(Array.isArray(p) ? p : []); setInventory(Array.isArray(i) ? i : []); setClients(Array.isArray(c?.items) ? c.items : Array.isArray(c) ? c : [])
      } catch (e) {
        if (!cancelled) { if (e.status === 401) return manejarSesionExpirada(); setMessage({ type: 'danger', text: mensajeUsuario(e, 'No fue posible cargar el punto de venta.') }) }
      } finally { if (!cancelled) setLoading(false) }
    }
    void load(); return () => { cancelled = true }
  }, [manejarSesionExpirada, token])

  const stock = useMemo(() => new Map(inventory.map((i) => [i.product_id, i])), [inventory])
  const shownProducts = useMemo(() => { const t = search.trim().toLowerCase(); return products.filter((p) => !t || `${p.code || ''} ${p.name || ''}`.toLowerCase().includes(t)) }, [products, search])
  const subtotalCents = useMemo(() => cart.reduce((s, i) => s + Math.round(Math.round(Number(i.price) || 0) * Number(i.quantity)) * 100, 0), [cart])
  const subtotal = fromCents(subtotalCents)
  const discountValue = Math.min(100, Math.max(0, Number(discount) || 0)); const discountAmountCents = Math.round(subtotalCents * discountValue / 100); const totalCents = subtotalCents - discountAmountCents; const discountAmount = fromCents(discountAmountCents); const total = fromCents(totalCents)
  const effectivePayments = useMemo(() => payments.map((p) => {
    if (p.method === 'CREDITO' && mode === 'client') return { ...p, amount: String(Math.round(total)) }
    if (!p.amount && payments.length === 1) return { ...p, amount: String(Math.round(total)) }
    return p
  }), [payments, mode, total])
  const paidCents = effectivePayments.reduce((s, p) => s + toCents(p.amount), 0); const differenceCents = totalCents - paidCents; const paidOk = differenceCents === 0
  const allocated = participants.reduce((s, p) => s + (Number(p.percentage) || 0), 0); const remaining = Math.max(0, 100 - allocated)
  const filteredClients = useMemo(() => { const t = clientSearch.trim().toLowerCase(); const a = clients.filter((c) => !participants.some((p) => p.id === c.id)); return (t ? a.filter((c) => `${c.full_name || ''} ${c.identification_number || ''}`.toLowerCase().includes(t)) : a).slice(0, 8) }, [clientSearch, clients, participants])
  const creditSelected = effectivePayments.some((p) => p.method === 'CREDITO' && Number(p.amount) > 0); const creditClient = mode === 'client' && participants.length === 1 ? participants[0] : null

  const addProduct = (product) => { const max = Number(stock.get(product.id)?.quantity || 0); if (max <= 0) return; setCart((c) => { const f = c.find((x) => x.product.id === product.id); if (!f) return [...c, { product, quantity: 1, price: Number(stock.get(product.id)?.sale_price || 0) }]; if (f.quantity >= max) return c; return c.map((x) => x.product.id === product.id ? { ...x, quantity: x.quantity + 1 } : x) }) }
  const changeQty = (id, delta) => setCart((c) => c.map((x) => x.product.id !== id ? x : { ...x, quantity: Math.min(Number(stock.get(id)?.quantity || 0), Math.max(0, x.quantity + delta)) }).filter((x) => x.quantity > 0))
  const changeMode = (nextMode) => { setMode(nextMode); if (nextMode === 'split') setPayments((current) => current.map((p) => p.method === 'CREDITO' ? { ...p, method: 'EFECTIVO' } : p)); if (nextMode === 'generic') setParticipants([]); if (nextMode === 'client' && participants.length > 1) setParticipants((current) => current.slice(0, 1)) }
  const addClient = (client) => {
    if (mode === 'client' && participants.length) return
    if (mode === 'split') {
      setParticipants((current) => {
        const next = [...current, { ...client, percentage: 0 }]
        const percentage = 100 / next.length
        return next.map((participant) => ({ ...participant, percentage }))
      })
    } else {
      setParticipants((current) => [...current, { ...client, percentage: 100 }])
    }
    setClientSearch('')
  }
  const removeClient = (id) => setParticipants((p) => p.filter((x) => x.id !== id)); const setClientPct = (id, value) => setParticipants((p) => p.map((x) => x.id === id ? { ...x, percentage: value } : x))
  const addPayment = () => { const rCents = Math.max(0, totalCents - paidCents); setPayments((p) => [...p, { method: 'EFECTIVO', amount: rCents ? String(fromCents(rCents)) : '' }]) }
  const removePayment = (i) => setPayments((p) => p.filter((_, n) => n !== i))
  const setPayment = (i, field, value) => setPayments((p) => p.map((x, n) => n === i ? { ...x, [field]: value } : x))
  const changePaymentMethod = (i, value) => {
    setPayments((current) => current.map((x, n) => {
      if (n !== i) return x
      const otherPaidCents = current.reduce((sum, payment, index) => index === i ? sum : sum + toCents(payment.amount), 0)
      const suggestedCents = Math.max(0, totalCents - otherPaidCents)
      return { ...x, method: value, amount: String(fromCents(suggestedCents)) }
    }))
    if (value === 'CREDITO' && mode !== 'client') setCreditModal(true)
  }
  const reset = () => { setCart([]); setSearch(''); setMode('generic'); setParticipants([]); setClientSearch(''); setDiscount('0'); setPayments([{ method: 'EFECTIVO', amount: '' }]); setLastSale(null); setMessage(null); setCreditModal(false) }

  const submit = async () => {
    if (!cart.length) return setMessage({ type: 'warning', text: 'Agrega al menos un producto a la venta.' })
    if (mode === 'client' && participants.length !== 1) return setMessage({ type: 'warning', text: 'Selecciona un cliente registrado.' })
    if (mode === 'split' && (participants.length < 2 || Math.abs(allocated - 100) > 0.01)) return setMessage({ type: 'warning', text: 'La distribución de clientes debe sumar exactamente 100 %.' })
    if (creditSelected && mode !== 'client') return setMessage({ type: 'warning', text: 'Las ventas fiadas no se pueden dividir y requieren un único cliente registrado.' })
    if (creditSelected && !creditClient) return setMessage({ type: 'warning', text: 'Selecciona un cliente registrado para una venta fiada.' })
    if (!paidOk) return setMessage({ type: 'warning', text: differenceCents > 0 ? 'Aún falta completar el pago de la venta.' : 'El pago supera el total de la venta.' })
    setSaving(true); setMessage(null)
    try {
      const customers = mode === 'generic' ? [{ allocation_percentage: 100, is_generic: true }] : participants.map((p) => ({ client_id: p.id, allocation_percentage: Number(p.percentage), is_generic: false }))
      const sale = await crearVenta({ items: cart.map((x) => ({ product_id: x.product.id, quantity: x.quantity })), customers, payments: effectivePayments.map((p) => ({ payment_method: p.method, amount: Math.round(Number(p.amount) || 0) })), discount_percentage: roundMoney(discountValue) }, token)
      setLastSale(sale); setMessage({ type: 'success', text: `Venta ${sale.sale_number} realizada correctamente por ${money(sale.total)}.` })
      setCart([]); setMode('generic'); setParticipants([]); setClientSearch(''); setDiscount('0'); setPayments([{ method: 'EFECTIVO', amount: '' }])
      const [p, i] = await Promise.all([obtenerProductosInventario(token, true), obtenerInventario(token)]); setProducts(Array.isArray(p) ? p : []); setInventory(Array.isArray(i) ? i : [])
    } catch (e) { if (e.status === 401) return manejarSesionExpirada(); setMessage({ type: e.status === 503 ? 'warning' : 'danger', text: mensajeUsuario(e, 'No fue posible registrar la venta. Verifica la información e inténtalo nuevamente.') }) } finally { setSaving(false) }
  }
  const print = () => { try { abrirFactura(lastSale) } catch (e) { setMessage({ type: 'warning', text: mensajeUsuario(e, 'No fue posible generar la factura.') }) } }
  const email = async () => { setSending(true); try { const r = await enviarFacturaPorCorreo(lastSale.id, token); setMessage({ type: 'success', text: `Factura enviada correctamente a ${r.recipients.join(', ')}.` }) } catch (e) { if (e.status === 401) return manejarSesionExpirada(); setMessage({ type: e.status === 503 ? 'warning' : 'danger', text: mensajeUsuario(e, 'No fue posible enviar la factura por correo.') }) } finally { setSending(false) } }

  if (loading) return <div className="text-center py-5"><div className="spinner-border" /><div className="text-muted mt-2">Preparando punto de venta...</div></div>
  return <>
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4"><div><h2 className="fw-bold mb-1">🛒 Punto de venta</h2><p className="text-muted mb-0">Selecciona productos, cliente, descuento y forma de pago en una sola pantalla.</p></div><div className="d-flex gap-2"><button className="btn btn-outline-primary" onClick={() => navigate('../ventas/consulta')}>📋 Consultar ventas</button><button className="btn btn-outline-secondary" onClick={reset} disabled={saving}>Nueva venta</button></div></div>
    {lastSale && <div className="card shadow-sm border-0 mb-4"><div className="card-body d-flex flex-wrap justify-content-between align-items-center gap-3"><div><strong>🧾 Venta {lastSale.sale_number}</strong><div className="text-muted">Total: {money(lastSale.total)}</div></div><div className="d-flex gap-2 flex-wrap"><button className="btn btn-outline-secondary" onClick={print}>🖨️ Imprimir factura</button><Can permission="SALES_EMAIL"><button className="btn btn-primary" onClick={() => void email()} disabled={sending}>{sending ? 'Enviando...' : '✉️ Enviar factura'}</button></Can><button className="btn btn-outline-primary" onClick={() => navigate('../ventas/consulta')}>📋 Ver ventas</button></div></div></div>}
    <div className="row g-4"><div className="col-xl-8"><div className="card shadow-sm border-0 mb-4"><div className="card-body"><div className="input-group input-group-lg"><span className="input-group-text">🔎</span><input className="form-control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o código..." /></div></div></div><div className="row g-3">{shownProducts.map((p) => { const q = Number(stock.get(p.id)?.quantity || 0); const price = Number(stock.get(p.id)?.sale_price || 0); return <div className="col-sm-6 col-lg-4" key={p.id}><button className="card h-100 w-100 text-start border-0 shadow-sm overflow-hidden" onClick={() => addProduct(p)} disabled={!q}>{p.image_url ? <img src={p.image_url} alt={p.name} className="w-100" style={{ height: 170, objectFit: 'cover' }} /> : <div className="d-flex align-items-center justify-content-center bg-body-tertiary" style={{ height: 170, fontSize: 52 }}>📦</div>}<div className="card-body"><div className="d-flex justify-content-between gap-2 mb-3"><span className="small text-muted">{p.code}</span><span className={q ? 'badge text-bg-success' : 'badge text-bg-secondary'}>{q ? `${q} disponibles` : 'Sin stock'}</span></div><div className="fw-bold">{p.name}</div><div className="mt-3 fw-bold fs-5">{money(price)}</div></div></button></div> })}</div></div>
      <div className="col-xl-4"><div className="card shadow-sm border-0 position-sticky" style={{ top: 20 }}><div className="card-header bg-white fw-bold fs-5">🧾 Tu venta</div><div className="card-body position-relative">{saving && <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-body bg-opacity-75 rounded" style={{ zIndex: 10 }}><div className="spinner-border mb-3" role="status" aria-hidden="true" /><strong>Registrando venta...</strong><span className="small text-muted mt-1">Procesando la venta y actualizando inventario</span></div>}{!cart.length && <div className="text-center text-muted py-4">Tu carrito está vacío.<br />Selecciona productos para comenzar.</div>}{cart.map((x) => <div className="border-bottom py-3" key={x.product.id}><div className="fw-semibold">{x.product.name}</div><div className="small text-muted">{money(x.price)} c/u</div><div className="d-flex justify-content-between align-items-center mt-2"><div className="btn-group"><button className="btn btn-outline-secondary btn-sm" onClick={() => changeQty(x.product.id, -1)}>−</button><span className="btn btn-light btn-sm">{x.quantity}</span><button className="btn btn-outline-secondary btn-sm" onClick={() => changeQty(x.product.id, 1)}>+</button></div><strong>{money(Math.round(Number(x.price) * Number(x.quantity)))}</strong></div></div>)}
        <hr /><label className="form-label fw-semibold">👥 Cliente(s)</label><div className="btn-group w-100 mb-2"><button className={`btn ${mode === 'generic' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => changeMode('generic')}>Consumidor final</button><button className={`btn ${mode === 'client' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => changeMode('client')}>Un cliente</button><button className={`btn ${mode === 'split' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => changeMode('split')}>Dividir</button></div>{mode === 'split' && <div className="small text-muted mb-2">Las ventas divididas son únicamente de contado.</div>}{mode !== 'generic' && <><input className="form-control mb-2" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Buscar cliente..." /><div className="list-group mb-2">{filteredClients.map((c) => <button type="button" className="list-group-item list-group-item-action" key={c.id} onClick={() => addClient(c)}><div>{c.full_name}</div><small className="text-muted">Cupo aprobado: {money(c.credit_limit)}</small></button>)}</div>{participants.map((p) => <div className="border rounded p-2 mb-2" key={p.id}><div className="d-flex justify-content-between"><strong className="small">{p.full_name}</strong><button className="btn btn-sm btn-outline-danger" onClick={() => removeClient(p.id)}>×</button></div><div className="input-group input-group-sm mt-2"><input type="number" min="0.01" max="100" step="0.01" className="form-control" value={p.percentage} onChange={(e) => setClientPct(p.id, e.target.value)} /><span className="input-group-text">%</span></div>{mode === 'split' && <div className="small text-primary mt-2"><strong>Valor a cobrar: {money(Math.round(total * (Number(p.percentage) || 0) / 100))}</strong></div>}</div>)}{mode === 'split' && <div className={`alert py-2 ${Math.abs(allocated - 100) < .01 ? 'alert-success' : 'alert-warning'}`}>{Math.abs(allocated - 100) < .01 ? '✓ Distribución al 100 %' : `Faltan ${remaining.toFixed(2)} %`}</div>}</>}
        <div className="d-flex justify-content-between"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="d-flex align-items-center justify-content-between gap-2 mt-2"><span>Descuento (%)</span><input type="number" min="0" max="100" step="0.01" className="form-control form-control-sm" style={{ width: 100 }} value={discount} onChange={(e) => setDiscount(e.target.value)} /></div><div className="d-flex justify-content-between text-muted mt-2"><span>Descuento</span><span>- {money(discountAmount)}</span></div><div className="d-flex justify-content-between fs-5 mt-3"><span>Total</span><strong>{money(total)}</strong></div><hr /><div className="d-flex justify-content-between align-items-center mb-2"><label className="form-label fw-semibold mb-0">💳 Pagos</label><button className="btn btn-sm btn-outline-primary" onClick={addPayment} disabled={!totalCents || paidCents >= totalCents}>+ Agregar</button></div>{effectivePayments.map((p, i) => <div className="input-group input-group-sm mb-2" key={i}><select className="form-select" value={p.method} onChange={(e) => changePaymentMethod(i, e.target.value)}>{METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</select><input type="number" min="0" step="1" className="form-control" value={p.amount} onChange={(e) => setPayment(i, 'amount', e.target.value)} placeholder="Valor" disabled={p.method === 'CREDITO'} />{payments.length > 1 && <button className="btn btn-outline-danger" onClick={() => removePayment(i)}>×</button>}</div>)}<div className={`small ${paidOk ? 'text-success' : 'text-warning'}`}>{paidOk ? '✓ Pago completo' : differenceCents > 0 ? `Faltan ${money(fromCents(differenceCents))}` : `Excede ${money(fromCents(Math.abs(differenceCents)))}`}</div><button className="btn btn-primary w-100 mt-3" disabled={saving || !cart.length} onClick={() => void submit()}>{saving && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />}{saving ? 'Registrando venta...' : 'Registrar venta'}</button>
      </div></div></div></div>
    {creditModal && <><div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true" style={{ zIndex: 1060 }}><div className="modal-dialog modal-dialog-centered"><div className="modal-content shadow"><div className="modal-header"><h5 className="modal-title">Venta fiada</h5><button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setCreditModal(false)} /></div><div className="modal-body"><div className="alert alert-warning mb-0">Venta fiada: solo un cliente registrado. El valor de la cuenta se completa automáticamente con el total de la venta.</div></div><div className="modal-footer"><button type="button" className="btn btn-primary" onClick={() => setCreditModal(false)}>Aceptar</button></div></div></div></div><div className="modal-backdrop show" style={{ zIndex: 1055 }} onClick={() => setCreditModal(false)} /></>}
    {message && <><div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true" style={{ zIndex: 1060 }}><div className="modal-dialog modal-dialog-centered"><div className="modal-content shadow"><div className="modal-header"><h5 className="modal-title">{tituloMensaje(message.type)}</h5><button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setMessage(null)} /></div><div className="modal-body"><div className={`alert alert-${message.type} mb-0`}>{message.text}</div></div><div className="modal-footer"><button type="button" className="btn btn-primary" onClick={() => setMessage(null)}>Aceptar</button></div></div></div></div><div className="modal-backdrop show" style={{ zIndex: 1055 }} onClick={() => setMessage(null)} /></>}
  </>
}