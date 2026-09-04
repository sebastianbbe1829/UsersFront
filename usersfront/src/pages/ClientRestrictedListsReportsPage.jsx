import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { obtenerClientes } from '../services/clientsApi'
import SessionManager from '../components/SessionManager'

function ClientRestrictedListsReportsPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState(null)

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
      } finally {
        if (activo) setCargando(false)
      }
    }
    if (token) cargar()
    return () => { activo = false }
  }, [token, manejarSesionExpirada])

  return <>
    <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
    <div className="mb-4">
      <h2 className="fw-bold mb-1">Informes Listas Restrictivas</h2>
      <p className="text-muted mb-0">Consulta de clientes marcados en listas restrictivas por el proceso de cumplimiento.</p>
    </div>
    {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}
    <div className="card shadow-sm border-0">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">Clientes reportados</h5>
          <span className="badge text-bg-danger">{clientes.length}</span>
        </div>
        {cargando ? <div className="text-center py-4"><div className="spinner-border text-primary" role="status" /></div> : clientes.length === 0 ? <div className="alert alert-success mb-0">No hay clientes marcados en listas restrictivas.</div> : <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Identificación</th><th>Cliente</th><th>Tipo</th><th>Estado cumplimiento</th><th>Lista</th></tr></thead><tbody>{clientes.map((cliente) => <tr key={cliente.id}><td>{cliente.identification_number}</td><td>{cliente.full_name}</td><td>{cliente.person_type === 'NATURAL' ? 'Natural' : 'Jurídica'}</td><td>{cliente.compliance_status || '-'}</td><td><span className="badge text-bg-danger">{cliente.list_type || 'LISTADO'}</span></td></tr>)}</tbody></table></div>}
      </div>
    </div>
  </>
}

export default ClientRestrictedListsReportsPage
