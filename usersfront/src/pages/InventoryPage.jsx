import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Can from '../components/Can'
import SessionManager from '../components/SessionManager'
import {
  actualizarProductoInventario,
  actualizarTipoInventario,
  crearMovimientoInventario,
  crearProductoInventario,
  crearTipoInventario,
  obtenerInventario,
  obtenerMovimientosInventario,
  obtenerProductosInventario,
  obtenerTiposInventario,
} from '../services/inventoryApi'

const TABS = { stock: 'stock', types: 'types', products: 'products', movements: 'movements' }
const PAGE_SIZE = 10
const money = (value) => value == null ? '-' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 }).format(Number(value))
const number = (value) => Number(value || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
const emptyType = { code: '', name: '', active: true }
const emptyProduct = { code: '', name: '', inventory_type_id: '', active: true }
const emptyMovement = { product_id: '', movement_type: 'ENTRY', origin_type: 'PURCHASE', quantity: '', unit_purchase_price: '', profit_percentage: '', notes: '' }

function InventoryPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [tipos, setTipos] = useState([])
  const [productos, setProductos] = useState([])
  const [inventario, setInventario] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [tipoForm, setTipoForm] = useState(emptyType)
  const [productoForm, setProductoForm] = useState(emptyProduct)
  const [movimientoForm, setMovimientoForm] = useState(emptyMovement)
  const [editandoTipo, setEditandoTipo] = useState(null)
  const [editandoProducto, setEditandoProducto] = useState(null)
  const [productoMovimiento, setProductoMovimiento] = useState('')
  const [cargando, setCargando] = useState(true)
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null)
  const [page, setPage] = useState(1)
  const [movementPage, setMovementPage] = useState(1)
  const [movementHasNext, setMovementHasNext] = useState(false)

  const tab = location.pathname.endsWith('/tipos') ? TABS.types : location.pathname.endsWith('/productos') ? TABS.products : location.pathname.endsWith('/movimientos') ? TABS.movements : TABS.stock

  const cargarCatalogos = async () => {
    try {
      setCargando(true)
      const [tiposResult, productosResult, inventarioResult] = await Promise.all([obtenerTiposInventario(token), obtenerProductosInventario(token), obtenerInventario(token)])
      setTipos(Array.isArray(tiposResult) ? tiposResult : [])
      setProductos(Array.isArray(productosResult) ? productosResult : [])
      setInventario(Array.isArray(inventarioResult) ? inventarioResult : [])
      setMensaje(null)
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar el inventario.' })
    } finally { setCargando(false) }
  }

  useEffect(() => { if (token) cargarCatalogos() }, [token])
  useEffect(() => { setPage(1); setBusqueda('') }, [tab])

  const tipoPorId = useMemo(() => new Map(tipos.map((item) => [item.id, item])), [tipos])
  const productoPorId = useMemo(() => new Map(productos.map((item) => [item.id, item])), [productos])
  const tiposFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    return term ? tipos.filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(term)) : tipos
  }, [tipos, busqueda])
  const productosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    return term ? productos.filter((item) => `${item.code} ${item.name} ${tipoPorId.get(item.inventory_type_id)?.name || ''}`.toLowerCase().includes(term)) : productos
  }, [productos, tipoPorId, busqueda])
  const inventarioFiltrado = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    return term ? inventario.filter((item) => `${productoPorId.get(item.product_id)?.code || ''} ${productoPorId.get(item.product_id)?.name || ''}`.toLowerCase().includes(term)) : inventario
  }, [inventario, productoPorId, busqueda])
  const paginaTipos = useMemo(() => tiposFiltrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [tiposFiltrados, page])
  const paginaProductos = useMemo(() => productosFiltrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [productosFiltrados, page])
  const paginaInventario = useMemo(() => inventarioFiltrado.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [inventarioFiltrado, page])

  const cargarMovimientos = async (productId, requestedPage = 1) => {
    if (!productId) { setMovimientos([]); setMovementHasNext(false); return }
    try {
      setCargandoMovimientos(true)
      const result = await obtenerMovimientosInventario(productId, token, { limit: PAGE_SIZE + 1, offset: (requestedPage - 1) * PAGE_SIZE })
      const rows = Array.isArray(result) ? result : []
      setMovimientos(rows.slice(0, PAGE_SIZE)); setMovementHasNext(rows.length > PAGE_SIZE); setMovementPage(requestedPage); setMensaje(null)
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar los movimientos.' })
    } finally { setCargandoMovimientos(false) }
  }

  useEffect(() => { if (tab === TABS.movements && productoMovimiento) cargarMovimientos(productoMovimiento, 1) }, [tab, productoMovimiento])

  const ejecutar = async (action, successMessage) => {
    try {
      setGuardando(true); setMensaje(null); await action(); await cargarCatalogos(); setMensaje({ tipo: 'success', texto: successMessage }); return true
    } catch (error) {
      if (error.status === 401) { manejarSesionExpirada(); return false }
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible completar la operación.' }); return false
    } finally { setGuardando(false) }
  }

  const cerrarModal = () => { setModal(null); setEditandoTipo(null); setEditandoProducto(null); setTipoForm(emptyType); setProductoForm(emptyProduct); setMovimientoForm(emptyMovement) }
  const guardarTipo = async (event) => {
    event.preventDefault(); const data = { ...tipoForm, code: tipoForm.code.trim().toUpperCase(), name: tipoForm.name.trim() }
    const ok = editandoTipo ? await ejecutar(() => actualizarTipoInventario(editandoTipo, data, token), 'Tipo actualizado correctamente.') : await ejecutar(() => crearTipoInventario(data, token), 'Tipo creado correctamente.')
    if (ok) cerrarModal()
  }
  const guardarProducto = async (event) => {
    event.preventDefault(); const data = { ...productoForm, code: productoForm.code.trim().toUpperCase(), name: productoForm.name.trim(), inventory_type_id: Number(productoForm.inventory_type_id) }
    const ok = editandoProducto ? await ejecutar(() => actualizarProductoInventario(editandoProducto, data, token), 'Producto actualizado correctamente.') : await ejecutar(() => crearProductoInventario(data, token), 'Producto creado correctamente.')
    if (ok) cerrarModal()
  }
  const guardarMovimiento = async (event) => {
    event.preventDefault(); const data = { ...movimientoForm, product_id: Number(movimientoForm.product_id), quantity: Number(movimientoForm.quantity), unit_purchase_price: movimientoForm.unit_purchase_price === '' ? null : Number(movimientoForm.unit_purchase_price), profit_percentage: movimientoForm.profit_percentage === '' ? null : Number(movimientoForm.profit_percentage), notes: movimientoForm.notes.trim() || null }
    const ok = await ejecutar(() => crearMovimientoInventario(data, token), 'Movimiento registrado correctamente.')
    if (ok) { const productId = String(data.product_id); setProductoMovimiento(productId); cerrarModal(); await cargarMovimientos(productId, 1) }
  }
  const iniciarEdicionTipo = (item) => { setEditandoTipo(item.id); setTipoForm({ code: item.code, name: item.name, active: item.active }); setModal('type') }
  const iniciarEdicionProducto = (item) => { setEditandoProducto(item.id); setProductoForm({ code: item.code, name: item.name, inventory_type_id: String(item.inventory_type_id), active: item.active }); setModal('product') }
  const cambiarTab = (value) => navigate(value === TABS.stock ? '/inventarios' : `/inventarios/${value}`)
  const abrirMovimiento = () => { setMovimientoForm({ ...emptyMovement, product_id: productoMovimiento }); setModal('movement') }
  const origenCambia = (value) => setMovimientoForm({ ...movimientoForm, origin_type: value, movement_type: value === 'PURCHASE' || value === 'SALES_RETURN' ? 'ENTRY' : 'EXIT' })

  const renderPagination = (total, currentPage, onPageChange, hasNext = false) => {
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    if (pages === 1 && !hasNext) return null
    return <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3"><small className="text-muted">Página {currentPage}{pages > 1 ? ` de ${pages}` : ''}</small><div className="btn-group" role="group" aria-label="Paginación"><button type="button" className="btn btn-outline-secondary btn-sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>Anterior</button><button type="button" className="btn btn-outline-secondary btn-sm" disabled={!hasNext && currentPage >= pages} onClick={() => onPageChange(currentPage + 1)}>Siguiente</button></div></div>
  }

  return <>
    <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4"><div><h2 className="fw-bold mb-1">Inventarios</h2><p className="text-muted mb-0">Catálogos, existencias y kardex del tenant.</p></div><Can permission="INVENTORY_MOVEMENT_CREATE"><button type="button" className="btn btn-primary" onClick={abrirMovimiento}>+ Registrar movimiento</button></Can></div>
    {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}
    <div className="card shadow-sm border-0">
      <div className="card-header bg-transparent border-0 pt-3"><div className="row g-2">{[[TABS.stock, '📦', 'Inventario', 'Existencias actuales'], [TABS.types, '🏷️', 'Tipos', 'Clasificación'], [TABS.products, '🛒', 'Productos', 'Catálogo'], [TABS.movements, '📋', 'Movimientos', 'Kardex']].map(([value, icon, label, description]) => <div className="col-6 col-xl-3" key={value}><button type="button" className={`btn w-100 text-start border p-3 h-100 ${tab === value ? 'btn-primary' : 'btn-light'}`} onClick={() => cambiarTab(value)}><span className="fs-5 me-2">{icon}</span><strong>{label}</strong><small className={`d-block mt-1 ${tab === value ? 'text-white-50' : 'text-muted'}`}>{description}</small></button></div>)}</div></div>
      <div className="card-body">
        {tab !== TABS.movements && <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><div className="input-group" style={{ maxWidth: 420 }}><span className="input-group-text">🔎</span><input type="search" className="form-control" value={busqueda} onChange={(event) => { setBusqueda(event.target.value); setPage(1) }} placeholder="Buscar por código o nombre..." aria-label="Buscar en inventario" /></div>{tab === TABS.types && <Can permission="INVENTORY_CREATE"><button type="button" className="btn btn-outline-primary" onClick={() => setModal('type')}>+ Nuevo tipo</button></Can>}{tab === TABS.products && <Can permission="INVENTORY_CREATE"><button type="button" className="btn btn-outline-primary" onClick={() => setModal('product')}>+ Nuevo producto</button></Can>}</div>}
        {cargando && <div className="text-center py-5" role="status"><div className="spinner-border" /><div className="text-muted mt-2">Cargando inventario...</div></div>}
        {!cargando && tab === TABS.types && <><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Código</th><th>Nombre</th><th>Estado</th><th className="text-end">Acciones</th></tr></thead><tbody>{paginaTipos.map((item) => <tr key={item.id}><td className="fw-semibold">{item.code}</td><td>{item.name}</td><td><StatusBadge active={item.active} /></td><td className="text-end"><Can permission="INVENTORY_UPDATE"><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => iniciarEdicionTipo(item)}>Editar</button></Can></td></tr>)}</tbody></table></div>{tiposFiltrados.length === 0 && <EmptyState text="No hay tipos de inventario." />}{renderPagination(tiposFiltrados.length, page, setPage)}</>}
        {!cargando && tab === TABS.products && <><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Código</th><th>Producto</th><th>Tipo</th><th>Estado</th><th className="text-end">Acciones</th></tr></thead><tbody>{paginaProductos.map((item) => <tr key={item.id}><td className="fw-semibold">{item.code}</td><td>{item.name}</td><td>{tipoPorId.get(item.inventory_type_id)?.name || `#${item.inventory_type_id}`}</td><td><StatusBadge active={item.active} /></td><td className="text-end"><Can permission="INVENTORY_UPDATE"><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => iniciarEdicionProducto(item)}>Editar</button></Can></td></tr>)}</tbody></table></div>{productosFiltrados.length === 0 && <EmptyState text="No hay productos." />}{renderPagination(productosFiltrados.length, page, setPage)}</>}
        {!cargando && tab === TABS.stock && <><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Producto</th><th>Tipo</th><th className="text-end">Existencia</th><th className="text-end">Precio compra</th><th className="text-end">Ganancia</th><th className="text-end">Precio venta</th><th className="text-end">Total inventario</th></tr></thead><tbody>{paginaInventario.map((item) => { const producto = productoPorId.get(item.product_id); const tipo = producto ? tipoPorId.get(producto.inventory_type_id) : null; return <tr key={item.id}><td><strong>{producto?.code || `#${item.product_id}`}</strong><br /><small>{producto?.name || 'Producto no disponible'}</small></td><td>{tipo?.name || '-'}</td><td className="text-end fw-semibold">{number(item.quantity)}</td><td className="text-end">{money(item.purchase_price)}</td><td className="text-end">{number(Number(item.profit_percentage) * 100)}%</td><td className="text-end">{money(item.sale_price)}</td><td className="text-end fw-semibold">{money(item.total_inventory)}</td></tr> })}</tbody></table></div>{inventarioFiltrado.length === 0 && <EmptyState text="No hay existencias para mostrar." />}{renderPagination(inventarioFiltrado.length, page, setPage)}</>}
        {!cargando && tab === TABS.movements && <div className="row g-4"><div className="col-12"><div className="p-3 bg-light rounded border d-flex flex-wrap justify-content-between align-items-center gap-3"><div><h5 className="fw-bold mb-1">Kardex por producto</h5><p className="text-muted mb-0">Consulta el historial de entradas y salidas sin modificar existencias directamente.</p></div><Can permission="INVENTORY_MOVEMENT_CREATE"><button type="button" className="btn btn-primary" onClick={abrirMovimiento}>Registrar movimiento</button></Can></div></div></div><div className="col-12"><label className="form-label fw-semibold">Producto</label><select className="form-select" value={productoMovimiento} onChange={(e) => { setProductoMovimiento(e.target.value); setMovementPage(1) }}><option value="">Seleccione producto...</option>{productos.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></div><div className="col-12">{cargandoMovimientos && <div className="text-center py-4"><div className="spinner-border spinner-border-sm" /> <span className="text-muted ms-2">Cargando kardex...</span></div>}{!cargandoMovimientos && !productoMovimiento && <EmptyState text="Seleccione un producto para consultar sus movimientos." />}{!cargandoMovimientos && productoMovimiento && movimientos.length === 0 && <EmptyState text="Este producto todavía no tiene movimientos." />}{!cargandoMovimientos && movimientos.length > 0 && <><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Fecha</th><th>Tipo</th><th>Origen</th><th className="text-end">Cantidad</th><th className="text-end">Antes</th><th className="text-end">Después</th><th>Notas</th></tr></thead><tbody>{movimientos.map((item) => <tr key={item.id}><td>{new Date(item.created_at).toLocaleString('es-CO')}</td><td><MovementBadge type={item.movement_type} /></td><td>{item.origin_type}</td><td className="text-end">{number(item.quantity)}</td><td className="text-end">{number(item.balance_before)}</td><td className="text-end fw-semibold">{number(item.balance_after)}</td><td>{item.notes || '-'}</td></tr>)}</tbody></table></div>{renderPagination(movementPage * PAGE_SIZE + (movementHasNext ? 1 : 0), movementPage, (nextPage) => cargarMovimientos(productoMovimiento, nextPage), movementHasNext)}</>}</div></div>}
      </div>
    </div>
    {modal === 'type' && <Modal title={editandoTipo ? 'Editar tipo de inventario' : 'Nuevo tipo de inventario'} onClose={cerrarModal}><Can permission={editandoTipo ? 'INVENTORY_UPDATE' : 'INVENTORY_CREATE'}><form onSubmit={guardarTipo}><input className="form-control mb-3" placeholder="Código" maxLength="30" required value={tipoForm.code} onChange={(e) => setTipoForm({ ...tipoForm, code: e.target.value })} /><input className="form-control mb-3" placeholder="Nombre" maxLength="100" required value={tipoForm.name} onChange={(e) => setTipoForm({ ...tipoForm, name: e.target.value })} /><Check label="Activo" value={tipoForm.active} onChange={(value) => setTipoForm({ ...tipoForm, active: value })} /><ModalActions editing={Boolean(editandoTipo)} disabled={guardando} onCancel={cerrarModal} /></form></Can></Modal>}
    {modal === 'product' && <Modal title={editandoProducto ? 'Editar producto' : 'Nuevo producto'} onClose={cerrarModal}><Can permission={editandoProducto ? 'INVENTORY_UPDATE' : 'INVENTORY_CREATE'}><form onSubmit={guardarProducto}><input className="form-control mb-3" placeholder="Código" maxLength="30" required value={productoForm.code} onChange={(e) => setProductoForm({ ...productoForm, code: e.target.value })} /><input className="form-control mb-3" placeholder="Nombre" maxLength="150" required value={productoForm.name} onChange={(e) => setProductoForm({ ...productoForm, name: e.target.value })} /><select className="form-select mb-3" required value={productoForm.inventory_type_id} onChange={(e) => setProductoForm({ ...productoForm, inventory_type_id: e.target.value })}><option value="">Seleccione tipo...</option>{tipos.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select><Check label="Activo" value={productoForm.active} onChange={(value) => setProductoForm({ ...productoForm, active: value })} /><ModalActions editing={Boolean(editandoProducto)} disabled={guardando} onCancel={cerrarModal} /></form></Can></Modal>}
    {modal === 'movement' && <Modal title="Registrar movimiento de inventario" onClose={cerrarModal} size="modal-lg"><Can permission="INVENTORY_MOVEMENT_CREATE"><form onSubmit={guardarMovimiento}><div className="row g-3"><div className="col-12 col-md-6"><label className="form-label">Producto</label><select className="form-select" required value={movimientoForm.product_id} onChange={(e) => setMovimientoForm({ ...movimientoForm, product_id: e.target.value })}><option value="">Seleccione producto...</option>{productos.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></div><div className="col-12 col-md-6"><label className="form-label">Origen</label><select className="form-select" value={movimientoForm.origin_type} onChange={(e) => origenCambia(e.target.value)}><option value="PURCHASE">Compra</option><option value="MANUAL_ADJUSTMENT">Ajuste manual</option><option value="SALES_RETURN">Devolución de venta</option><option value="PURCHASE_RETURN">Devolución de compra</option></select></div><div className="col-12 col-md-4"><label className="form-label">Tipo de movimiento</label><select className="form-select" value={movimientoForm.movement_type} onChange={(e) => setMovimientoForm({ ...movimientoForm, movement_type: e.target.value })}><option value="ENTRY">Entrada</option><option value="EXIT">Salida</option></select></div><div className="col-12 col-md-4"><label className="form-label">Cantidad</label><input className="form-control" type="number" min="0.001" step="0.001" required value={movimientoForm.quantity} onChange={(e) => setMovimientoForm({ ...movimientoForm, quantity: e.target.value })} /></div><div className="col-12 col-md-4"><label className="form-label">Precio compra unitario</label><input className="form-control" type="number" min="0" step="0.01" value={movimientoForm.unit_purchase_price} onChange={(e) => setMovimientoForm({ ...movimientoForm, unit_purchase_price: e.target.value })} /></div><div className="col-12 col-md-6"><label className="form-label">Ganancia</label><input className="form-control" type="number" min="0" step="0.0001" placeholder="0.50 = 50%" value={movimientoForm.profit_percentage} onChange={(e) => setMovimientoForm({ ...movimientoForm, profit_percentage: e.target.value })} /></div><div className="col-12"><label className="form-label">Notas</label><textarea className="form-control" rows="3" maxLength="500" value={movimientoForm.notes} onChange={(e) => setMovimientoForm({ ...movimientoForm, notes: e.target.value })} /></div></div><div className="alert alert-warning small mt-3 mb-0">La existencia no se modifica directamente. Cada cambio queda registrado en el kardex.</div><ModalActions submitLabel="Registrar movimiento" disabled={guardando || !movimientoForm.product_id} onCancel={cerrarModal} /></form></Can></Modal>}
  </>
}

function Modal({ title, onClose, children, size = '' }) { return <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true"><div className="modal-backdrop show" style={{ zIndex: 1040 }} onClick={onClose} /><div className={`modal-dialog modal-dialog-centered ${size}`} style={{ zIndex: 1050 }}><div className="modal-content shadow-lg"><div className="modal-header"><h5 className="modal-title fw-bold">{title}</h5><button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} /></div><div className="modal-body">{children}</div></div></div></div> }
function ModalActions({ editing = false, submitLabel, onCancel, disabled }) { return <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 mt-4"><button type="button" className="btn btn-outline-secondary order-2 order-sm-1" onClick={onCancel} disabled={disabled}>Cancelar</button><button type="submit" className="btn btn-primary order-1 order-sm-2" disabled={disabled}>{disabled ? 'Guardando...' : submitLabel || (editing ? 'Guardar cambios' : 'Crear')}</button></div> }
function Check({ label, value, onChange }) { return <div className="form-check mb-3"><input id={`inventory-check-${label}`} className="form-check-input" type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /><label className="form-check-label" htmlFor={`inventory-check-${label}`}>{label}</label></div> }
function StatusBadge({ active }) { return <span className={`badge ${active ? 'text-bg-success' : 'text-bg-secondary'}`}>{active ? 'Activo' : 'Inactivo'}</span> }
function MovementBadge({ type }) { return <span className={`badge ${type === 'ENTRY' ? 'text-bg-success' : 'text-bg-danger'}`}>{type === 'ENTRY' ? 'Entrada' : 'Salida'}</span> }
function EmptyState({ text }) { return <div className="alert alert-info mb-0">{text}</div> }
export default InventoryPage
