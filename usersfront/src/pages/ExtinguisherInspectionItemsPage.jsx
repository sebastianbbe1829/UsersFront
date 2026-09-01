import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  actualizarItemRevisionExtintor,
  crearItemRevisionExtintor,
  eliminarItemRevisionExtintor,
  obtenerItemsRevisionExtintorAdmin,
} from '../services/api'

const FORM_INICIAL = { code: '', name: '', display_order: 0 }

const Modal = ({ title, children, onClose, footer }) => (
  <div className="modal d-block" role="dialog" aria-modal="true" style={{ backgroundColor: 'rgba(0,0,0,.5)', position: 'fixed', inset: 0, zIndex: 2000 }}>
    <div className="modal-dialog modal-dialog-centered" style={{ width: 'calc(100% - 2rem)', margin: '1rem auto' }}>
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">{title}</h5>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar" />
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  </div>
)

function ExtinguisherInspectionItemsPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [formulario, setFormulario] = useState(FORM_INICIAL)
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('todos')

  const cargar = useCallback(async () => {
    if (!token) return
    try {
      setCargando(true)
      const resultado = await obtenerItemsRevisionExtintorAdmin(token)
      setItems(Array.isArray(resultado) ? resultado : [])
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar los ítems de revisión.' })
    } finally {
      setCargando(false)
    }
  }, [token, manejarSesionExpirada])

  useEffect(() => { cargar() }, [cargar])

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return items.filter((item) => {
      const textoOk = !texto || [item.code, item.name, item.display_order].some((v) => String(v ?? '').toLowerCase().includes(texto))
      const estadoOk = estado === 'todos' || (estado === 'activos' ? item.active : !item.active)
      return textoOk && estadoOk
    })
  }, [items, busqueda, estado])

  const abrirCrear = () => {
    setEditando(null)
    setFormulario(FORM_INICIAL)
    setMensaje(null)
    setMostrarModal(true)
  }

  const abrirEditar = (item) => {
    setEditando(item)
    setFormulario({ code: item.code, name: item.name, display_order: item.display_order ?? 0 })
    setMensaje(null)
    setMostrarModal(true)
  }

  const cambiar = (event) => {
    const { name, value } = event.target
    setFormulario((actual) => ({ ...actual, [name]: name === 'display_order' ? Number(value) : value }))
  }

  const guardar = async (event) => {
    event.preventDefault()
    try {
      setGuardando(true)
      const datos = { ...formulario, code: formulario.code.trim(), name: formulario.name.trim() }
      const resultado = editando
        ? await actualizarItemRevisionExtintor(editando.id, datos, token)
        : await crearItemRevisionExtintor(datos, token)
      setItems((actuales) => editando ? actuales.map((item) => item.id === resultado.id ? resultado : item) : [...actuales, resultado].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.id - b.id))
      setMostrarModal(false)
      setMensaje({ tipo: 'success', texto: editando ? 'Ítem actualizado correctamente.' : 'Ítem creado correctamente.' })
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: error.status === 409 ? 'warning' : 'danger', texto: error.message || 'No fue posible guardar el ítem.' })
    } finally {
      setGuardando(false)
    }
  }

  const desactivar = async (item) => {
    if (!window.confirm(`¿Deseas desactivar el ítem "${item.name}"?`)) return
    try {
      const resultado = await eliminarItemRevisionExtintor(item.id, token)
      setItems((actuales) => actuales.map((x) => x.id === resultado.id ? resultado : x))
      setMensaje({ tipo: 'success', texto: 'Ítem desactivado correctamente.' })
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible desactivar el ítem.' })
    }
  }

  if (cargando) return <div className="card border-0 shadow-sm"><div className="card-body text-center py-5"><div className="spinner-border text-primary mb-2" role="status" /><div className="text-muted">Cargando ítems de revisión...</div></div></div>

  return <div>
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
      <div><h2 className="fw-bold mb-1">Ítems de revisión</h2><p className="text-muted mb-0">Catálogo de elementos que se verifican durante las revisiones de extintores.</p></div>
      <button type="button" className="btn btn-primary" onClick={abrirCrear}>+ Nuevo ítem</button>
    </div>

    {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}

    <div className="card shadow-sm border-0 mb-3"><div className="card-body py-3"><div className="row g-2 align-items-end">
      <div className="col-12 col-md-8"><label className="form-label fw-semibold small mb-1">Buscar</label><input className="form-control" placeholder="Código o nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
      <div className="col-12 col-md-4"><label className="form-label fw-semibold small mb-1">Estado</label><select className="form-select" value={estado} onChange={(e) => setEstado(e.target.value)}><option value="todos">Todos</option><option value="activos">Activos</option><option value="inactivos">Inactivos</option></select></div>
    </div></div></div>

    <div className="card shadow-sm border-0"><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead className="table-dark"><tr><th>Orden</th><th>Código</th><th>Nombre</th><th>Estado</th><th className="text-center">Acciones</th></tr></thead><tbody>
      {filtrados.length === 0 ? <tr><td colSpan="5" className="text-center py-4 text-muted">No se encontraron ítems.</td></tr> : filtrados.map((item) => <tr key={item.id}><td>{item.display_order}</td><td className="fw-semibold">{item.code}</td><td>{item.name}</td><td><span className={`badge ${item.active ? 'text-bg-success' : 'text-bg-secondary'}`}>{item.active ? 'Activo' : 'Inactivo'}</span></td><td className="text-center"><button type="button" className="btn btn-outline-primary btn-sm me-1" onClick={() => abrirEditar(item)} title="Editar">✏️</button>{item.active && <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => desactivar(item)} title="Desactivar">🗑️</button>}</td></tr>)}
    </tbody></table></div></div>

    {mostrarModal && <Modal title={editando ? 'Editar ítem de revisión' : 'Nuevo ítem de revisión'} onClose={() => !guardando && setMostrarModal(false)} footer={<><button type="button" className="btn btn-secondary" onClick={() => setMostrarModal(false)} disabled={guardando}>Cancelar</button><button type="submit" form="formItemRevision" className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button></>}>
      <form id="formItemRevision" onSubmit={guardar}><div className="row g-3"><div className="col-md-6"><label className="form-label fw-semibold">Código</label><input className="form-control" name="code" value={formulario.code} onChange={cambiar} maxLength="50" required disabled={guardando} placeholder="Ej. MANOMETER" /></div><div className="col-md-6"><label className="form-label fw-semibold">Orden de visualización</label><input type="number" min="0" className="form-control" name="display_order" value={formulario.display_order} onChange={cambiar} required disabled={guardando} /></div><div className="col-12"><label className="form-label fw-semibold">Nombre</label><input className="form-control" name="name" value={formulario.name} onChange={cambiar} maxLength="100" required disabled={guardando} placeholder="Ej. Manómetro" /></div></div></form>
    </Modal>}
  </div>
}

export default ExtinguisherInspectionItemsPage
