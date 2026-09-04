import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import SessionManager from '../components/SessionManager'

function ClientCatalogPage({ title, description, loader, columns = ['name'], params }) {
  const { token, manejarSesionExpirada } = useAuth()
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      try {
        setCargando(true)
        const resultado = await loader(token, params)
        if (!activo) return
        setItems(Array.isArray(resultado) ? resultado : [])
        setMensaje(null)
      } catch (error) {
        if (!activo) return
        if (error.status === 401) return manejarSesionExpirada()
        setMensaje({ tipo: 'danger', texto: error.message || `No fue posible cargar ${title.toLowerCase()}.` })
      } finally {
        if (activo) setCargando(false)
      }
    }
    if (token) cargar()
    return () => { activo = false }
  }, [token, params, loader, manejarSesionExpirada, title])

  return <>
    <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
    <div className="mb-4">
      <h2 className="fw-bold mb-1">{title}</h2>
      <p className="text-muted mb-0">{description}</p>
    </div>
    {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}
    <div className="card shadow-sm border-0">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">Registros</h5>
          <span className="badge text-bg-secondary">{items.length}</span>
        </div>
        {cargando ? <div className="text-center py-4"><div className="spinner-border text-primary" role="status" /></div> : items.length === 0 ? <div className="text-muted text-center py-4">No hay registros.</div> : <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr>{columns.map((column) => <th key={column.key || column}>{column.label || column}</th>)}</tr></thead><tbody>{items.map((item) => <tr key={item.id}>{columns.map((column) => <td key={column.key || column}>{column.render ? column.render(item) : item[column.key || column] ?? '-'}</td>)}</tr>)}</tbody></table></div>}
      </div>
    </div>
  </>
}

export default ClientCatalogPage
