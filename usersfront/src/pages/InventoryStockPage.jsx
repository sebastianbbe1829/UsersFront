import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import SessionManager from '../components/SessionManager'
import { obtenerInventario, obtenerProductosInventario, obtenerTiposInventario } from '../services/inventoryApi'
import { EmptyState, PAGE_SIZE, Pagination, SearchBar, TableStock, number } from './InventoryShared'

function InventoryStockPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const tokenRef = useRef(token)
  const cargaInicialRef = useRef(false)
  const [tipos, setTipos] = useState([])
  const [productos, setProductos] = useState([])
  const [inventario, setInventario] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => { tokenRef.current = token }, [token])

  const cargar = useCallback(async () => {
    const tokenActual = tokenRef.current
    if (!tokenActual) return
    try {
      setCargando(true)
      const [tiposResult, productosResult, inventarioResult] = await Promise.all([
        obtenerTiposInventario(tokenActual), obtenerProductosInventario(tokenActual), obtenerInventario(tokenActual),
      ])
      setTipos(Array.isArray(tiposResult) ? tiposResult : [])
      setProductos(Array.isArray(productosResult) ? productosResult : [])
      setInventario(Array.isArray(inventarioResult) ? inventarioResult : [])
      setMensaje(null)
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar las existencias.' })
    } finally { setCargando(false) }
  }, [manejarSesionExpirada])

  useEffect(() => { if (token && !cargaInicialRef.current) { cargaInicialRef.current = true; void cargar() } }, [token, cargar])

  const productoPorId = useMemo(() => new Map(productos.map((item) => [item.id, item])), [productos])
  const tipoPorId = useMemo(() => new Map(tipos.map((item) => [item.id, item])), [tipos])
  const term = busqueda.trim().toLowerCase()
  const filtrado = useMemo(() => term ? inventario.filter((item) => `${productoPorId.get(item.product_id)?.code || ''} ${productoPorId.get(item.product_id)?.name || ''}`.toLowerCase().includes(term)) : inventario, [inventario, productoPorId, term])
  const filas = useMemo(() => filtrado.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtrado, page])

  return <>
    <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
    <div className="mb-4"><h2 className="fw-bold mb-1">Inventario</h2><p className="text-muted mb-0">Consulta de existencias actuales. Las existencias cambian únicamente mediante movimientos.</p></div>
    {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}
    <div className="card shadow-sm border-0"><div className="card-body">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><SearchBar value={busqueda} onChange={(value) => { setBusqueda(value); setPage(1) }} /><span className="text-muted small">{number(filtrado.length)} registros</span></div>
      {cargando && <div className="text-center py-5" role="status"><div className="spinner-border" /><div className="text-muted mt-2">Cargando existencias...</div></div>}
      {!cargando && filtrado.length === 0 && <EmptyState text="No hay existencias para mostrar." />}
      {!cargando && filtrado.length > 0 && <><TableStock rows={filas} productoPorId={productoPorId} tipoPorId={tipoPorId} /><Pagination total={filtrado.length} page={page} onPageChange={setPage} /></>}
    </div></div>
  </>
}

export default InventoryStockPage
