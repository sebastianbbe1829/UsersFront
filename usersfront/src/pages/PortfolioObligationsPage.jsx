import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { obtenerObligaciones } from '../services/portfolioApi'
import { obtenerClientes } from '../services/clientsApi'

const money = (value) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(Number(value || 0))

const formatDate = (value) => {
  if (!value) return '—'
  const fecha = new Date(typeof value === 'string' && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? `${value}Z` : value)
  if (Number.isNaN(fecha.getTime())) return '—'
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(fecha)
}

const statusLabel = {
  ACTIVE: 'Activa',
  SETTLED: 'Saldada',
  CANCELLED: 'Cancelada',
}

const statusClass = {
  ACTIVE: 'text-bg-warning',
  SETTLED: 'text-bg-success',
  CANCELLED: 'text-bg-secondary',
}

export default function PortfolioObligationsPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const navigate = useNavigate()
  const [obligaciones, setObligaciones] = useState([])
  const [clientes, setClientes] = useState([])
  const [clientId, setClientId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState(null)

  const cargarClientes = useCallback(async () => {
    const pageSize = 100
    const acumulados = []
    let page = 1

    while (page <= 50) {
      const resultado = await obtenerClientes(token, { page, pageSize, search: '' })
      const items = Array.isArray(resultado?.items) ? resultado.items : []
      acumulados.push(...items)
      if (items.length < pageSize || !resultado?.total || acumulados.length >= resultado.total) break
      page += 1
    }

    setClientes(acumulados)
  }, [token])

  const cargar = useCallback(async (filtros = {}) => {
    try {
      setMensaje(null)
      const resultado = await obtenerObligaciones(token, filtros)
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
    Promise.resolve()
      .then(() => cargar())
      .then(() => cargarClientes())
      .catch((error) => {
        if (error.status === 401) manejarSesionExpirada()
      })
    return undefined
  }, [token, cargar, cargarClientes, manejarSesionExpirada])

  const aplicarFiltros = async (event) => {
    event?.preventDefault()
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setMensaje({ tipo: 'warning', texto: 'La fecha inicial no puede ser posterior a la fecha final.' })
      return
    }
    setCargando(true)
    await cargar({
      clientId: clientId || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    })
  }

  const limpiarFiltros = async () => {
    setClientId('')
    setDateFrom('')
    setDateTo('')
    setCargando(true)
    await cargar()
  }

  const clientePorId = Object.fromEntries(clientes.map((cliente) => [cliente.id, cliente]))

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Obligaciones</h2>
          <p className="text-muted mb-0">Consulta y seguimiento de las obligaciones generadas por ventas a crédito.</p>
        </div>
      </div>

      {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={(event) => void aplicarFiltros(event)}>
            <div className="row g-3 align-items-end">
              <div className="col-lg-5">
                <label className="form-label fw-semibold" htmlFor="obligaciones-cliente">Cliente</label>
                <select id="obligaciones-cliente" className="form-select" value={clientId} onChange={(event) => setClientId(event.target.value)}>
                  <option value="">Todos los clientes</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.full_name} — {cliente.identification_number}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-sm-6 col-lg-2">
                <label className="form-label fw-semibold" htmlFor="obligaciones-desde">Desde</label>
                <input id="obligaciones-desde" type="date" className="form-control" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
              </div>
              <div className="col-sm-6 col-lg-2">
                <label className="form-label fw-semibold" htmlFor="obligaciones-hasta">Hasta</label>
                <input id="obligaciones-hasta" type="date" className="form-control" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
              </div>
              <div className="col-lg-3 d-flex gap-2">
                <button type="submit" className="btn btn-primary flex-grow-1">🔎 Filtrar</button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => void limpiarFiltros()}>Limpiar</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Venta</th>
                <th>Fecha</th>
                <th className="text-end">Valor inicial</th>
                <th className="text-end">Saldo</th>
                <th>Estado</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando && <tr><td colSpan="7" className="text-center py-5"><div className="spinner-border" /><div className="text-muted mt-2">Consultando obligaciones...</div></td></tr>}
              {!cargando && !obligaciones.length && <tr><td colSpan="7" className="text-center text-muted py-5">No hay obligaciones para los filtros seleccionados.</td></tr>}
              {!cargando && obligaciones.map((item) => {
                const cliente = clientePorId[item.client_id]
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="fw-semibold">{cliente?.full_name || 'Cliente no disponible'}</div>
                      <div className="small text-muted">{cliente?.identification_number || '—'}</div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 fw-semibold text-decoration-none"
                        onClick={() => navigate(`../ventas/consulta?sale=${encodeURIComponent(item.sale_number || item.sale_id)}`)}
                        title="Ver esta venta en la consulta de ventas"
                      >
                        {item.sale_number || 'Ver venta'}
                      </button>
                    </td>
                    <td>{formatDate(item.created_at)}</td>
                    <td className="text-end">{money(item.initial_amount)}</td>
                    <td className="text-end fw-bold">{money(item.balance)}</td>
                    <td><span className={`badge ${statusClass[item.status] || 'text-bg-secondary'}`}>{statusLabel[item.status] || item.status}</span></td>
                    <td className="text-end">
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => navigate(`../ventas/consulta?sale=${encodeURIComponent(item.sale_number || item.sale_id)}`)}>Ver venta</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
