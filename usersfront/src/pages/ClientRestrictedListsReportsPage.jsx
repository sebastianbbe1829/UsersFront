import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { obtenerInformeListasRestrictivas } from '../services/clientsApi'
import SessionManager from '../components/SessionManager'

const PAGE_SIZE = 10
const fecha = (valor) => {
  if (!valor) return '-'
  const texto = String(valor)
  const tieneZona = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(texto)
  const fechaUtc = new Date(tieneZona ? texto : `${texto}Z`)
  if (Number.isNaN(fechaUtc.getTime())) return '-'
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(fechaUtc)
}

function ClientRestrictedListsReportsPage() {
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
        const resultado = await obtenerInformeListasRestrictivas(token)
        if (!activo) return
        setRegistros(Array.isArray(resultado) ? resultado : [])
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
    if (!termino) return registros
    return registros.filter((item) => [
      item.identification_number, item.full_name, item.person_type, item.status,
      item.compliance_status, item.list_type, item.client_created_by,
      item.screening_status, item.screening_risk_level,
    ].some((valor) => String(valor ?? '').toLowerCase().includes(termino)))
  }, [registros, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE)

  return <>
    <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
    <div className="mb-4"><h2 className="fw-bold mb-1">Informes Listas Restrictivas</h2><p className="text-muted mb-0">Detalle de clientes con coincidencias y trazabilidad de las revisiones de compliance.</p></div>
    {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}
    <div className="card shadow-sm border-0"><div className="card-body">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><div><h5 className="fw-bold mb-0">Clientes reportados</h5><small className="text-muted">{filtrados.length} registro(s)</small></div></div>
      <div className="mb-3"><input type="search" className="form-control" placeholder="Buscar por identificación, cliente, usuario, lista o estado..." value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }} /></div>
      {cargando ? <div className="text-center py-5"><div className="spinner-border" role="status" /><div className="text-muted mt-2">Cargando...</div></div> : filtrados.length === 0 ? <div className="alert alert-success mb-0">No hay clientes actualmente marcados en listas restrictivas.</div> : <><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Identificación</th><th>Cliente</th><th>Estado</th><th>Lista</th><th>Riesgo</th><th>Creado por</th><th>Fecha creación</th><th>Última revisión</th><th>Resultado</th></tr></thead><tbody>{visibles.map((item) => <tr key={item.client_id}><td>{item.identification_number}</td><td>{item.full_name}<br /><small className="text-muted">{item.person_type === 'NATURAL' ? 'Natural' : 'Jurídica'}</small></td><td><span className="badge text-bg-danger">{item.status === 'BLOCKED' ? 'Bloqueado' : item.status}</span></td><td><span className="badge text-bg-danger">{item.list_type || 'LISTADO'}</span></td><td>{item.screening_risk_level || '-'}</td><td>{item.client_created_by}</td><td>{fecha(item.client_created_at)}</td><td>{fecha(item.screening_requested_at)}</td><td>{item.screening_status || item.compliance_status}</td></tr>)}</tbody></table></div><div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3"><small className="text-muted">Página {paginaActual} de {totalPaginas}</small><div className="btn-group"><button type="button" className="btn btn-outline-secondary btn-sm" disabled={paginaActual === 1} onClick={() => setPagina((p) => p - 1)}>Anterior</button><button type="button" className="btn btn-outline-secondary btn-sm" disabled={paginaActual === totalPaginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</button></div></div></>}
    </div></div>
  </>
}

export default ClientRestrictedListsReportsPage
