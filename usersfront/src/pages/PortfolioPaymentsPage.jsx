import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  obtenerObligacionesCliente,
  obtenerPagosCartera,
  registrarPagoCartera,
} from '../services/portfolioApi'
import { obtenerClientes } from '../services/clientsApi'

const money = (value) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(Number(value || 0))

const nuevoFormulario = { client_id: '', payment_date: '', payment_method: 'TRANSFERENCIA', amount: '', reference: '', notes: '' }

export default function PortfolioPaymentsPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [clientes, setClientes] = useState([])
  const [obligaciones, setObligaciones] = useState([])
  const [pagos, setPagos] = useState([])
  const [formulario, setFormulario] = useState(nuevoFormulario)
  const [asignaciones, setAsignaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const cargarPagos = useCallback(async () => {
    const resultado = await obtenerPagosCartera(token)
    setPagos(Array.isArray(resultado) ? resultado : [])
  }, [token])

  useEffect(() => {
    if (!token) return undefined
    Promise.resolve().then(() => Promise.all([
      obtenerClientes(token, { page: 1, pageSize: 100, search: '' }),
      cargarPagos(),
    ])).then(([clientesResult]) => {
      const datos = Array.isArray(clientesResult?.items) ? clientesResult.items : []
      setClientes(datos)
    }).catch((error) => {
      if (error.status === 401) manejarSesionExpirada()
      else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar los pagos.' })
    }).finally(() => setCargando(false))
    return undefined
  }, [token, cargarPagos, manejarSesionExpirada])

  const cargarObligaciones = async (clientId) => {
    if (!clientId) {
      setObligaciones([])
      setAsignaciones([])
      return
    }
    try {
      const resultado = await obtenerObligacionesCliente(clientId, token)
      const activas = (Array.isArray(resultado) ? resultado : []).filter((item) => item.status === 'ACTIVE' && Number(item.balance) > 0)
      setObligaciones(activas)
      setAsignaciones(activas.slice(0, 1).map((item) => ({ obligation_id: item.id, amount: '' })))
    } catch (error) {
      if (error.status === 401) manejarSesionExpirada()
      else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar las obligaciones.' })
    }
  }

  const cambiarCliente = async (event) => {
    const clientId = event.target.value
    setFormulario((actual) => ({ ...actual, client_id: clientId, amount: '' }))
    await cargarObligaciones(clientId)
  }

  const agregarAsignacion = () => {
    const usada = new Set(asignaciones.map((item) => item.obligation_id))
    const siguiente = obligaciones.find((item) => !usada.has(item.id))
    if (siguiente) setAsignaciones((actuales) => [...actuales, { obligation_id: siguiente.id, amount: '' }])
  }

  const actualizarAsignacion = (index, amount) => {
    setAsignaciones((actuales) => actuales.map((item, itemIndex) => itemIndex === index ? { ...item, amount } : item))
  }

  const totalAsignado = useMemo(
    () => asignaciones.reduce((total, item) => total + Number(item.amount || 0), 0),
    [asignaciones],
  )

  const guardar = async (event) => {
    event.preventDefault()
    const amount = Number(formulario.amount)
    if (!formulario.client_id || !Number.isFinite(amount) || amount <= 0) {
      setMensaje({ tipo: 'warning', texto: 'Selecciona un cliente e ingresa un valor de pago válido.' })
      return
    }
    const allocations = asignaciones.filter((item) => Number(item.amount) > 0).map((item) => ({
      obligation_id: item.obligation_id,
      amount: Number(item.amount),
    }))
    if (!allocations.length || Math.abs(totalAsignado - amount) > 0.001) {
      setMensaje({ tipo: 'warning', texto: 'La suma de los abonos debe ser igual al valor del pago.' })
      return
    }
    try {
      setGuardando(true)
      setMensaje(null)
      await registrarPagoCartera({
        client_id: formulario.client_id,
        payment_date: formulario.payment_date || undefined,
        payment_method: formulario.payment_method,
        amount,
        reference: formulario.reference || undefined,
        notes: formulario.notes || undefined,
        allocations,
      }, token)
      setFormulario(nuevoFormulario)
      setAsignaciones([])
      setObligaciones([])
      await cargarPagos()
      setMensaje({ tipo: 'success', texto: 'Pago registrado y aplicado correctamente.' })
    } catch (error) {
      if (error.status === 401) manejarSesionExpirada()
      else setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible registrar el pago.' })
    } finally {
      setGuardando(false)
    }
  }

  const clienteNombre = Object.fromEntries(clientes.map((cliente) => [cliente.id, cliente.full_name]))

  return (
    <div>
      <div className="mb-4"><h2 className="fw-bold mb-1">Pagos de cartera</h2><p className="text-muted mb-0">Registra pagos y distribúyelos entre una o varias obligaciones.</p></div>
      {mensaje && <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={guardar}>
            <div className="row g-3">
              <div className="col-md-5"><label className="form-label">Cliente</label><select className="form-select" value={formulario.client_id} onChange={(event) => void cambiarCliente(event)} required><option value="">Selecciona...</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.full_name} — {cliente.identification_number}</option>)}</select></div>
              <div className="col-md-3"><label className="form-label">Fecha</label><input className="form-control" type="date" value={formulario.payment_date} onChange={(event) => setFormulario((actual) => ({ ...actual, payment_date: event.target.value }))} /></div>
              <div className="col-md-4"><label className="form-label">Medio de pago</label><select className="form-select" value={formulario.payment_method} onChange={(event) => setFormulario((actual) => ({ ...actual, payment_method: event.target.value }))}><option>TRANSFERENCIA</option><option>EFECTIVO</option><option>TARJETA</option><option>OTRO</option></select></div>
              <div className="col-md-4"><label className="form-label">Valor del pago</label><input className="form-control" type="number" min="0.01" step="0.01" value={formulario.amount} onChange={(event) => setFormulario((actual) => ({ ...actual, amount: event.target.value }))} required /></div>
              <div className="col-md-4"><label className="form-label">Referencia</label><input className="form-control" maxLength="100" value={formulario.reference} onChange={(event) => setFormulario((actual) => ({ ...actual, reference: event.target.value }))} /></div>
              <div className="col-md-4"><label className="form-label">Notas</label><input className="form-control" maxLength="500" value={formulario.notes} onChange={(event) => setFormulario((actual) => ({ ...actual, notes: event.target.value }))} /></div>
            </div>

            {formulario.client_id && <div className="mt-4"><div className="d-flex justify-content-between align-items-center mb-2"><h6 className="mb-0">Aplicación del pago</h6><button type="button" className="btn btn-outline-primary btn-sm" onClick={agregarAsignacion}>Agregar obligación</button></div>{asignaciones.map((asignacion, index) => { const obligation = obligaciones.find((item) => item.id === asignacion.obligation_id); return <div className="row g-2 mb-2" key={asignacion.obligation_id}><div className="col-md-8"><select className="form-select" value={asignacion.obligation_id} onChange={(event) => setAsignaciones((actuales) => actuales.map((item, itemIndex) => itemIndex === index ? { ...item, obligation_id: event.target.value } : item))}><option value="">Selecciona obligación...</option>{obligaciones.map((item) => <option key={item.id} value={item.id}>{item.id} — saldo {money(item.balance)}</option>)}</select></div><div className="col-md-4"><input className="form-control" type="number" min="0.01" step="0.01" max={obligation?.balance || undefined} placeholder="Abono" value={asignacion.amount} onChange={(event) => actualizarAsignacion(index, event.target.value)} /></div></div> })}<div className="text-end small text-muted">Asignado: <strong>{money(totalAsignado)}</strong></div></div>}
            <div className="mt-4 text-end"><button className="btn btn-primary" type="submit" disabled={guardando}>{guardando ? 'Registrando...' : 'Registrar pago'}</button></div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm"><div className="card-body"><h6 className="mb-3">Histórico de pagos</h6>{cargando ? <div className="text-center py-4"><div className="spinner-border" /></div> : <div className="table-responsive"><table className="table align-middle mb-0"><thead><tr><th>Fecha</th><th>Cliente</th><th>Medio</th><th>Valor</th><th>Referencia</th></tr></thead><tbody>{pagos.map((pago) => <tr key={pago.id}><td>{pago.payment_date}</td><td>{clienteNombre[pago.client_id] || pago.client_id}</td><td>{pago.payment_method}</td><td className="fw-semibold">{money(pago.amount)}</td><td>{pago.reference || '—'}</td></tr>)}</tbody></table>{!pagos.length && <div className="text-center text-muted py-4">No hay pagos registrados.</div>}</div>}</div></div>
    </div>
  )
}
