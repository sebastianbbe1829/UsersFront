import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Can from '../components/Can'
import { actualizarCliente, obtenerClientes } from '../services/clientsApi'

const money = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value || 0))

export default function ClientCreditLimitsPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const location = useLocation()
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [valores, setValores] = useState({})

  useEffect(() => {
    if (!token) return undefined
    let activo = true
    const cargar = async () => {
      try {
        setCargando(true)
        const resultado = await obtenerClientes(token, { page: 1, pageSize: 100, search: '' })
        const datos = Array.isArray(resultado?.items) ? resultado.items : Array.isArray(resultado) ? resultado : []
        if (!activo) return
        setClientes(datos)
        setValores(Object.fromEntries(datos.map((cliente) => [cliente.id, String(cliente.credit_limit ?? 0)])))
      } catch (error) {
        if (!activo) return
        if (error.status === 401) return manejarSesionExpirada()
        setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar los clientes.' })
      } finally { if (activo) setCargando(false) }
    }
    void cargar()
    return () => { activo = false }
  }, [manejarSesionExpirada, token, location.pathname])

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return clientes
    return clientes.filter((cliente) => `${cliente.full_name || ''} ${cliente.identification_number || ''}`.toLowerCase().includes(termino))
  }, [busqueda, clientes])

  const guardar = async (cliente) => {
    const valor = Number(valores[cliente.id] || 0)
    if (!Number.isFinite(valor) || valor < 0) return setMensaje({ tipo: 'warning', texto: 'El cupo aprobado debe ser un valor mayor o igual a cero.' })
    try {
      setGuardando(cliente.id); setMensaje(null)
      const actualizado = await actualizarCliente(cliente.id, { credit_limit: Math.round((valor + Number.EPSILON) * 100) / 100 }, token)
      setClientes((actuales) => actuales.map((item) => item.id === cliente.id ? actualizado : item))
      setValores((actuales) => ({ ...actuales, [cliente.id]: String(actualizado.credit_limit ?? valor) }))
      setMensaje({ tipo: 'success', texto: `Cupo de ${cliente.full_name} actualizado correctamente.` })
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible actualizar el cupo.' })
    } finally { setGuardando(null) }
  }

  return <>
    <div className="mb-4"><h2 className="fw-bold mb-1">Cupos de crédito</h2><p className="text-muted mb-0">Define el cupo aprobado para las ventas fiadas de cada cliente.</p></div>
    {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}
    <div className="card shadow-sm border-0"><div className="card-body">
      <div className="mb-3"><input className="form-control" type="search" placeholder="Buscar por identificación o nombre..." value={busqueda} onChange={(event) => setBusqueda(event.target.value)} /></div>
      {cargando ? <div className="text-center py-4"><div className="spinner-border" /></div> : <div className="table-responsive"><table className="table align-middle mb-0"><thead><tr><th>Cliente</th><th>Identificación</th><th>Cupo aprobado</th><th>Utilizado</th><th>Disponible</th><th>Acción</th></tr></thead><tbody>{filtrados.map((cliente) => <tr key={cliente.id}><td className="fw-semibold">{cliente.full_name}</td><td>{cliente.identification_number}</td><td style={{ maxWidth: 180 }}><input className="form-control" type="number" min="0" step="0.01" value={valores[cliente.id] ?? '0'} onChange={(event) => setValores((actuales) => ({ ...actuales, [cliente.id]: event.target.value }))} /></td><td>{money(cliente.credit_used)}</td><td className={Number(cliente.credit_available) > 0 ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>{money(cliente.credit_available)}</td><td><Can permission="CLIENT_UPDATE"><button className="btn btn-primary btn-sm" onClick={() => void guardar(cliente)} disabled={guardando === cliente.id}>{guardando === cliente.id ? 'Guardando...' : 'Guardar'}</button></Can></td></tr>)}</tbody></table>{!filtrados.length && <div className="text-center text-muted py-4">No se encontraron clientes.</div>}</div>}
    </div></div>
  </>
}
