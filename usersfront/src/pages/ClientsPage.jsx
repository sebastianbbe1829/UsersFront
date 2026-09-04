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
} from '../services/api'
import Can from '../components/Can'
import SessionManager from '../components/SessionManager'

const formularioInicial = {
  identification_type_id: '',
  identification_number: '',
  person_type: 'NATURAL',
  first_name: '',
  middle_name: '',
  last_name: '',
  second_last_name: '',
  business_name: '',
  email: '',
  phone: '',
  address: '',
  country_id: '',
  department_id: '',
  city_id: '',
  status: 'ACTIVE',
  consent_given: false,
  consent_at: null,
  consent_source: '',
}

function ClientsPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [clientes, setClientes] = useState([])
  const [tiposIdentificacion, setTiposIdentificacion] = useState([])
  const [paises, setPaises] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [ciudades, setCiudades] = useState([])
  const [formulario, setFormulario] = useState(formularioInicial)
  const [clienteEditando, setClienteEditando] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const cargar = async () => {
    try {
      setCargando(true)
      const [lista, tipos, paisesData] = await Promise.all([
        obtenerClientes(token),
        obtenerTiposIdentificacionCliente(token),
        obtenerPaisesCliente(token),
      ])
      setClientes(Array.isArray(lista) ? lista : [])
      setTiposIdentificacion(Array.isArray(tipos) ? tipos : [])
      setPaises(Array.isArray(paisesData) ? paisesData : [])
      setMensaje(null)
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar los clientes.' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [token])

  useEffect(() => {
    if (!formulario.country_id) {
      setDepartamentos([])
      setCiudades([])
      return
    }
    obtenerDepartamentosCliente(token, formulario.country_id)
      .then((data) => setDepartamentos(Array.isArray(data) ? data : []))
      .catch((error) => { if (error.status === 401) manejarSesionExpirada() })
  }, [formulario.country_id, token])

  useEffect(() => {
    if (!formulario.department_id) {
      setCiudades([])
      return
    }
    obtenerCiudadesCliente(token, formulario.department_id)
      .then((data) => setCiudades(Array.isArray(data) ? data : []))
      .catch((error) => { if (error.status === 401) manejarSesionExpirada() })
  }, [formulario.department_id, token])

  const tiposDisponibles = useMemo(
    () => tiposIdentificacion.filter((tipo) => tipo.person_type === formulario.person_type),
    [tiposIdentificacion, formulario.person_type],
  )

  useEffect(() => {
    const actual = tiposIdentificacion.find((tipo) => String(tipo.id) === String(formulario.identification_type_id))
    if (actual && actual.person_type !== formulario.person_type) {
      setFormulario((valor) => ({ ...valor, identification_type_id: '' }))
    }
  }, [formulario.person_type, tiposIdentificacion])

  const cambiar = (campo, valor) => setFormulario((actual) => ({ ...actual, [campo]: valor }))

  const limpiar = () => {
    setFormulario(formularioInicial)
    setClienteEditando(null)
    setDepartamentos([])
    setCiudades([])
  }

  const editar = (cliente) => {
    setClienteEditando(cliente)
    setFormulario({
      ...formularioInicial,
      ...Object.fromEntries(Object.entries(formularioInicial).map(([campo]) => [campo, cliente[campo] ?? formularioInicial[campo]])),
      identification_type_id: cliente.identification_type_id ?? '',
      country_id: cliente.country_id ?? '',
      department_id: cliente.department_id ?? '',
      city_id: cliente.city_id ?? '',
      consent_given: Boolean(cliente.consent_given),
      consent_at: cliente.consent_at ?? null,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const guardar = async (event) => {
    event.preventDefault()
    try {
      setGuardando(true)
      setMensaje(null)
      const datos = {
        ...formulario,
        identification_type_id: Number(formulario.identification_type_id),
        country_id: formulario.country_id ? Number(formulario.country_id) : null,
        department_id: formulario.department_id ? Number(formulario.department_id) : null,
        city_id: formulario.city_id ? Number(formulario.city_id) : null,
        email: formulario.email || null,
        consent_source: formulario.consent_source || null,
      }
      const resultado = clienteEditando
        ? await actualizarCliente(clienteEditando.id, datos, token)
        : await crearCliente(datos, token)
      setClientes((actuales) => clienteEditando
        ? actuales.map((cliente) => cliente.id === resultado.id ? resultado : cliente)
        : [...actuales, resultado])
      setMensaje({ tipo: 'success', texto: clienteEditando ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.' })
      limpiar()
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible guardar el cliente.' })
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (cliente) => {
    if (!window.confirm(`¿Eliminar el cliente ${cliente.full_name || cliente.identification_number}?`)) return
    try {
      await eliminarCliente(cliente.id, token)
      setClientes((actuales) => actuales.filter((item) => item.id !== cliente.id))
      setMensaje({ tipo: 'success', texto: 'Cliente eliminado correctamente.' })
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible eliminar el cliente.' })
    }
  }

  return (
    <>
      <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Gestión de Clientes</h2>
        <p className="text-muted mb-0">Clientes del tenant actual.</p>
      </div>

      {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}

      <Can permission="CLIENT_CREATE">
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">{clienteEditando ? 'Editar cliente' : 'Nuevo cliente'}</h5>
              {clienteEditando && <button type="button" className="btn btn-outline-secondary btn-sm" onClick={limpiar}>Cancelar edición</button>}
            </div>
            <form onSubmit={guardar}>
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Tipo de persona</label>
                  <select className="form-select" value={formulario.person_type} onChange={(e) => cambiar('person_type', e.target.value)}>
                    <option value="NATURAL">Natural</option>
                    <option value="JURIDICA">Jurídica</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Tipo identificación</label>
                  <select className="form-select" required value={formulario.identification_type_id} onChange={(e) => cambiar('identification_type_id', e.target.value)}>
                    <option value="">Seleccione...</option>
                    {tiposDisponibles.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.name}</option>)}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Número identificación</label>
                  <input className="form-control" required maxLength="50" value={formulario.identification_number} onChange={(e) => cambiar('identification_number', e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Estado</label>
                  <select className="form-select" value={formulario.status} onChange={(e) => cambiar('status', e.target.value)}>
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                  </select>
                </div>

                {formulario.person_type === 'NATURAL' ? <>
                  {['first_name', 'middle_name', 'last_name', 'second_last_name'].map((campo) => <div className="col-md-3" key={campo}>
                    <label className="form-label">{{ first_name: 'Primer nombre', middle_name: 'Segundo nombre', last_name: 'Primer apellido', second_last_name: 'Segundo apellido' }[campo]}</label>
                    <input className="form-control" required={campo === 'first_name' || campo === 'last_name'} maxLength="100" value={formulario[campo]} onChange={(e) => cambiar(campo, e.target.value)} />
                  </div>)}
                </> : <div className="col-md-6">
                  <label className="form-label">Razón social</label>
                  <input className="form-control" required maxLength="250" value={formulario.business_name} onChange={(e) => cambiar('business_name', e.target.value)} />
                </div>}

                <div className="col-md-4"><label className="form-label">Correo</label><input type="email" className="form-control" value={formulario.email} onChange={(e) => cambiar('email', e.target.value)} /></div>
                <div className="col-md-4"><label className="form-label">Teléfono</label><input className="form-control" maxLength="50" value={formulario.phone} onChange={(e) => cambiar('phone', e.target.value)} /></div>
                <div className="col-md-4"><label className="form-label">Dirección</label><input className="form-control" maxLength="250" value={formulario.address} onChange={(e) => cambiar('address', e.target.value)} /></div>

                <div className="col-md-4"><label className="form-label">País</label><select className="form-select" value={formulario.country_id} onChange={(e) => setFormulario((actual) => ({ ...actual, country_id: e.target.value, department_id: '', city_id: '' }))}><option value="">Seleccione...</option>{paises.map((pais) => <option key={pais.id} value={pais.id}>{pais.name}</option>)}</select></div>
                <div className="col-md-4"><label className="form-label">Departamento</label><select className="form-select" value={formulario.department_id} onChange={(e) => setFormulario((actual) => ({ ...actual, department_id: e.target.value, city_id: '' }))} disabled={!formulario.country_id}><option value="">Seleccione...</option>{departamentos.map((departamento) => <option key={departamento.id} value={departamento.id}>{departamento.name}</option>)}</select></div>
                <div className="col-md-4"><label className="form-label">Ciudad</label><select className="form-select" value={formulario.city_id} onChange={(e) => cambiar('city_id', e.target.value)} disabled={!formulario.department_id}><option value="">Seleccione...</option>{ciudades.map((ciudad) => <option key={ciudad.id} value={ciudad.id}>{ciudad.name}</option>)}</select></div>

                <div className="col-12"><div className="form-check"><input className="form-check-input" type="checkbox" checked={formulario.consent_given} onChange={(e) => cambiar('consent_given', e.target.checked)} id="consentimiento" /><label className="form-check-label" htmlFor="consentimiento">Consentimiento otorgado</label></div></div>
                <div className="col-md-6"><label className="form-label">Origen del consentimiento</label><input className="form-control" maxLength="100" value={formulario.consent_source} onChange={(e) => cambiar('consent_source', e.target.value)} /></div>
              </div>
              <div className="mt-4 d-flex gap-2"><button className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando...' : clienteEditando ? 'Actualizar cliente' : 'Crear cliente'}</button>{clienteEditando && <button type="button" className="btn btn-outline-secondary" onClick={limpiar}>Cancelar</button>}</div>
            </form>
          </div>
        </div>
      </Can>

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3"><h5 className="fw-bold mb-0">Clientes registrados</h5><span className="badge text-bg-secondary">{clientes.length}</span></div>
          {cargando ? <div className="text-center py-4"><div className="spinner-border text-primary" role="status" /></div> : clientes.length === 0 ? <div className="text-muted text-center py-4">No hay clientes registrados.</div> : <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Identificación</th><th>Cliente</th><th>Tipo</th><th>Correo</th><th>Estado</th><th>Compliance</th><th className="text-end">Acciones</th></tr></thead><tbody>{clientes.map((cliente) => <tr key={cliente.id}><td>{cliente.identification_number}</td><td>{cliente.full_name}</td><td>{cliente.person_type === 'NATURAL' ? 'Natural' : 'Jurídica'}</td><td>{cliente.email || '-'}</td><td><span className={`badge ${cliente.status === 'ACTIVE' ? 'text-bg-success' : 'text-bg-secondary'}`}>{cliente.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</span></td><td>{cliente.is_listed ? <span className="badge text-bg-danger">{cliente.list_type || 'LISTADO'}</span> : <span className="badge text-bg-success">OK</span>}</td><td className="text-end"><Can permission="CLIENT_UPDATE"><button className="btn btn-sm btn-outline-primary me-2" onClick={() => editar(cliente)}>Editar</button></Can><Can permission="CLIENT_DELETE"><button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(cliente)}>Eliminar</button></Can></td></tr>)}</tbody></table></div>}
        </div>
      </div>
    </>
  )
}

export default ClientsPage
