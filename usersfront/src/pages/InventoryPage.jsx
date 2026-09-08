import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
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

const TABS = {
  types: 'types',
  products: 'products',
  stock: 'stock',
  movements: 'movements',
}

const money = (value) => {
  if (value == null) return '-'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 2,
  }).format(Number(value))
}

const number = (value) => Number(value || 0).toLocaleString('es-CO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
})

const emptyType = { code: '', name: '', active: true }
const emptyProduct = { code: '', name: '', inventory_type_id: '', active: true }
const emptyMovement = {
  product_id: '',
  movement_type: 'ENTRY',
  origin_type: 'PURCHASE',
  quantity: '',
  unit_purchase_price: '',
  profit_percentage: '',
  notes: '',
}

function InventoryPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const location = useLocation()
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
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const tab = location.pathname.endsWith('/tipos')
    ? TABS.types
    : location.pathname.endsWith('/productos')
      ? TABS.products
      : location.pathname.endsWith('/movimientos')
        ? TABS.movements
        : TABS.stock

  const cargarCatalogos = async () => {
    try {
      setCargando(true)
      const [tiposResult, productosResult, inventarioResult] = await Promise.all([
        obtenerTiposInventario(token),
        obtenerProductosInventario(token),
        obtenerInventario(token),
      ])
      setTipos(Array.isArray(tiposResult) ? tiposResult : [])
      setProductos(Array.isArray(productosResult) ? productosResult : [])
      setInventario(Array.isArray(inventarioResult) ? inventarioResult : [])
      setMensaje(null)
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar el inventario.' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (token) cargarCatalogos()
  }, [token])

  const tipoPorId = useMemo(() => new Map(tipos.map((item) => [item.id, item])), [tipos])
  const productoPorId = useMemo(() => new Map(productos.map((item) => [item.id, item])), [productos])

  const tiposFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    if (!term) return tipos
    return tipos.filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(term))
  }, [tipos, busqueda])

  const productosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    if (!term) return productos
    return productos.filter((item) => {
      const tipo = tipoPorId.get(item.inventory_type_id)
      return `${item.code} ${item.name} ${tipo?.name || ''}`.toLowerCase().includes(term)
    })
  }, [productos, tipoPorId, busqueda])

  const inventarioFiltrado = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    if (!term) return inventario
    return inventario.filter((item) => {
      const producto = productoPorId.get(item.product_id)
      return `${producto?.code || ''} ${producto?.name || ''}`.toLowerCase().includes(term)
    })
  }, [inventario, productoPorId, busqueda])

  const cargarMovimientos = async (productId) => {
    if (!productId) {
      setMovimientos([])
      return
    }
    try {
      setCargando(true)
      const result = await obtenerMovimientosInventario(productId, token)
      setMovimientos(Array.isArray(result) ? result : [])
      setMensaje(null)
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar los movimientos.' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (tab === TABS.movements && productoMovimiento) cargarMovimientos(productoMovimiento)
  }, [tab, productoMovimiento])

  const ejecutar = async (action, successMessage) => {
    try {
      setGuardando(true)
      setMensaje(null)
      await action()
      await cargarCatalogos()
      setMensaje({ tipo: 'success', texto: successMessage })
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible completar la operación.' })
    } finally {
      setGuardando(false)
    }
  }

  const guardarTipo = (event) => {
    event.preventDefault()
    const data = { ...tipoForm, code: tipoForm.code.trim().toUpperCase(), name: tipoForm.name.trim() }
    if (editandoTipo) {
      return ejecutar(() => actualizarTipoInventario(editandoTipo, data, token), 'Tipo actualizado correctamente.')
        .then(() => { setEditandoTipo(null); setTipoForm(emptyType) })
    }
    return ejecutar(() => crearTipoInventario(data, token), 'Tipo creado correctamente.')
      .then(() => setTipoForm(emptyType))
  }

  const guardarProducto = (event) => {
    event.preventDefault()
    const data = {
      ...productoForm,
      code: productoForm.code.trim().toUpperCase(),
      name: productoForm.name.trim(),
      inventory_type_id: Number(productoForm.inventory_type_id),
    }
    if (editandoProducto) {
      return ejecutar(() => actualizarProductoInventario(editandoProducto, data, token), 'Producto actualizado correctamente.')
        .then(() => { setEditandoProducto(null); setProductoForm(emptyProduct) })
    }
    return ejecutar(() => crearProductoInventario(data, token), 'Producto creado correctamente.')
      .then(() => setProductoForm(emptyProduct))
  }

  const guardarMovimiento = (event) => {
    event.preventDefault()
    const data = {
      ...movimientoForm,
      product_id: Number(movimientoForm.product_id),
      quantity: Number(movimientoForm.quantity),
      unit_purchase_price: movimientoForm.unit_purchase_price === '' ? null : Number(movimientoForm.unit_purchase_price),
      profit_percentage: movimientoForm.profit_percentage === '' ? null : Number(movimientoForm.profit_percentage),
      notes: movimientoForm.notes.trim() || null,
    }
    return ejecutar(() => crearMovimientoInventario(data, token), 'Movimiento registrado correctamente.')
      .then(() => {
        setMovimientoForm(emptyMovement)
        setProductoMovimiento(String(data.product_id))
        return cargarMovimientos(data.product_id)
      })
  }

  const iniciarEdicionTipo = (item) => {
    setEditandoTipo(item.id)
    setTipoForm({ code: item.code, name: item.name, active: item.active })
  }

  const iniciarEdicionProducto = (item) => {
    setEditandoProducto(item.id)
    setProductoForm({
      code: item.code,
      name: item.name,
      inventory_type_id: String(item.inventory_type_id),
      active: item.active,
    })
  }

  const cambiarTab = (value) => {
    setBusqueda('')
    setMensaje(null)
    const base = location.pathname.split('/inventarios')[0]
    window.history.pushState({}, '', `${base}/inventarios${value === TABS.stock ? '' : `/${value}`}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <>
      <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Inventarios</h2>
          <p className="text-muted mb-0">Catálogos, existencias y kardex del tenant.</p>
        </div>
      </div>

      {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}

      <div className="card shadow-sm border-0">
        <div className="card-header bg-transparent border-0 pt-3">
          <ul className="nav nav-tabs flex-wrap">
            {[
              [TABS.stock, '📦 Inventario'],
              [TABS.types, '🏷️ Tipos'],
              [TABS.products, '🛒 Productos'],
              [TABS.movements, '📋 Movimientos'],
            ].map(([value, label]) => (
              <li className="nav-item" key={value}>
                <button type="button" className={`nav-link ${tab === value ? 'active' : ''}`} onClick={() => cambiarTab(value)}>{label}</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-body">
          {tab !== TABS.movements && (
            <div className="mb-3">
              <input type="search" className="form-control" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar..." />
            </div>
          )}

          {cargando && <div className="text-center py-4"><div className="spinner-border" role="status" /><div className="text-muted mt-2">Cargando inventario...</div></div>}

          {!cargando && tab === TABS.types && (
            <div className="row g-4">
              <div className="col-12 col-xl-8">
                <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Código</th><th>Nombre</th><th>Estado</th><th className="text-end">Acciones</th></tr></thead><tbody>{tiposFiltrados.map((item) => <tr key={item.id}><td className="fw-semibold">{item.code}</td><td>{item.name}</td><td><span className={`badge ${item.active ? 'text-bg-success' : 'text-bg-secondary'}`}>{item.active ? 'Activo' : 'Inactivo'}</span></td><td className="text-end"><Can permission="INVENTORY_UPDATE"><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => iniciarEdicionTipo(item)}>Editar</button></Can></td></tr>)}</tbody></table></div>
                {tiposFiltrados.length === 0 && <div className="alert alert-info mb-0">No hay tipos de inventario.</div>}
              </div>
              <div className="col-12 col-xl-4"><FormCard title={editandoTipo ? 'Editar tipo' : 'Nuevo tipo'} onSubmit={guardarTipo} disabled={guardando}><input className="form-control mb-2" placeholder="Código" maxLength="30" required value={tipoForm.code} onChange={(e) => setTipoForm({ ...tipoForm, code: e.target.value })} /><input className="form-control mb-2" placeholder="Nombre" maxLength="100" required value={tipoForm.name} onChange={(e) => setTipoForm({ ...tipoForm, name: e.target.value })} /><Check label="Activo" value={tipoForm.active} onChange={(value) => setTipoForm({ ...tipoForm, active: value })} /><FormActions editing={Boolean(editandoTipo)} onCancel={() => { setEditandoTipo(null); setTipoForm(emptyType) }} disabled={guardando} /></FormCard></div>
            </div>
          )}

          {!cargando && tab === TABS.products && (
            <div className="row g-4">
              <div className="col-12 col-xl-8"><div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Código</th><th>Producto</th><th>Tipo</th><th>Estado</th><th className="text-end">Acciones</th></tr></thead><tbody>{productosFiltrados.map((item) => <tr key={item.id}><td className="fw-semibold">{item.code}</td><td>{item.name}</td><td>{tipoPorId.get(item.inventory_type_id)?.name || `#${item.inventory_type_id}`}</td><td><span className={`badge ${item.active ? 'text-bg-success' : 'text-bg-secondary'}`}>{item.active ? 'Activo' : 'Inactivo'}</span></td><td className="text-end"><Can permission="INVENTORY_UPDATE"><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => iniciarEdicionProducto(item)}>Editar</button></Can></td></tr>)}</tbody></table></div>{productosFiltrados.length === 0 && <div className="alert alert-info mb-0">No hay productos.</div>}</div>
              <div className="col-12 col-xl-4"><FormCard title={editandoProducto ? 'Editar producto' : 'Nuevo producto'} onSubmit={guardarProducto} disabled={guardando}><input className="form-control mb-2" placeholder="Código" maxLength="30" required value={productoForm.code} onChange={(e) => setProductoForm({ ...productoForm, code: e.target.value })} /><input className="form-control mb-2" placeholder="Nombre" maxLength="150" required value={productoForm.name} onChange={(e) => setProductoForm({ ...productoForm, name: e.target.value })} /><select className="form-select mb-2" required value={productoForm.inventory_type_id} onChange={(e) => setProductoForm({ ...productoForm, inventory_type_id: e.target.value })}><option value="">Seleccione tipo...</option>{tipos.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select><Check label="Activo" value={productoForm.active} onChange={(value) => setProductoForm({ ...productoForm, active: value })} /><FormActions editing={Boolean(editandoProducto)} onCancel={() => { setEditandoProducto(null); setProductoForm(emptyProduct) }} disabled={guardando} /></FormCard></div>
            </div>
          )}

          {!cargando && tab === TABS.stock && (
            <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Producto</th><th>Tipo</th><th className="text-end">Existencia</th><th className="text-end">Precio compra</th><th className="text-end">Ganancia</th><th className="text-end">Precio venta</th><th className="text-end">Total inventario</th></tr></thead><tbody>{inventarioFiltrado.map((item) => { const producto = productoPorId.get(item.product_id); const tipo = producto ? tipoPorId.get(producto.inventory_type_id) : null; return <tr key={item.id}><td><strong>{producto?.code || `#${item.product_id}`}</strong><br /><small>{producto?.name || 'Producto no disponible'}</small></td><td>{tipo?.name || '-'}</td><td className="text-end fw-semibold">{number(item.quantity)}</td><td className="text-end">{money(item.purchase_price)}</td><td className="text-end">{number(Number(item.profit_percentage) * 100)}%</td><td className="text-end">{money(item.sale_price)}</td><td className="text-end fw-semibold">{money(item.total_inventory)}</td></tr> })}</tbody></table></div>
          )}

          {!cargando && tab === TABS.movements && (
            <div className="row g-4">
              <div className="col-12 col-xl-4">
                <FormCard title="Registrar movimiento" onSubmit={guardarMovimiento} disabled={guardando}><select className="form-select mb-2" required value={movimientoForm.product_id} onChange={(e) => { const value = e.target.value; setMovimientoForm({ ...movimientoForm, product_id: value }); setProductoMovimiento(value) }}><option value="">Seleccione producto...</option>{productos.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select><select className="form-select mb-2" value={movimientoForm.origin_type} onChange={(e) => setMovimientoForm({ ...movimientoForm, origin_type: e.target.value, movement_type: e.target.value === 'PURCHASE' || e.target.value === 'SALES_RETURN' ? 'ENTRY' : 'EXIT' })}><option value="PURCHASE">Compra</option><option value="MANUAL_ADJUSTMENT">Ajuste manual</option><option value="SALES_RETURN">Devolución de venta</option><option value="PURCHASE_RETURN">Devolución de compra</option></select><select className="form-select mb-2" value={movimientoForm.movement_type} onChange={(e) => setMovimientoForm({ ...movimientoForm, movement_type: e.target.value })}><option value="ENTRY">Entrada</option><option value="EXIT">Salida</option></select><input className="form-control mb-2" type="number" min="0.001" step="0.001" required placeholder="Cantidad" value={movimientoForm.quantity} onChange={(e) => setMovimientoForm({ ...movimientoForm, quantity: e.target.value })} /><input className="form-control mb-2" type="number" min="0" step="0.01" placeholder="Precio de compra unitario" value={movimientoForm.unit_purchase_price} onChange={(e) => setMovimientoForm({ ...movimientoForm, unit_purchase_price: e.target.value })} /><input className="form-control mb-2" type="number" min="0" step="0.0001" placeholder="Ganancia (0.50 = 50%)" value={movimientoForm.profit_percentage} onChange={(e) => setMovimientoForm({ ...movimientoForm, profit_percentage: e.target.value })} /><textarea className="form-control mb-2" rows="3" maxLength="500" placeholder="Notas" value={movimientoForm.notes} onChange={(e) => setMovimientoForm({ ...movimientoForm, notes: e.target.value })} /><button className="btn btn-primary w-100" type="submit" disabled={guardando || !movimientoForm.product_id}>{guardando ? 'Registrando...' : 'Registrar movimiento'}</button><div className="alert alert-warning small mt-3 mb-0">La existencia no se modifica directamente. Cada cambio queda registrado en el kardex.</div></FormCard>
              </div>
              <div className="col-12 col-xl-8"><div className="mb-3"><label className="form-label fw-semibold">Producto para consultar kardex</label><select className="form-select" value={productoMovimiento} onChange={(e) => setProductoMovimiento(e.target.value)}><option value="">Seleccione producto...</option>{productos.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></div>{productoMovimiento ? <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Fecha</th><th>Tipo</th><th>Origen</th><th className="text-end">Cantidad</th><th className="text-end">Antes</th><th className="text-end">Después</th><th>Notas</th></tr></thead><tbody>{movimientos.map((item) => <tr key={item.id}><td>{new Date(item.created_at).toLocaleString('es-CO')}</td><td><span className={`badge ${item.movement_type === 'ENTRY' ? 'text-bg-success' : 'text-bg-danger'}`}>{item.movement_type === 'ENTRY' ? 'Entrada' : 'Salida'}</span></td><td>{item.origin_type}</td><td className="text-end">{number(item.quantity)}</td><td className="text-end">{number(item.balance_before)}</td><td className="text-end fw-semibold">{number(item.balance_after)}</td><td>{item.notes || '-'}</td></tr>)}</tbody></table></div> : <div className="alert alert-info">Seleccione un producto para consultar sus movimientos.</div>}</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function FormCard({ title, onSubmit, disabled, children }) {
  return <div className="card border"><div className="card-body"><h5 className="fw-bold mb-3">{title}</h5><form onSubmit={onSubmit}>{children}</form></div></div>
}

function Check({ label, value, onChange }) {
  return <div className="form-check mb-3"><input id={`check-${label}`} className="form-check-input" type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /><label className="form-check-label" htmlFor={`check-${label}`}>{label}</label></div>
}

function FormActions({ editing, onCancel, disabled }) {
  return <div className="d-flex gap-2"><button type="submit" className="btn btn-primary flex-grow-1" disabled={disabled}>{editing ? 'Guardar cambios' : 'Crear'}</button>{editing && <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={disabled}>Cancelar</button>}</div>
}

export default InventoryPage
