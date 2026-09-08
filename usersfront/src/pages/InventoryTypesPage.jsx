import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Can from '../components/Can'
import SessionManager from '../components/SessionManager'
import { actualizarTipoInventario, crearTipoInventario, obtenerTiposInventario } from '../services/inventoryApi'
import { emptyType, EmptyState, PAGE_SIZE, Pagination, SearchBar, TableTypes, TypeModal } from './InventoryShared'

function InventoryTypesPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [tipos, setTipos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(emptyType)
  const [editando, setEditando] = useState(null)
  const [modal, setModal] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const cargar = useCallback(async () => {
    try { setCargando(true); const result = await obtenerTiposInventario(token); setTipos(Array.isArray(result) ? result : []); setMensaje(null) }
    catch (error) { if (error.status === 401) return manejarSesionExpirada(); setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar los tipos.' }) }
    finally { setCargando(false) }
  }, [token, manejarSesionExpirada])
  useEffect(() => { if (token) void cargar() }, [token, cargar])

  const filtrados = useMemo(() => { const term = busqueda.trim().toLowerCase(); return term ? tipos.filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(term)) : tipos }, [tipos, busqueda])
  const filas = useMemo(() => filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtrados, page])
  const cerrar = () => { setModal(false); setEditando(null); setForm(emptyType) }
  const editar = (item) => { setEditando(item.id); setForm({ code: item.code, name: item.name, active: item.active }); setModal(true) }
  const guardar = async (event) => {
    event.preventDefault(); setGuardando(true); setMensaje(null)
    try {
      const data = { ...form, code: form.code.trim().toUpperCase(), name: form.name.trim() }
      if (editando) await actualizarTipoInventario(editando, data, token); else await crearTipoInventario(data, token)
      await cargar(); setMensaje({ tipo: 'success', texto: editando ? 'Tipo actualizado correctamente.' : 'Tipo creado correctamente.' }); cerrar()
    } catch (error) { if (error.status === 401) manejarSesionExpirada(); else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible guardar el tipo.' }) }
    finally { setGuardando(false) }
  }

  return <>
    <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4"><div><h2 className="fw-bold mb-1">Tipos</h2><p className="text-muted mb-0">Administración de tipos de inventario.</p></div><Can permission="INVENTORY_CREATE"><button type="button" className="btn btn-primary" onClick={() => setModal(true)}>+ Nuevo tipo</button></Can></div>
    {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}
    <div className="card shadow-sm border-0"><div className="card-body">
      <div className="mb-3"><SearchBar value={busqueda} onChange={(value) => { setBusqueda(value); setPage(1) }} /></div>
      {cargando && <div className="text-center py-5" role="status"><div className="spinner-border" /><div className="text-muted mt-2">Cargando tipos...</div></div>}
      {!cargando && filtrados.length === 0 && <EmptyState text="No hay tipos de inventario." />}
      {!cargando && filtrados.length > 0 && <><TableTypes rows={filas} onEdit={editar} /><Pagination total={filtrados.length} page={page} onPageChange={setPage} /></>}
    </div></div>
    {modal && <TypeModal editando={Boolean(editando)} form={form} setForm={setForm} guardando={guardando} onClose={cerrar} onSubmit={guardar} />}
  </>
}
export default InventoryTypesPage
