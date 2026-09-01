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
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
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
    setFormulario(formularioInicial)
    setMensaje(null)
    setMostrarFormulario(true)
  }

  const cancelar = () => {
    setFormulario(formularioInicial)
    setMostrarFormulario(false)
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
      setMensaje({ tipo: 'success', texto: 'Tipo de extintor creado correctamente.' })
      cancelar()
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
        <button className="btn btn-primary" onClick={abrirNuevo}>＋ Nuevo tipo</button>
      </div>

      {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}

      {mostrarFormulario && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="fw-bold mb-3">Nuevo tipo de extintor</h5>
            <form onSubmit={guardar} autoComplete="off">
              <div className="row g-3">
                <div className="col-md-5">
                  <label className="form-label">Código</label>
                  <input className="form-control" name="code" value={formulario.code} onChange={cambiarCampo} placeholder="Ej. POLVO_QUIMICO_SECO" required disabled={guardando} />
                </div>
                <div className="col-md-7">
                  <label className="form-label">Nombre</label>
                  <input className="form-control" name="name" value={formulario.name} onChange={cambiarCampo} placeholder="Ej. Polvo químico seco (PQS)" required disabled={guardando} />
                </div>
              </div>
              <div className="d-flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
                <button type="button" className="btn btn-outline-secondary" onClick={cancelar} disabled={guardando}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  )
}

export default ExtinguisherTypesPage
