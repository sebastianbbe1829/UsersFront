import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { actualizarTipoExtintor, crearTipoExtintor, eliminarTipoExtintor, obtenerTiposExtintor } from '../services/api'

const formularioInicial = { code: '', name: '' }

function ExtinguisherTypesPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [tipos, setTipos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [formulario, setFormulario] = useState(formularioInicial)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [tipoEditando, setTipoEditando] = useState(null)
  const [tipoEliminando, setTipoEliminando] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  const cargarTipos = useCallback(async () => {
    if (!token) return
    try { setCargando(true); const resultado = await obtenerTiposExtintor(token); setTipos(Array.isArray(resultado) ? resultado : []); setMensaje(null) }
    catch (error) { if (error.status === 401) return manejarSesionExpirada(); setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible consultar los tipos de extintor.' }) }
    finally { setCargando(false) }
  }, [token, manejarSesionExpirada])

  useEffect(() => { cargarTipos() }, [cargarTipos])
  const cambiarCampo = (event) => { const { name, value } = event.target; setFormulario((actual) => ({ ...actual, [name]: value })) }
  const abrirNuevo = () => { setTipoEditando(null); setFormulario({ ...formularioInicial }); setMensaje(null); setMostrarModal(true) }
  const abrirEditar = (tipo) => { setTipoEditando(tipo); setFormulario({ code: tipo.code || '', name: tipo.name || '' }); setMensaje(null); setMostrarModal(true) }
  const cerrarModal = () => { if (guardando) return; setFormulario({ ...formularioInicial }); setTipoEditando(null); setMostrarModal(false) }

  const guardar = async (event) => {
    event.preventDefault()
    try {
      setGuardando(true)
      const datos = { code: formulario.code.trim().toUpperCase(), name: formulario.name.trim() }
      const resultado = tipoEditando ? await actualizarTipoExtintor(tipoEditando.id, datos, token) : await crearTipoExtintor(datos, token)
      if (tipoEditando) { setTipos((actuales) => actuales.map((tipo) => tipo.id === resultado.id ? resultado : tipo).sort((a, b) => a.code.localeCompare(b.code))); setMensaje({ tipo: 'success', texto: 'Tipo de extintor actualizado correctamente.' }) }
      else { setTipos((actuales) => [...actuales, resultado].sort((a, b) => a.code.localeCompare(b.code))); setMensaje({ tipo: 'success', texto: 'Tipo de extintor creado correctamente.' }) }
      setMostrarModal(false); setFormulario({ ...formularioInicial }); setTipoEditando(null)
    } catch (error) { if (error.status === 401) return manejarSesionExpirada(); setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible guardar el tipo de extintor.' }) }
    finally { setGuardando(false) }
  }

  const confirmarEliminacion = async () => {
    if (!tipoEliminando) return
    try { setEliminando(true); await eliminarTipoExtintor(tipoEliminando.id, token); setTipos((actuales) => actuales.filter((tipo) => tipo.id !== tipoEliminando.id)); setTipoEliminando(null); setMensaje({ tipo: 'success', texto: 'Tipo de extintor eliminado correctamente.' }) }
    catch (error) { if (error.status === 401) return manejarSesionExpirada(); setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible eliminar el tipo de extintor.' }) }
    finally { setEliminando(false) }
  }

  return (
    <div className="container-fluid px-0 pb-3">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-2">
        <div><h4 className="mb-0 fw-bold">Tipos de extintores</h4><small className="text-muted">Catálogo de tipos disponibles para el inventario.</small></div>
        <button type="button" className="btn btn-primary btn-sm" onClick={abrirNuevo}>+ Nuevo tipo</button>
      </div>
      {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {cargando ? <div className="text-center py-5"><div className="spinner-border text-primary mb-2" role="status" /><div className="text-muted">Cargando tipos...</div></div> : tipos.length === 0 ? <div className="text-center py-5 text-muted">No hay tipos de extintor registrados.</div> : <>
            <div className="table-responsive d-none d-md-block"><table className="table table-hover align-middle mb-0 table-sm"><thead className="table-dark"><tr><th>Código</th><th>Nombre</th><th>Estado</th><th className="text-center">Acciones</th></tr></thead><tbody>{tipos.map((tipo) => <tr key={tipo.id}><td className="fw-semibold">{tipo.code}</td><td>{tipo.name}</td><td><span className={`badge ${tipo.active ? 'bg-success' : 'bg-secondary'}`}>{tipo.active ? 'ACTIVO' : 'INACTIVO'}</span></td><td><div className="d-flex justify-content-center align-items-center gap-1"><button type="button" className="btn btn-warning btn-sm py-0 px-2" onClick={() => abrirEditar(tipo)} disabled={eliminando} title="Editar">✏️</button><button type="button" className="btn btn-danger btn-sm py-0 px-2" onClick={() => setTipoEliminando(tipo)} disabled={eliminando} title="Eliminar">🗑️</button></div></td></tr>)}</tbody></table></div>
            <div className="d-md-none p-3"><div className="d-flex flex-column gap-2">{tipos.map((tipo) => <div key={tipo.id} className="card shadow-sm border-0"><div className="card-body py-3"><div className="mb-2"><div className="text-muted small">Código</div><div className="fw-bold text-break">{tipo.code}</div></div><div className="mb-2"><div className="text-muted small">Nombre</div><div className="fw-semibold text-break">{tipo.name}</div></div><div className="mb-2"><div className="text-muted small mb-1">Estado</div><span className={`badge ${tipo.active ? 'bg-success' : 'bg-secondary'}`}>{tipo.active ? 'Activo' : 'Inactivo'}</span></div><div className="d-grid gap-1"><button type="button" className="btn btn-warning btn-sm" onClick={() => abrirEditar(tipo)} disabled={eliminando}>✏️ Editar</button><button type="button" className="btn btn-danger btn-sm" onClick={() => setTipoEliminando(tipo)} disabled={eliminando}>🗑️ Eliminar</button></div></div></div>)}</div></div>
          </>}
        </div>
      </div>

      {mostrarModal && <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="tipoExtintorTitulo" style={{ backgroundColor: 'rgba(0,0,0,.5)', position: 'fixed', inset: 0, zIndex: 2000, overflowY: 'auto' }}><div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '600px', width: 'calc(100% - 2rem)', margin: '1rem auto' }}><div className="modal-content"><div className="modal-header"><h5 id="tipoExtintorTitulo" className="modal-title">{tipoEditando ? 'Editar tipo de extintor' : 'Nuevo tipo de extintor'}</h5><button type="button" className="btn-close" aria-label="Cerrar" onClick={cerrarModal} disabled={guardando} /></div><form onSubmit={guardar} autoComplete="off"><div className="modal-body"><div className="mb-3"><label className="form-label">Código</label><input className="form-control" name="code" value={formulario.code} onChange={cambiarCampo} placeholder="Ej. POLVO_QUIMICO_SECO" required disabled={guardando} /><div className="form-text">Código único utilizado internamente.</div></div><div className="mb-1"><label className="form-label">Nombre</label><input className="form-control" name="name" value={formulario.name} onChange={cambiarCampo} placeholder="Ej. Polvo químico seco (PQS)" required disabled={guardando} /></div></div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={cerrarModal} disabled={guardando}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando...' : tipoEditando ? 'Guardar cambios' : 'Crear tipo'}</button></div></form></div></div></div>}
      {tipoEliminando && <div className="modal d-block" role="dialog" aria-modal="true" style={{ backgroundColor: 'rgba(0,0,0,.5)', position: 'fixed', inset: 0, zIndex: 2100, overflowY: 'auto' }}><div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px', width: 'calc(100% - 2rem)', margin: '1rem auto' }}><div className="modal-content"><div className="modal-header"><h5 className="modal-title">Eliminar tipo de extintor</h5><button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setTipoEliminando(null)} disabled={eliminando} /></div><div className="modal-body"><p className="mb-2">¿Estás seguro de que deseas eliminar este tipo de extintor?</p><div className="alert alert-warning mb-0"><strong>{tipoEliminando.code}</strong> — {tipoEliminando.name}<div className="small mt-1">El tipo se desactivará y dejará de aparecer en el catálogo.</div></div></div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setTipoEliminando(null)} disabled={eliminando}>Cancelar</button><button type="button" className="btn btn-danger" onClick={confirmarEliminacion} disabled={eliminando}>{eliminando ? 'Eliminando...' : 'Eliminar'}</button></div></div></div></div>}
    </div>
  )
}

export default ExtinguisherTypesPage