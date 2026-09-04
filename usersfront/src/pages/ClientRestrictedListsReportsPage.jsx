import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { obtenerClientes } from '../services/clientsApi'
import SessionManager from '../components/SessionManager'

const PAGE_SIZE = 10

function ClientRestrictedListsReportsPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      try {
        setCargando(true)
        const resultado = await obtenerClientes(token)
        if (!activo) return
        setClientes((Array.isArray(resultado) ? resultado : []).filter((cliente) => cliente.is_listed))
        setMensaje(null)
      } catch (error) {
        if (!activo) return
        if (error.status === 401) return manejarSesionExpirada()
        setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar el informe de listas restrictivas.' })
      } finally { if (activo) setCargando(false) }
    }
    if (token) cargar()
    return () => { activo = false }
  }, [token, manejarSesionExpirada])

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return clientes
    return clientes.filter((cliente) => [cliente.identification_number, cliente.full_name, cliente.person_type, cliente.compliance_status, cliente.list_type].some((valor) => String(valor ?? '').toLowerCase().includes(termino)))
  }, [clientes, busqueda])
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const visibles = filtrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)
  useEffect(() => { setPagina(1) }, [busqueda])
  useEffect(() => { if (pagina > totalPaginas) setPagina(totalPaginas) }, [pagina, totalPaginas])

  return <>
    <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
    <div className="mb-4"><h2 className="fw-bold mb-1">Informes Listas Restrictivas</h2><p className="text-muted mb-0">Consulta de clientes marcados en listas restrictivas por el proceso de cumplimiento.</p></div>
    {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}
    <div className="card shadow-sm border-0"><div className="card-body">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><div><h5 className="fw-bold mb-0">Clientes reportados</h5><small className="text-muted">{filtrados.length} de {clientes.length}</small></div></div>
      <div className="mb-3"><input type="search" className="form-control" placeholder="Buscar por identificación, cliente, tipo, estado o lista..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
      {cargando ? <div className="text-center py-5"><div className="spinner-border" role="status" /><div className="text-muted mt-2">Cargando...</div></div> : filtrados.length === 0 ? <div className="alert alert-success mb-0">{clientes.length === 0 ? 'No hay clientes marcados en listas restrictivas.' : 'No se encontraron registros con la búsqueda.'}</div> : <><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Identificación</th><th>Cliente</th><th>Tipo</th><th>Estado cumplimiento</th><th>Lista</th></tr></thead><tbody>{visibles.map((cliente) => <tr key={cliente.id}><td>{cliente.identification_number}</td><td>{cliente.full_name}</td><td>{cliente.person_type === 'NATURAL' ? 'Natural' : 'Jurídica'}</td><td>{cliente.compliance_status || '-'}</td><td><span className="badge text-bg-danger">{cliente.list_type || 'LISTADO'}</span></td></tr>)}</tbody></table></div><div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3"><small className="text-muted">Página {pagina} de {totalPaginas}</small><div className="btn-group"><button type="button" className="btn btn-outline-secondary btn-sm" disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}>Anterior</button><button type="button" className="btn btn-outline-secondary btn-sm" disabled={pagina === totalPaginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</button></div></div></>}
    </div></div>
  </>
}

export default ClientRestrictedListsReportsPage
