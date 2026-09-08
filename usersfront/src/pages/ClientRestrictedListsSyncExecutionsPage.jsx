import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Can from '../components/Can'
import SessionManager from '../components/SessionManager'
import {
  ejecutarSincronizacionListasManual,
  obtenerEjecucionesSincronizacionListas,
} from '../services/clientsApi'

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

const duracion = (item) => {
  if (item.duration_ms == null) return item.status === 'RUNNING' ? 'En ejecución' : '-'
  const totalSegundos = Math.floor(item.duration_ms / 1000)
  const horas = Math.floor(totalSegundos / 3600)
  const minutos = Math.floor((totalSegundos % 3600) / 60)
  const segundos = totalSegundos % 60
  if (horas) return `${horas} h ${minutos} min ${segundos} s`
  if (minutos) return `${minutos} min ${segundos} s`
  return `${segundos} s`
}

const etiquetaEstado = {
  PENDING: 'Pendiente',
  RUNNING: 'En ejecución',
  SUCCESS: 'Completada',
  PARTIAL_ERROR: 'Completada con errores',
  ERROR: 'Fallida',
}

const claseEstado = {
  PENDING: 'text-bg-secondary',
  RUNNING: 'text-bg-primary',
  SUCCESS: 'text-bg-success',
  PARTIAL_ERROR: 'text-bg-warning',
  ERROR: 'text-bg-danger',
}

const resultadoDetalle = (item) => {
  const fuentes = item.result?.sources
  if (!Array.isArray(fuentes) || fuentes.length === 0) {
    return item.error_message || '-'
  }
  return fuentes
}

function ClientRestrictedListsSyncExecutionsPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [ejecuciones, setEjecuciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [ejecutando, setEjecutando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const cargar = useCallback(async (mostrarCarga = false) => {
    try {
      if (mostrarCarga) setCargando(true)
      const resultado = await obtenerEjecucionesSincronizacionListas(token)
      setEjecuciones(Array.isArray(resultado) ? resultado : [])
      setMensaje(null)
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible cargar las ejecuciones de sincronización.' })
    } finally {
      if (mostrarCarga) setCargando(false)
    }
  }, [token, manejarSesionExpirada])

  useEffect(() => {
    if (token) cargar(true)
  }, [token, cargar])

  const hayEjecucionActiva = useMemo(
    () => ejecuciones.some((item) => item.status === 'PENDING' || item.status === 'RUNNING'),
    [ejecuciones],
  )

  useEffect(() => {
    if (!token || !hayEjecucionActiva) return undefined
    const intervalo = window.setInterval(() => cargar(false), 3000)
    return () => window.clearInterval(intervalo)
  }, [token, hayEjecucionActiva, cargar])

  const ejecutarManual = async () => {
    try {
      setEjecutando(true)
      setMensaje(null)
      await ejecutarSincronizacionListasManual(token)
      await cargar(false)
      setMensaje({ tipo: 'success', texto: 'La sincronización fue programada. El proceso continuará en segundo plano.' })
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible iniciar la sincronización.' })
    } finally {
      setEjecutando(false)
    }
  }

  return <>
    <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div><h2 className="fw-bold mb-1">Ejecuciones de listas restrictivas</h2><p className="text-muted mb-0">Historial de sincronizaciones automáticas y manuales de las listas oficiales.</p></div>
      <Can permission="CLIENT_SCREENING">
        <button type="button" className="btn btn-primary" onClick={ejecutarManual} disabled={ejecutando || hayEjecucionActiva}>
          {ejecutando ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Programando...</> : '↻ Actualizar listas ahora'}
        </button>
      </Can>
    </div>

    {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}

    <div className="card shadow-sm border-0"><div className="card-body">
      <div className="d-flex justify-content-between align-items-center mb-3"><div><h5 className="fw-bold mb-0">Historial de ejecuciones</h5><small className="text-muted">Las ejecuciones activas se actualizan automáticamente.</small></div>{hayEjecucionActiva && <span className="badge text-bg-primary">Sincronización en curso</span>}</div>
      {cargando ? <div className="text-center py-5"><div className="spinner-border" role="status" /><div className="text-muted mt-2">Cargando ejecuciones...</div></div> : ejecuciones.length === 0 ? <div className="alert alert-info mb-0">Todavía no hay ejecuciones registradas.</div> : <div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Fecha</th><th>Inicio</th><th>Fin</th><th>Tiempo total</th><th>Origen</th><th>Estado</th><th>Fuentes</th><th>Resultado detalle</th></tr></thead><tbody>{ejecuciones.map((item) => { const detalle = resultadoDetalle(item); return <tr key={item.id}><td>{fecha(item.created_at)}</td><td>{fecha(item.started_at)}</td><td>{fecha(item.finished_at)}</td><td className="fw-semibold">{duracion(item)}</td><td>{item.trigger_type === 'MANUAL' ? 'Manual' : 'Cronjob'}{item.triggered_by_email && <><br /><small className="text-muted">{item.triggered_by_email}</small></>}</td><td><span className={`badge ${claseEstado[item.status] || 'text-bg-secondary'}`}>{etiquetaEstado[item.status] || item.status}</span></td><td>{item.total_sources ?? '-'}</td><td style={{ minWidth: '430px' }}>{Array.isArray(detalle) ? <div className="d-flex flex-column gap-1">{detalle.map((fuente) => <div key={fuente.source} className="small"><strong>{fuente.source}</strong> <span className={fuente.status === 'SUCCESS' ? 'text-success' : 'text-danger'}>{fuente.status}</span> — Total: {fuente.total ?? 0} Created: {fuente.created ?? 0} Updated: {fuente.updated ?? 0}{fuente.deactivated ? ` Deactivated: ${fuente.deactivated}` : ''}{fuente.error ? ` — Error: ${fuente.error}` : ''}</div>)}</div> : detalle}</td></tr> })}</tbody></table></div>}
    </div></div>
  </>
}

export default ClientRestrictedListsSyncExecutionsPage
