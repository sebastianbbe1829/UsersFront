import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Can from '../components/Can'
import SessionManager from '../components/SessionManager'
import { actualizarProductoInventario, crearProductoInventario, obtenerProductosInventario, obtenerTiposInventario } from '../services/inventoryApi'
import { emptyProduct, EmptyState, PAGE_SIZE, Pagination, ProductModal, SearchBar, TableProducts } from './InventoryShared'

function InventoryProductsPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const tokenRef = useRef(token)
  const cargaInicialRef = useRef(false)
  const [productos, setProductos] = useState([])
  const [tipos, setTipos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(emptyProduct)
  const [editando, setEditando] = useState(null)
  const [modal, setModal] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => { tokenRef.current = token }, [token])

  const cargar = useCallback(async () => {
    const tokenActual = tokenRef.current
    if (!tokenActual) return
    try { setCargando(true); const [productosResult, tiposResult] = await Promise.all([obtenerProductosInventario(tokenActual), obtenerTiposInventario(tokenActual)]); setProductos(Array.isArray(productosResult) ? productosResult : []); setTipos(Array.isArray(tiposResult) ? tiposResult : []); setMensaje(null) }
    catch (error) { if (error.status === 401) return manejarSesionExpirada(); setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar los productos.' }) }
    finally { setCargando(false) }
  }, [manejarSesionExpirada])
  useEffect(() => { if (token && !cargaInicialRef.current) { cargaInicialRef.current = true; void cargar() } }, [token, cargar])

  const tipoPorId = useMemo(() => new Map(tipos.map((item) => [item.id, item])), [tipos])
  const filtrados = useMemo(() => { const term = busqueda.trim().toLowerCase(); return term ? productos.filter((item) => `${item.code} ${item.name} ${tipoPorId.get(item.inventory_type_id)?.name || ''}`.toLowerCase().includes(term)) : productos }, [productos, tipoPorId, busqueda])
  const filas = useMemo(() => filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtrados, page])
  const cerrar = () => { setModal(false); setEditando(null); setForm(emptyProduct) }
  const editar = (item) => { setEditando(item.id); setForm({ name: item.name, inventory_type_id: String(item.inventory_type_id), active: item.active }); setModal(true) }
  const guardar = async (event) => {
    event.preventDefault(); setGuardando(true); setMensaje(null)
    try {
      const data = { name: form.name.trim(), inventory_type_id: Number(form.inventory_type_id), active: form.active }
      if (editando) await actualizarProductoInventario(editando, data, token); else await crearProductoInventario(data, token)
      await cargar(); setMensaje({ tipo: 'success', texto: editando ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.' }); cerrar()
    } catch (error) { if (error.status === 401) manejarSesionExpirada(); else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible guardar el producto.' }) }
    finally { setGuardando(false) }
  }

  return <>
    <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4"><div><h2 className="fw-bold mb-1">Productos</h2><p className="text-muted mb-0">Administración del catálogo de productos. Crear o editar un producto no modifica existencias.</p></div><Can permission="INVENTORY_CREATE"><button type="button" className="btn btn-primary" onClick={() => setModal(true)}>+ Nuevo producto</button></Can></div>
    {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}
    <div className="card shadow-sm border-0"><div className="card-body">
      <div className="mb-3"><SearchBar value={busqueda} onChange={(value) => { setBusqueda(value); setPage(1) }} /></div>
      {cargando && <div className="text-center py-5" role="status"><div className="spinner-border" /><div className="text-muted mt-2">Cargando productos...</div></div>}
      {!cargando && filtrados.length === 0 && <EmptyState text="No hay productos." />}
      {!cargando && filtrados.length > 0 && <><TableProducts rows={filas} tipoPorId={tipoPorId} onEdit={editar} /><Pagination total={filtrados.length} page={page} onPageChange={setPage} /></>}
    </div></div>
    {modal && <ProductModal editando={Boolean(editando)} form={form} setForm={setForm} tipos={tipos} guardando={guardando} onClose={cerrar} onSubmit={guardar} />}
  </>
}
export default InventoryProductsPage
