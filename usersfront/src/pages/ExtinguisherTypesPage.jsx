import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { crearTipoExtintor, obtenerTiposExtintor } from '../services/api'

const formularioInicial = { code: '', name: '' }

function ExtinguisherTypesPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [tipos, setTipos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [formulario, setFormulario] = useState(formularioInicial)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const cargarTipos = useCallback(async () => {
    if (!token) return
    try {
      setCargando(true)
      const resultado = await obtenerTiposExtintor(token)
      setTipos(Array.isArray(resultado) ? resultado : [])
      setMensaje(null)
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible consultar los tipos de extintor.' })
    } finally {
      setCargando(false)
    }
  }, [token, manejarSesionExpirada])

  useEffect(() => { cargarTipos() }, [cargarTipos])

  const cambiarCampo = (event) => {
    const { name, value } = event.target
    setFormulario((actual) => ({ ...actual, [name]: value }))
  }

  const abrirNuevo = () => {
    setFormulario({ ...formularioInicial })
    setMensaje(null)
    setMostrarModal(true)
  }

  const cerrarModal = () => {
    if (guardando) return
    setFormulario({ ...formularioInicial })
    setMostrarModal(false)
  }

  const guardar = async (event) => {
    event.preventDefault()
    try {
      setGuardando(true)
      const resultado = await crearTipoExtintor({
        code: formulario.code.trim().toUpperCase(),
        name: formulario.name.trim(),
      }, token)
      setTipos((actuales) => [...actuales, resultado].sort((a, b) => a.code.localeCompare(b.code)))
      setMostrarModal(false)
      setFormulario({ ...formularioInicial })
      setMensaje({ tipo: 'success', texto: 'Tipo de extintor creado correctamente.' })
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible crear el tipo de extintor.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Tipos de extintores</h2>
          <p className="text-muted mb-0">Catálogo de tipos disponibles para el inventario.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={abrirNuevo}>＋ Nuevo tipo</button>
      </div>

      {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {cargando ? (
            <div className="text-center py-5"><div className="spinner-border text-primary mb-2" role="status" /><div className="text-muted">Cargando tipos...</div></div>
          ) : tipos.length === 0 ? (
            <div className="text-center py-5 text-muted">No hay tipos de extintor registrados.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead><tr><th>Código</th><th>Nombre</th><th>Estado</th></tr></thead>
                <tbody>
                  {tipos.map((tipo) => (
                    <tr key={tipo.id}>
                      <td className="fw-semibold">{tipo.code}</td>
                      <td>{tipo.name}</td>
                      <td><span className={`badge ${tipo.active ? 'text-bg-success' : 'text-bg-secondary'}`}>{tipo.active ? 'ACTIVO' : 'INACTIVO'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {mostrarModal && (
        <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="nuevoTipoExtintorTitulo" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', position: 'fixed', inset: 0, zIndex: 2000, overflowY: 'auto' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '600px', width: 'calc(100% - 2rem)', margin: '1rem auto' }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 id="nuevoTipoExtintorTitulo" className="modal-title">Nuevo tipo de extintor</h5>
                <button type="button" className="btn-close" aria-label="Cerrar" onClick={cerrarModal} disabled={guardando} />
              </div>
              <form onSubmit={guardar} autoComplete="off">
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Código</label>
                    <input className="form-control" name="code" value={formulario.code} onChange={cambiarCampo} placeholder="Ej. POLVO_QUIMICO_SECO" required disabled={guardando} />
                    <div className="form-text">Código único utilizado internamente.</div>
                  </div>
                  <div className="mb-1">
                    <label className="form-label">Nombre</label>
                    <input className="form-control" name="name" value={formulario.name} onChange={cambiarCampo} placeholder="Ej. Polvo químico seco (PQS)" required disabled={guardando} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={cerrarModal} disabled={guardando}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={guardando}>
                    {guardando ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Guardando...</> : 'Crear tipo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExtinguisherTypesPage
