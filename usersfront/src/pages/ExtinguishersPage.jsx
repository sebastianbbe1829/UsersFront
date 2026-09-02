import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { actualizarExtintor, crearExtintor, eliminarExtintor, exportarExtintoresExcel, obtenerExtintores, obtenerRevisiones, obtenerTiposExtintor } from '../services/api'

const FORM_INICIAL = { code: '', extinguisher_type_id: '', capacity: '', location: '', last_recharge_date: '', next_recharge_date: '', last_hydrostatic_test_date: '', next_hydrostatic_test_date: '', status: 'ACTIVE', is_stock: false }
const hoy = () => new Date()

const Modal = ({ title, children, footer, onClose, large = false }) => (
  <div className="modal d-block" role="dialog" aria-modal="true" style={{ backgroundColor: 'rgba(0,0,0,.5)', position: 'fixed', inset: 0, zIndex: 2000, overflowY: 'auto' }}>
    <div className={`modal-dialog modal-dialog-centered ${large ? 'modal-lg' : ''}`} style={{ width: 'calc(100% - 2rem)', margin: '1rem auto' }}>
      <div className="modal-content"><div className="modal-header"><h5 className="modal-title">{title}</h5><button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar" /></div><div className="modal-body">{children}</div>{footer && <div className="modal-footer">{footer}</div>}</div>
    </div>
  </div>
)

const alertaRecarga = (fecha) => {
  if (!fecha) return null
  const fechaRecarga = new Date(`${fecha}T00:00:00`)
  const actual = hoy(); actual.setHours(0, 0, 0, 0)
  const dias = Math.ceil((fechaRecarga - actual) / 86400000)
  if (dias < 0) return { clase: 'text-bg-danger', texto: 'Vencida', dias }
  if (dias === 0) return { clase: 'text-bg-danger', texto: 'Hoy', dias }
  if (dias <= 7) return { clase: 'text-bg-warning', texto: `En ${dias} día${dias === 1 ? '' : 's'}`, dias }
  return { clase: 'text-bg-success', texto: 'Normal', dias }
}

function ExtinguishersPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const navigate = useNavigate()
  const [extintores, setExtintores] = useState([])
  const [tipos, setTipos] = useState([])
  const [revisiones, setRevisiones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [formulario, setFormulario] = useState(FORM_INICIAL)
  const [editando, setEditando] = useState(null)
  const [eliminandoItem, setEliminandoItem] = useState(null)
  const [verItem, setVerItem] = useState(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [stockFiltro, setStockFiltro] = useState('todos')
  const [porPagina, setPorPagina] = useState(10)
  const [pagina, setPagina] = useState(1)

  const cargar = useCallback(async () => {
    if (!token) return
    try {
      setCargando(true)
      const [ext, cat, rev] = await Promise.all([obtenerExtintores(token), obtenerTiposExtintor(token), obtenerRevisiones(token)])
      setExtintores(Array.isArray(ext) ? ext : [])
      setTipos(Array.isArray(cat) ? cat.filter((x) => x.active) : [])
      setRevisiones(Array.isArray(rev) ? rev : [])
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible consultar los extintores.' })
    } finally { setCargando(false) }
  }, [token, manejarSesionExpirada])

  useEffect(() => {
    const cargarDatos = async () => {
      await cargar()
    }
    void cargarDatos()
  }, [cargar])

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return extintores.filter((e) => {
      const textoOk = !texto || [e.code, e.capacity, e.location, e.extinguisher_type?.name].some((v) => String(v ?? '').toLowerCase().includes(texto))
      const tipoOk = tipoFiltro === 'todos' || String(e.extinguisher_type_id) === String(tipoFiltro)
      const estadoOk = estadoFiltro === 'todos' || (estadoFiltro === 'activos' && e.active) || (estadoFiltro === 'inactivos' && !e.active)
      const stockOk = stockFiltro === 'todos' || (stockFiltro === 'stock' && e.is_stock) || (stockFiltro === 'ubicados' && !e.is_stock)
      return textoOk && tipoOk && estadoOk && stockOk
    })
  }, [extintores, busqueda, tipoFiltro, estadoFiltro, stockFiltro])

  const totalPaginas = Math.ceil(filtrados.length / porPagina)
  const paginaSegura = Math.min(pagina, Math.max(totalPaginas, 1))
  const visibles = filtrados.slice((paginaSegura - 1) * porPagina, paginaSegura * porPagina)
  const desde = filtrados.length ? (paginaSegura - 1) * porPagina + 1 : 0
  const hasta = Math.min(paginaSegura * porPagina, filtrados.length)
  const activos = extintores.filter((x) => x.active).length
  const inactivos = extintores.filter((x) => !x.active).length

  const abrirNuevo = () => { setEditando(null); setFormulario({ ...FORM_INICIAL }); setMensaje(null); setMostrarModal(true) }
  const abrirEditar = (e) => {
    setEditando(e.id)
    setFormulario({ ...FORM_INICIAL, code: e.code || '', extinguisher_type_id: e.extinguisher_type_id ? String(e.extinguisher_type_id) : '', capacity: e.capacity || '', location: e.location || '', last_recharge_date: e.last_recharge_date || '', next_recharge_date: e.next_recharge_date || '', last_hydrostatic_test_date: e.last_hydrostatic_test_date || '', next_hydrostatic_test_date: e.next_hydrostatic_test_date || '', status: e.status || 'ACTIVE', is_stock: Boolean(e.is_stock) })
    setMensaje(null); setMostrarModal(true)
  }
  const cerrarModal = () => { if (guardando) return; setMostrarModal(false); setEditando(null); setFormulario({ ...FORM_INICIAL }) }
  const cambiarCampo = (event) => { const { name, value, type, checked } = event.target; setFormulario((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value })) }

  const guardar = async (event) => {
    event.preventDefault()
    try {
      setGuardando(true)
      const datos = { ...formulario, extinguisher_type_id: Number(formulario.extinguisher_type_id), last_recharge_date: formulario.last_recharge_date || null, next_recharge_date: formulario.next_recharge_date || null, last_hydrostatic_test_date: formulario.last_hydrostatic_test_date || null, next_hydrostatic_test_date: formulario.next_hydrostatic_test_date || null }
      const resultado = editando ? await actualizarExtintor(editando, datos, token) : await crearExtintor(datos, token)
      setExtintores((actuales) => editando ? actuales.map((x) => x.id === resultado.id ? resultado : x) : [...actuales, resultado])
      setMostrarModal(false); setEditando(null); setFormulario({ ...FORM_INICIAL })
      setMensaje({ tipo: 'success', texto: editando ? 'Extintor actualizado correctamente.' : 'Extintor creado correctamente.' })
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible guardar el extintor.' })
    } finally { setGuardando(false) }
  }

  const confirmarEliminacion = async () => {
    if (!eliminandoItem) return
    try {
      setEliminando(true); await eliminarExtintor(eliminandoItem.id, token)
      setExtintores((actuales) => actuales.map((x) => x.id === eliminandoItem.id ? { ...x, active: false, status: 'INACTIVE' } : x))
      setEliminandoItem(null); setMensaje({ tipo: 'success', texto: 'Extintor desactivado correctamente.' })
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible desactivar el extintor.' })
    } finally { setEliminando(false) }
  }
