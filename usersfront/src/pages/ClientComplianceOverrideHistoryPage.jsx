import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { obtenerHistorialLevantamientos } from '../services/clientsApi'
import SessionManager from '../components/SessionManager'

const PAGE_SIZE = 10
const fecha = (valor) => valor ? new Date(valor).toLocaleString('es-CO') : '-'

function ClientComplianceOverrideHistoryPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      try {
        setCargando(true)
        const resultado = await obtenerHistorialLevantamientos(token)
        if (!activo) return
        setRegistros(Array.isArray(resultado) ? resultado : [])
        setMensaje(null)
      } catch (error) {
        if (!activo) return
        if (error.status === 401) return manejarSesionExpirada()
        setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar el historial.' })
      } finally { if (activo) setCargando(false) }
    }
    if (token) cargar()
    return () => { activo = false }
  }, [token, manejarSesionExpirada])

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return registros
    return registros.filter((item) => [item.identification_number, item.full_name, item.requested_by_email, item.reason].some((valor) => String(valor ?? '').toLowerCase().includes(termino)))
  }, [registros, busqueda])
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE)

  return <>
    <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
    <div className="mb-4"><h2 className="fw-bold mb-1">Historial de levantamientos</h2><p className="text-muted mb-0">Auditoría histórica de las restricciones de compliance levantadas.</p></div>
    {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}
    <div className="card shadow-sm border-0"><div className="card-body">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><div><h5 className="fw-bold mb-0">Log histórico</h5><small className="text-muted">{filtrados.length} registro(s)</small></div></div>
      <div className="mb-3"><input type="search" className="form-control" placeholder="Buscar por identificación, cliente, usuario o motivo..." value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }} /></div>
      {cargando ? <div className="text-center py-5"><div className="spinner-border" role="status" /><div className="text-muted mt-2">Cargando...</div></div> : filtrados.length === 0 ? <div className="alert alert-info mb-0">No existen levantamientos registrados.</div> : <><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Fecha</th><th>Cliente</th><th>Identificación</th><th>Usuario</th><th>Motivo</th><th>Screening relacionado</th></tr></thead><tbody>{visibles.map((item) => <tr key={item.id}><td className="text-nowrap">{fecha(item.created_at)}</td><td>{item.full_name}</td><td>{item.identification_number}</td><td>{item.requested_by_email}</td><td style={{ minWidth: 300 }}>{item.reason}</td><td>{item.screening_id ? <small>{item.screening_id}</small> : '-'}</td></tr>)}</tbody></table></div><div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3"><small className="text-muted">Página {paginaActual} de {totalPaginas}</small><div className="btn-group"><button type="button" className="btn btn-outline-secondary btn-sm" disabled={paginaActual === 1} onClick={() => setPagina((p) => p - 1)}>Anterior</button><button type="button" className="btn btn-outline-secondary btn-sm" disabled={paginaActual === totalPaginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</button></div></div></>}
    </div></div>
  </>
}

export default ClientComplianceOverrideHistoryPage
