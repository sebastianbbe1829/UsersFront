import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Can from '../components/Can'
import SessionManager from '../components/SessionManager'
import { crearMovimientoInventario, devolverMovimientoInventario, obtenerMovimientosInventario, obtenerProductosInventario } from '../services/inventoryApi'
import { emptyMovement, EmptyState, money, MovementBadge, MovementModal, Pagination, PAGE_SIZE, number } from './InventoryShared'

const ORIGIN_LABELS = {
  PURCHASE: 'Compra',
  SALE: 'Venta',
  MANUAL_ADJUSTMENT: 'Ajuste manual',
  SALES_RETURN: 'Devolución de venta',
  PURCHASE_RETURN: 'Devolución de compra',
  REVERSAL: 'Reversión',
}

const formatFechaColombia = (value) => {
  if (!value) return '-'
  const normalized = typeof value === 'string' && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? `${value}Z` : value
  return new Date(normalized).toLocaleString('es-CO', { timeZone: 'America/Bogota' })
}

function InventoryMovementsPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const tokenRef = useRef(token)
  const cargaInicialRef = useRef(false)
  const [productos, setProductos] = useState([])
  const [productoId, setProductoId] = useState('')
  const [movimientos, setMovimientos] = useState([])
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [cargandoProductos, setCargandoProductos] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [devolviendo, setDevolviendo] = useState(null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyMovement)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => { tokenRef.current = token }, [token])

  const cargarProductos = useCallback(async () => {
    const tokenActual = tokenRef.current
    if (!tokenActual) return
    try { setCargandoProductos(true); const result = await obtenerProductosInventario(tokenActual, true); setProductos(Array.isArray(result) ? result : []) }
    catch (error) { if (error.status === 401) manejarSesionExpirada(); else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar los productos.' }) }
    finally { setCargandoProductos(false) }
  }, [manejarSesionExpirada])

  const cargarMovimientos = useCallback(async (id, requestedPage = 1) => {
    if (!id) { setMovimientos([]); setHasNext(false); return }
    try { setCargando(true); const result = await obtenerMovimientosInventario(id, tokenRef.current, { limit: PAGE_SIZE + 1, offset: (requestedPage - 1) * PAGE_SIZE }); const rows = Array.isArray(result) ? result : []; setMovimientos(rows.slice(0, PAGE_SIZE)); setHasNext(rows.length > PAGE_SIZE); setPage(requestedPage); setMensaje(null) }
    catch (error) { if (error.status === 401) manejarSesionExpirada(); else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar el kardex.' }) }
    finally { setCargando(false) }
  }, [manejarSesionExpirada])

  useEffect(() => { if (token && !cargaInicialRef.current) { cargaInicialRef.current = true; void cargarProductos() } }, [token, cargarProductos])
  useEffect(() => { if (productoId) void cargarMovimientos(productoId, 1); else setMovimientos([]) }, [productoId, cargarMovimientos])

  const abrir = () => { setForm({ ...emptyMovement, product_id: productoId }); setModal(true) }
  const cerrar = () => { setModal(false); setForm(emptyMovement) }
  const origenCambia = (value) => setForm({ ...form, origin_type: value, movement_type: value === 'PURCHASE' || value === 'SALES_RETURN' ? 'ENTRY' : 'EXIT' })
  const guardar = async (event) => {
    event.preventDefault(); setGuardando(true); setMensaje(null)
    try {
      const data = { ...form, product_id: Number(form.product_id), quantity: Number(form.quantity), unit_purchase_price: form.unit_purchase_price === '' ? null : Number(form.unit_purchase_price), profit_percentage: form.profit_percentage === '' ? null : Number(form.profit_percentage), notes: form.notes.trim() || null }
      await crearMovimientoInventario(data, token); const id = String(data.product_id); setProductoId(id); cerrar(); await cargarMovimientos(id, 1); setMensaje({ tipo: 'success', texto: 'Movimiento registrado correctamente.' })
    } catch (error) { if (error.status === 401) manejarSesionExpirada(); else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible registrar el movimiento.' }) }
    finally { setGuardando(false) }
  }

  const devolver = async (item) => {
    const confirmar = window.confirm(`¿Desea devolver el movimiento de ${number(item.quantity)} unidades?\n\nSe creará automáticamente el movimiento inverso con los mismos valores del movimiento original.`)
    if (!confirmar) return
    setDevolviendo(item.id); setMensaje(null)
    try {
      await devolverMovimientoInventario(item.id, token)
      await cargarMovimientos(productoId, page)
      setMensaje({ tipo: 'success', texto: 'Movimiento devuelto correctamente.' })
    } catch (error) { if (error.status === 401) manejarSesionExpirada(); else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible devolver el movimiento.' }) }
    finally { setDevolviendo(null) }
  }

  return <>
    <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4"><div><h2 className="fw-bold mb-1">Movimientos</h2><p className="text-muted mb-0">Registra entradas y salidas y consulta el Kardex. El inventario solo cambia mediante movimientos.</p></div><Can permission="INVENTORY_MOVEMENT_CREATE"><button type="button" className="btn btn-primary" onClick={abrir}>+ Registrar movimiento</button></Can></div>
    {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}
    <div className="card shadow-sm border-0"><div className="card-body">
      <div className="mb-4"><label className="form-label fw-semibold">Producto</label>{cargandoProductos ? <div className="text-muted">Cargando productos...</div> : <select className="form-select" value={productoId} onChange={(e) => { setProductoId(e.target.value); setPage(1) }}><option value="">Seleccione producto...</option>{productos.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select>}</div>
      {cargando && <div className="text-center py-4"><div className="spinner-border spinner-border-sm" /> <span className="text-muted ms-2">Cargando Kardex...</span></div>}
      {!cargando && !productoId && <EmptyState text="Seleccione un producto para consultar sus movimientos." />}
      {!cargando && productoId && movimientos.length === 0 && <EmptyState text="Este producto todavía no tiene movimientos." />}
      {!cargando && movimientos.length > 0 && <><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Fecha</th><th>Tipo</th><th>Origen</th><th className="text-end">Cantidad</th><th className="text-end">Precio compra</th><th className="text-end">Antes</th><th className="text-end">Después</th><th>Notas</th><th>Acción</th></tr></thead><tbody>{movimientos.map((item) => <tr key={item.id}><td>{formatFechaColombia(item.created_at)}</td><td><MovementBadge type={item.movement_type} /></td><td>{ORIGIN_LABELS[item.origin_type] || item.origin_type}</td><td className="text-end">{number(item.quantity)}</td><td className="text-end">{money(item.unit_purchase_price)}</td><td className="text-end">{number(item.balance_before)}</td><td className="text-end fw-semibold">{number(item.balance_after)}</td><td>{item.notes || '-'}</td><td>{item.origin_type !== 'REVERSAL' ? <Can permission="INVENTORY_MOVEMENT_CREATE"><button type="button" className="btn btn-sm btn-outline-secondary" disabled={devolviendo === item.id} onClick={() => devolver(item)}>{devolviendo === item.id ? 'Devolviendo...' : '↩ Devolver'}</button></Can> : <span className="text-muted">-</span>}</td></tr>)}</tbody></table></div><Pagination total={page * PAGE_SIZE + (hasNext ? 1 : 0)} page={page} onPageChange={(next) => cargarMovimientos(productoId, next)} hasNext={hasNext} /></>}
    </div></div>
    {modal && <MovementModal form={form} setForm={setForm} productos={productos} guardando={guardando} onClose={cerrar} onSubmit={guardar} onOriginChange={origenCambia} />}
  </>
}
export default InventoryMovementsPage
