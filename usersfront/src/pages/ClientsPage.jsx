import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  actualizarCliente,
  crearCliente,
  eliminarCliente,
  obtenerCiudadesCliente,
  obtenerClientes,
  obtenerDepartamentosCliente,
  obtenerPaisesCliente,
  obtenerTiposIdentificacionCliente,
} from '../services/clientsApi'
import Can from '../components/Can'
import SessionManager from '../components/SessionManager'

const PAGE_SIZE = 10
const formularioInicial = {
  identification_type_id: '', identification_number: '', person_type: 'NATURAL',
  first_name: '', middle_name: '', last_name: '', second_last_name: '', business_name: '',
  email: '', phone: '', address: '', country_id: '', department_id: '', city_id: '',
  status: 'ACTIVE', consent_given: false, consent_at: null, consent_source: '',
}

const normalizarNombre = (valor) => valor
  .toLocaleLowerCase('es-CO')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/(^|[\s-])(\p{L})/gu, (_, separador, letra) => `${separador}${letra.toLocaleUpperCase('es-CO')}`)

function ClientsPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [clientes, setClientes] = useState([])
  const [tiposIdentificacion, setTiposIdentificacion] = useState([])
  const [paises, setPaises] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [ciudades, setCiudades] = useState([])
  const [formulario, setFormulario] = useState(formularioInicial)
  const [clienteEditando, setClienteEditando] = useState(null)
  const [clienteEliminando, setClienteEliminando] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [cargandoDepartamentos, setCargandoDepartamentos] = useState(false)
  const [cargandoCiudades, setCargandoCiudades] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      try {
        setCargando(true)
        const [lista, tipos, paisesData] = await Promise.all([obtenerClientes(token), obtenerTiposIdentificacionCliente(token), obtenerPaisesCliente(token)])
        if (!activo) return
        setClientes(Array.isArray(lista) ? lista : [])
        setTiposIdentificacion(Array.isArray(tipos) ? tipos : [])
        setPaises(Array.isArray(paisesData) ? paisesData : [])
        setMensaje(null)
      } catch (error) {
        if (!activo) return
        if (error.status === 401) return manejarSesionExpirada()
        setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar los clientes.' })
      } finally { if (activo) setCargando(false) }
    }
    if (token) cargar()
    return () => { activo = false }
  }, [token, manejarSesionExpirada])

  useEffect(() => {
    let activo = true
    if (!formulario.country_id) {
      setDepartamentos([])
      setCiudades([])
      setCargandoDepartamentos(false)
      return () => { activo = false }
    }
    setCargandoDepartamentos(true)
    setDepartamentos([])
    setCiudades([])
    obtenerDepartamentosCliente(token, formulario.country_id)
      .then((data) => { if (activo) setDepartamentos(Array.isArray(data) ? data : []) })
      .catch((error) => {
        if (!activo) return
        setDepartamentos([])
        if (error.status === 401) manejarSesionExpirada()
      })
      .finally(() => { if (activo) setCargandoDepartamentos(false) })
    return () => { activo = false }
  }, [formulario.country_id, token, manejarSesionExpirada])

  useEffect(() => {
    let activo = true
    if (!formulario.department_id) {
      setCiudades([])
      setCargandoCiudades(false)
      return () => { activo = false }
    }
    setCargandoCiudades(true)
    setCiudades([])
    obtenerCiudadesCliente(token, formulario.department_id)
      .then((data) => { if (activo) setCiudades(Array.isArray(data) ? data : []) })
      .catch((error) => {
        if (!activo) return
        setCiudades([])
        if (error.status === 401) manejarSesionExpirada()
      })
      .finally(() => { if (activo) setCargandoCiudades(false) })
    return () => { activo = false }
  }, [formulario.department_id, token, manejarSesionExpirada])

  const tiposDisponibles = useMemo(() => tiposIdentificacion.filter((tipo) => tipo.person_type === formulario.person_type), [tiposIdentificacion, formulario.person_type])
  useEffect(() => {
    const actual = tiposIdentificacion.find((tipo) => String(tipo.id) === String(formulario.identification_type_id))
    if (actual && actual.person_type !== formulario.person_type) setFormulario((valor) => ({ ...valor, identification_type_id: '' }))
  }, [formulario.person_type, tiposIdentificacion, formulario.identification_type_id])

  const clientesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return clientes
    return clientes.filter((cliente) => [cliente.identification_number, cliente.full_name, cliente.person_type, cliente.email, cliente.status, cliente.list_type, cliente.compliance_status].some((valor) => String(valor ?? '').toLowerCase().includes(termino)))
  }, [clientes, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / PAGE_SIZE))
  const clientesVisibles = clientesFiltrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)
  useEffect(() => { setPagina(1) }, [busqueda])
  useEffect(() => { if (pagina > totalPaginas) setPagina(totalPaginas) }, [pagina, totalPaginas])

  const cambiar = (campo, valor) => setFormulario((actual) => ({ ...actual, [campo]: valor }))
  const cambiarNombre = (campo, valor) => cambiar(campo, normalizarNombre(valor))
  const cerrarModal = () => {
    if (guardando) return
    setModalAbierto(false)
    setClienteEditando(null)
    setFormulario(formularioInicial)
    setDepartamentos([])
    setCiudades([])
    setCargandoDepartamentos(false)
    setCargandoCiudades(false)
  }
  const abrirCrear = () => { setClienteEditando(null); setFormulario(formularioInicial); setDepartamentos([]); setCiudades([]); setMensaje(null); setModalAbierto(true) }
  const editar = (cliente) => {
    setClienteEditando(cliente)
    setFormulario({ ...formularioInicial, ...cliente, identification_type_id: cliente.identification_type_id ?? '', country_id: cliente.country_id ?? '', department_id: cliente.department_id ?? '', city_id: cliente.city_id ?? '', consent_given: Boolean(cliente.consent_given), consent_at: cliente.consent_at ?? null, consent_source: cliente.consent_source ?? '' })
    setMensaje(null)
    setModalAbierto(true)
  }

  const guardar = async (event) => {
    event.preventDefault()
    try {
      setGuardando(true); setMensaje(null)
      const datos = {
        ...formulario,
        first_name: formulario.person_type === 'NATURAL' ? normalizarNombre(formulario.first_name) : formulario.first_name,
        middle_name: formulario.person_type === 'NATURAL' ? normalizarNombre(formulario.middle_name) : formulario.middle_name,
        last_name: formulario.person_type === 'NATURAL' ? normalizarNombre(formulario.last_name) : formulario.last_name,
        second_last_name: formulario.person_type === 'NATURAL' ? normalizarNombre(formulario.second_last_name) : formulario.second_last_name,
        identification_type_id: Number(formulario.identification_type_id),
        country_id: formulario.country_id ? Number(formulario.country_id) : null,
        department_id: formulario.department_id ? Number(formulario.department_id) : null,
        city_id: formulario.city_id ? Number(formulario.city_id) : null,
        email: formulario.email || null,
        consent_source: formulario.consent_source || null,
      }
      const resultado = clienteEditando ? await actualizarCliente(clienteEditando.id, datos, token) : await crearCliente(datos, token)
      setClientes((actuales) => clienteEditando ? actuales.map((cliente) => cliente.id === resultado.id ? resultado : cliente) : [resultado, ...actuales])
      cerrarModal()
      setMensaje({ tipo: 'success', texto: clienteEditando ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.' })
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible guardar el cliente.' })
    } finally { setGuardando(false) }
  }

  const solicitarEliminar = (cliente) => setClienteEliminando(cliente)
  const cancelarEliminar = () => { if (!eliminando) setClienteEliminando(null) }
  const confirmarEliminar = async () => {
    if (!clienteEliminando) return
    try {
      setEliminando(true)
      await eliminarCliente(clienteEliminando.id, token)
      setClientes((actuales) => actuales.filter((item) => item.id !== clienteEliminando.id))
      setClienteEliminando(null)
      setMensaje({ tipo: 'success', texto: 'Cliente eliminado correctamente.' })
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible eliminar el cliente.' })
    } finally { setEliminando(false) }
  }

  return <>
    <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
    <div className="mb-4"><h2 className="fw-bold mb-1">Gestión de Clientes</h2><p className="text-muted mb-0">Clientes del tenant actual.</p></div>
    {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}
    <div className="card shadow-sm border-0"><div className="card-body">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><div><h5 className="fw-bold mb-0">Clientes registrados</h5><small className="text-muted">{clientesFiltrados.length} de {clientes.length}</small></div><Can permission="CLIENT_CREATE"><button type="button" className="btn btn-primary" onClick={abrirCrear}>+ Nuevo cliente</button></Can></div>
      <div className="mb-3"><input type="search" className="form-control" placeholder="Buscar por identificación, nombre, correo, estado o lista..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
      {cargando ? <div className="text-center py-5"><div className="spinner-border" role="status" /><div className="text-muted mt-2">Cargando...</div></div> : clientesFiltrados.length === 0 ? <div className="text-muted text-center py-5">{clientes.length === 0 ? 'No hay clientes registrados.' : 'No se encontraron clientes con la búsqueda.'}</div> : <><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Identificación</th><th>Cliente</th><th>Tipo</th><th>Correo</th><th>Estado</th><th>Compliance</th><th className="text-end">Acciones</th></tr></thead><tbody>{clientesVisibles.map((cliente) => <tr key={cliente.id}><td>{cliente.identification_number}</td><td>{cliente.full_name}</td><td>{cliente.person_type === 'NATURAL' ? 'Natural' : 'Jurídica'}</td><td>{cliente.email || '-'}</td><td><span className={`badge ${cliente.status === 'ACTIVE' ? 'text-bg-success' : 'text-bg-secondary'}`}>{cliente.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</span></td><td>{cliente.is_listed ? <span className="badge text-bg-danger">{cliente.list_type || 'LISTADO'}</span> : <span className="badge text-bg-success">OK</span>}</td><td className="text-end text-nowrap"><Can permission="CLIENT_UPDATE"><button type="button" className="btn btn-sm btn-outline-primary me-2" onClick={() => editar(cliente)}>Editar</button></Can><Can permission="CLIENT_DELETE"><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => solicitarEliminar(cliente)}>Eliminar</button></Can></td></tr>)}</tbody></table></div><div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3"><small className="text-muted">Página {pagina} de {totalPaginas}</small><div className="btn-group"><button type="button" className="btn btn-outline-secondary btn-sm" disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}>Anterior</button><button type="button" className="btn btn-outline-secondary btn-sm" disabled={pagina === totalPaginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</button></div></div></>}
    </div></div>

    {modalAbierto && <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,.5)', position: 'fixed', inset: 0, zIndex: 2000, overflowY: 'auto' }} role="dialog" aria-modal="true"><div className="modal-dialog modal-xl modal-dialog-centered"><div className="modal-content shadow-lg border-0"><div className="modal-header"><h5 className="modal-title fw-bold">{clienteEditando ? 'Editar cliente' : 'Nuevo cliente'}</h5><button type="button" className="btn-close" onClick={cerrarModal} disabled={guardando} aria-label="Cerrar" /></div><div className="modal-body" style={{ position: 'relative' }}><form onSubmit={guardar}><div className="row g-3">
      <div className="col-md-3"><label className="form-label fw-semibold">Tipo de persona</label><select className="form-select" value={formulario.person_type} onChange={(e) => cambiar('person_type', e.target.value)} disabled={guardando}><option value="NATURAL">Natural</option><option value="JURIDICA">Jurídica</option></select></div>
      <div className="col-md-3"><label className="form-label fw-semibold">Tipo identificación</label><select className="form-select" required value={formulario.identification_type_id} onChange={(e) => cambiar('identification_type_id', e.target.value)} disabled={guardando}><option value="">Seleccione...</option>{tiposDisponibles.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.code} - {tipo.name}</option>)}</select></div>
      <div className="col-md-3"><label className="form-label fw-semibold">Número identificación</label><input className="form-control" required maxLength="50" value={formulario.identification_number} onChange={(e) => cambiar('identification_number', e.target.value)} disabled={guardando} /></div>
      <div className="col-md-3"><label className="form-label fw-semibold">Estado</label><select className="form-select" value={formulario.status} onChange={(e) => cambiar('status', e.target.value)} disabled={guardando}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option></select></div>
      {formulario.person_type === 'NATURAL' ? ['first_name', 'middle_name', 'last_name', 'second_last_name'].map((campo) => <div className="col-md-3" key={campo}><label className="form-label fw-semibold">{{ first_name: 'Primer nombre', middle_name: 'Segundo nombre', last_name: 'Primer apellido', second_last_name: 'Segundo apellido' }[campo]}</label><input className="form-control" required={campo === 'first_name' || campo === 'last_name'} maxLength="100" value={formulario[campo]} onChange={(e) => cambiarNombre(campo, e.target.value)} disabled={guardando} /></div>) : <div className="col-md-6"><label className="form-label fw-semibold">Razón social</label><input className="form-control" required maxLength="250" value={formulario.business_name} onChange={(e) => cambiar('business_name', e.target.value)} disabled={guardando} /></div>}
      <div className="col-md-4"><label className="form-label fw-semibold">Correo</label><input type="email" className="form-control" value={formulario.email} onChange={(e) => cambiar('email', e.target.value)} disabled={guardando} /></div><div className="col-md-4"><label className="form-label fw-semibold">Teléfono</label><input className="form-control" maxLength="50" value={formulario.phone} onChange={(e) => cambiar('phone', e.target.value)} disabled={guardando} /></div><div className="col-md-4"><label className="form-label fw-semibold">Dirección</label><input className="form-control" maxLength="250" value={formulario.address} onChange={(e) => cambiar('address', e.target.value)} disabled={guardando} /></div>
      <div className="col-md-4"><label className="form-label fw-semibold">País</label><select className="form-select" value={formulario.country_id} onChange={(e) => setFormulario((actual) => ({ ...actual, country_id: e.target.value, department_id: '', city_id: '' }))} disabled={guardando}><option value="">Seleccione...</option>{paises.map((pais) => <option key={pais.id} value={pais.id}>{pais.code} - {pais.name}</option>)}</select></div><div className="col-md-4"><label className="form-label fw-semibold">Departamento</label><select className="form-select" value={formulario.department_id} onChange={(e) => setFormulario((actual) => ({ ...actual, department_id: e.target.value, city_id: '' }))} disabled={!formulario.country_id || cargandoDepartamentos || guardando}><option value="">{cargandoDepartamentos ? '⏳ Cargando departamentos...' : 'Seleccione...'}</option>{!cargandoDepartamentos && departamentos.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}</select></div><div className="col-md-4"><label className="form-label fw-semibold">Ciudad</label><select className="form-select" value={formulario.city_id} onChange={(e) => cambiar('city_id', e.target.value)} disabled={!formulario.department_id || cargandoCiudades || guardando}><option value="">{cargandoCiudades ? '⏳ Cargando ciudades...' : 'Seleccione...'}</option>{!cargandoCiudades && ciudades.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      <div className="col-12"><div className="form-check"><input className="form-check-input" type="checkbox" checked={formulario.consent_given} onChange={(e) => cambiar('consent_given', e.target.checked)} id="consentimiento-cliente" disabled={guardando} /><label className="form-check-label" htmlFor="consentimiento-cliente">Consentimiento otorgado</label></div></div><div className="col-md-6"><label className="form-label fw-semibold">Origen del consentimiento</label><input className="form-control" maxLength="100" value={formulario.consent_source} onChange={(e) => cambiar('consent_source', e.target.value)} disabled={guardando} /></div>
    </div>{guardando && <div className="position-absolute d-flex flex-column justify-content-center align-items-center" style={{ inset: 0, backgroundColor: 'rgba(255,255,255,.82)', zIndex: 5 }}><div className="spinner-border text-primary" role="status" aria-hidden="true" /><div className="fw-semibold mt-3">⏳ Guardando cliente...</div><small className="text-muted mt-1">Por favor espera, estamos procesando la información.</small></div>}<div className="d-flex justify-content-end gap-2 mt-4"><button type="button" className="btn btn-outline-secondary" onClick={cerrarModal} disabled={guardando}>Cancelar</button><button className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando...' : clienteEditando ? 'Actualizar' : 'Crear'}</button></div></form></div></div></div></div>}

    {clienteEliminando && <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,.55)', position: 'fixed', inset: 0, zIndex: 2100 }} role="dialog" aria-modal="true"><div className="modal-dialog modal-dialog-centered"><div className="modal-content shadow-lg border-0"><div className="modal-header border-0 pb-0"><h5 className="modal-title fw-bold">Eliminar cliente</h5><button type="button" className="btn-close" onClick={cancelarEliminar} disabled={eliminando} aria-label="Cerrar" /></div><div className="modal-body text-center px-4 py-4"><div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle bg-danger-subtle text-danger" style={{ width: 64, height: 64, fontSize: 28 }}>!</div><h5 className="fw-bold mb-2">¿Estás seguro?</h5><p className="text-muted mb-1">Vas a eliminar este cliente:</p><div className="fw-semibold">{clienteEliminando.full_name || clienteEliminando.identification_number}</div><small className="text-muted">Identificación: {clienteEliminando.identification_number}</small><p className="text-muted mt-3 mb-0">Esta acción cambiará el estado del registro según las reglas del sistema.</p></div><div className="modal-footer border-0 justify-content-center gap-2 pb-4"><button type="button" className="btn btn-outline-secondary px-4" onClick={cancelarEliminar} disabled={eliminando}>Cancelar</button><button type="button" className="btn btn-danger px-4" onClick={confirmarEliminar} disabled={eliminando}>{eliminando ? 'Eliminando...' : 'Sí, eliminar'}</button></div></div></div></div>}
  </>
}

export default ClientsPage
