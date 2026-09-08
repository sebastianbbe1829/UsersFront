import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { obtenerObligaciones } from '../services/portfolioApi'
import { obtenerClientes } from '../services/clientsApi'

const money = (value) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(Number(value || 0))

export default function PortfolioObligationsPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [obligaciones, setObligaciones] = useState([])
  const [clientes, setClientes] = useState([])
  const [clientId, setClientId] = useState('')
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState(null)

  const cargar = useCallback(async (filtro = null) => {
    try {
      const resultado = await obtenerObligaciones(token, filtro || null)
      setObligaciones(Array.isArray(resultado) ? resultado : [])
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar las obligaciones.' })
    } finally {
      setCargando(false)
    }
  }, [token, manejarSesionExpirada])

  useEffect(() => {
    if (!token) return undefined
    Promise.resolve().then(() => cargar()).then(() => obtenerClientes(token, { page: 1, pageSize: 100, search: '' })).then((clientesResult) => {
      const datos = Array.isArray(clientesResult?.items) ? clientesResult.items : []
      setClientes(datos)
    }).catch((error) => {
      if (error.status === 401) manejarSesionExpirada()
    })
    return undefined
  }, [token, cargar, manejarSesionExpirada])

  const filtrar = async (event) => {
    const value = event.target.value
    setClientId(value)
    setMensaje(null)
    setCargando(true)
    await cargar(value || null)
  }

  const clienteNombre = Object.fromEntries(clientes.map((cliente) => [cliente.id, cliente.full_name]))

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Obligaciones</h2>
        <p className="text-muted mb-0">Consulta el saldo actual de cada obligación de cartera.</p>
      </div>
      {mensaje && <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-md-5">
              <select className="form-select" value={clientId} onChange={(event) => void filtrar(event)}>
                <option value="">Todos los clientes</option>
                {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.full_name} — {cliente.identification_number}</option>)}
              </select>
            </div>
          </div>
          {cargando ? <div className="text-center py-5"><div className="spinner-border" /></div> : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead><tr><th>Cliente</th><th>Venta</th><th>Valor inicial</th><th>Saldo</th><th>Estado</th></tr></thead>
                <tbody>{obligaciones.map((item) => (
                  <tr key={item.id}>
                    <td>{clienteNombre[item.client_id] || item.client_id}</td>
                    <td>{item.sale_id}</td>
                    <td>{money(item.initial_amount)}</td>
                    <td className="fw-semibold">{money(item.balance)}</td>
                    <td><span className={`badge ${item.status === 'SETTLED' ? 'text-bg-success' : 'text-bg-warning'}`}>{item.status}</span></td>
                  </tr>
                ))}</tbody>
              </table>
              {!obligaciones.length && <div className="text-center text-muted py-4">No hay obligaciones para mostrar.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
