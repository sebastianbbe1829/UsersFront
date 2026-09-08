import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Can from '../components/Can'
import SessionManager from '../components/SessionManager'
import { crearMovimientoInventario, devolverMovimientoInventario, exportarKardexExcel, obtenerMovimientosInventario, obtenerProductosInventario } from '../services/inventoryApi'
import { emptyMovement, EmptyState, money, MovementBadge, MovementModal, Pagination, PAGE_SIZE, number, ReversalModal } from './InventoryShared'

const ORIGIN_LABELS = { PURCHASE: 'Compra', SALE: 'Venta', MANUAL_ADJUSTMENT: 'Ajuste de inventario', SALES_RETURN: 'Devolución de venta', PURCHASE_RETURN: 'Devolución de compra', REVERSAL: 'Reversión' }
const OPERATION_MOVEMENT_TYPES = { PURCHASE: 'ENTRY', SALE: 'EXIT', SALES_RETURN: 'ENTRY', PURCHASE_RETURN: 'EXIT' }
const formatFechaColombia = (value) => { if (!value) return '-'; const normalized = typeof value === 'string' && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? `${value}Z` : value; return new Date(normalized).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) }
function descargarArchivo(blob, filename) { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url) }

function InventoryMovementsPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const tokenRef = useRef(token)
  const cargaInicialRef = useRef(false)
  const [productos, setProductos] = useState([])
  const [productoId, setProductoId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [movimientos, setMovimientos] = useState([])
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [cargandoProductos, setCargandoProductos] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [devolviendo, setDevolviendo] = useState(null)
  const [exportando, setExportando] = useState(false)
  const [modal, setModal] = useState(false)
  const [movimientoAReversar, setMovimientoAReversar] = useState(null)
  const [form, setForm] = useState(emptyMovement)
  const [mensaje, setMensaje] = useState(null)
  useEffect(() => { tokenRef.current = token }, [token])

  const cargarProductos = useCallback(async () => { const tokenActual = tokenRef.current; if (!tokenActual) return; try { setCargandoProductos(true); const result = await obtenerProductosInventario(tokenActual, true); setProductos(Array.isArray(result) ? result : []) } catch (error) { if (error.status === 401) manejarSesionExpirada(); else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar los productos.' }) } finally { setCargandoProductos(false) } }, [manejarSesionExpirada])
  const cargarMovimientos = useCallback(async (requestedPage = 1) => { try { setCargando(true); const result = await obtenerMovimientosInventario(productoId, tokenRef.current, { limit: PAGE_SIZE + 1, offset: (requestedPage - 1) * PAGE_SIZE, fromDate, toDate }); const rows = Array.isArray(result) ? result : []; setMovimientos(rows.slice(0, PAGE_SIZE)); setHasNext(rows.length > PAGE_SIZE); setPage(requestedPage); setMensaje(null) } catch (error) { if (error.status === 401) manejarSesionExpirada(); else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar el Kardex.' }) } finally { setCargando(false) } }, [productoId, fromDate, toDate, manejarSesionExpirada])
  useEffect(() => { if (token && !cargaInicialRef.current) { cargaInicialRef.current = true; void cargarProductos() } }, [token, cargarProductos])
  useEffect(() => { if (token && !cargandoProductos) void cargarMovimientos(1) }, [token, cargandoProductos, productoId, fromDate, toDate, cargarMovimientos])

  const productoPorId = useMemo(() => new Map(productos.map((item) => [item.id, item])), [productos])
  const abrir = () => { setForm({ ...emptyMovement, product_id: productoId }); setModal(true) }
  const cerrar = () => { setModal(false); setForm(emptyMovement) }
  const origenCambia = (value) => setForm({ ...form, origin_type: value, movement_type: OPERATION_MOVEMENT_TYPES[value] || 'ENTRY' })
  const guardar = async (event) => { event.preventDefault(); setGuardando(true); setMensaje(null); try { const movementType = OPERATION_MOVEMENT_TYPES[form.origin_type] || form.movement_type; const data = { ...form, movement_type: movementType, product_id: Number(form.product_id), quantity: Number(form.quantity), unit_purchase_price: form.unit_purchase_price === '' ? null : Number(form.unit_purchase_price), profit_percentage: form.profit_percentage === '' ? null : Number(form.profit_percentage), notes: form.notes.trim() || null }; await crearMovimientoInventario(data, token); setProductoId(String(data.product_id)); cerrar(); await cargarMovimientos(1); setMensaje({ tipo: 'success', texto: 'Movimiento registrado correctamente.' }) } catch (error) { if (error.status === 401) manejarSesionExpirada(); else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible registrar el movimiento.' }) } finally { setGuardando(false) } }
  const abrirReversion = (item) => { setMensaje(null); setMovimientoAReversar(item) }
  const cerrarReversion = () => { if (!devolviendo) setMovimientoAReversar(null) }
  const confirmarReversion = async () => { if (!movimientoAReversar) return; const item = movimientoAReversar; setDevolviendo(item.id); setMensaje(null); try { await devolverMovimientoInventario(item.id, token); setMovimientoAReversar(null); await cargarMovimientos(page); setMensaje({ tipo: 'success', texto: 'Movimiento devuelto correctamente.' }) } catch (error) { if (error.status === 401) manejarSesionExpirada(); else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible devolver el movimiento.' }) } finally { setDevolviendo(null) } }
  const exportar = async () => { try { setExportando(true); const blob = await exportarKardexExcel(tokenRef.current, { productId: productoId, fromDate, toDate }); descargarArchivo(blob, 'kardex.xlsx') } catch (error) { if (error.status === 401) manejarSesionExpirada(); else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible exportar el Kardex.' }) } finally { setExportando(false) } }

  return <>
    <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4"><div><h2 className="fw-bold mb-1">Movimientos</h2><p className="text-muted mb-0">Registra entradas y salidas y consulta el Kardex. El inventario solo cambia mediante movimientos.</p></div><div className="d-flex gap-2"><Can permission="INVENTORY_MOVEMENT_CREATE"><button type="button" className="btn btn-primary" onClick={abrir}>+ Registrar movimiento</button></Can><button type="button" className="btn btn-outline-success" onClick={exportar} disabled={exportando || cargando}>{exportando ? 'Exportando...' : 'Exportar a Excel'}</button></div></div>
    {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}
    <div className="card shadow-sm border-0"><div className="card-body">
      <div className="row g-3 mb-4"><div className="col-12 col-md-5"><label className="form-label fw-semibold">Producto</label>{cargandoProductos ? <div className="text-muted">Cargando productos...</div> : <select className="form-select" value={productoId} onChange={(e) => { setProductoId(e.target.value); setPage(1) }}><option value="">Todos los productos</option>{productos.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select>}</div><div className="col-12 col-md-3"><label className="form-label fw-semibold">Desde</label><input type="date" className="form-control" value={fromDate} max={toDate || undefined} onChange={(e) => { setFromDate(e.target.value); setPage(1) }} /></div><div className="col-12 col-md-3"><label className="form-label fw-semibold">Hasta</label><input type="date" className="form-control" value={toDate} min={fromDate || undefined} onChange={(e) => { setToDate(e.target.value); setPage(1) }} /></div></div>
      {cargando && <div className="text-center py-4"><div className="spinner-border spinner-border-sm" /> <span className="text-muted ms-2">Cargando Kardex...</span></div>}
      {!cargando && movimientos.length === 0 && <EmptyState text="No hay movimientos para los filtros seleccionados." />}
      {!cargando && movimientos.length > 0 && <><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Operación</th><th className="text-end">Cantidad</th><th className="text-end">Precio compra</th><th className="text-end">Antes</th><th className="text-end">Después</th><th>ID movimiento</th><th>ID movimiento original</th><th>Notas</th><th>Acción</th></tr></thead><tbody>{movimientos.map((item) => { const producto = productoPorId.get(item.product_id); return <tr key={item.id}><td>{formatFechaColombia(item.created_at)}</td><td><strong>{producto?.code || `#${item.product_id}`}</strong><br /><small>{producto?.name || 'Producto no disponible'}</small></td><td><MovementBadge type={item.movement_type} /></td><td>{ORIGIN_LABELS[item.origin_type] || item.origin_type}</td><td className="text-end">{number(item.quantity)}</td><td className="text-end">{money(item.unit_purchase_price)}</td><td className="text-end">{number(item.balance_before)}</td><td className="text-end fw-semibold">{number(item.balance_after)}</td><td><small>{item.id}</small></td><td><small>{item.reversal_of_id || '-'}</small></td><td>{item.notes || '-'}</td><td>{item.origin_type !== 'REVERSAL' ? <Can permission="INVENTORY_MOVEMENT_CREATE"><button type="button" className="btn btn-sm btn-outline-secondary" disabled={devolviendo === item.id} onClick={() => abrirReversion(item)}>{devolviendo === item.id ? 'Devolviendo...' : '↩ Devolver'}</button></Can> : <span className="text-muted">-</span>}</td></tr> })}</tbody></table></div><Pagination total={page * PAGE_SIZE + (hasNext ? 1 : 0)} page={page} onPageChange={cargarMovimientos} hasNext={hasNext} /></>}
    </div></div>
    {modal && <MovementModal form={form} setForm={setForm} productos={productos} guardando={guardando} onClose={cerrar} onSubmit={guardar} onOriginChange={origenCambia} />}
    {movimientoAReversar && <ReversalModal movement={movimientoAReversar} product={productoPorId.get(movimientoAReversar.product_id)} devolviendo={devolviendo === movimientoAReversar.id} onClose={cerrarReversion} onConfirm={confirmarReversion} />}
  </>
}
export default InventoryMovementsPage
