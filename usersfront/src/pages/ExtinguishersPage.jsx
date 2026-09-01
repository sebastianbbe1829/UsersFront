import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { actualizarExtintor, crearExtintor, eliminarExtintor, obtenerExtintores, obtenerTiposExtintor } from '../services/api'

const formularioInicial = { code: '', extinguisher_type_id: '', capacity: '', location: '', last_recharge_date: '', next_recharge_date: '', last_hydrostatic_test_date: '', next_hydrostatic_test_date: '', status: 'ACTIVE', is_stock: false }

const prepararDatos = (formulario) => Object.fromEntries(Object.entries(formulario).map(([campo, valor]) => [campo, valor === '' ? null : valor]))

function ExtinguishersPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [extintores, setExtintores] = useState([])
  const [tiposExtintor, setTiposExtintor] = useState([])
  const [cargando, setCargando] = useState(true)
  const [cargandoTipos, setCargandoTipos] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [editando, setEditando] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [formulario, setFormulario] = useState(formularioInicial)
  const [mensaje, setMensaje] = useState(null)

  const cargarExtintores = useCallback(async () => {
    if (!token) return
    try {
      setCargando(true)
      const resultado = await obtenerExtintores(token)
      setExtintores(Array.isArray(resultado) ? resultado : [])
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible consultar los extintores.' })
    } finally { setCargando(false) }
  }, [token, manejarSesionExpirada])

  const cargarTiposExtintor = useCallback(async () => {
    if (!token) return
    try {
      setCargandoTipos(true)
      const resultado = await obtenerTiposExtintor(token)
      setTiposExtintor(Array.isArray(resultado) ? resultado.filter((tipo) => tipo.active) : [])
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible consultar los tipos de extintor.' })
    } finally { setCargandoTipos(false) }
  }, [token, manejarSesionExpirada])

  useEffect(() => { cargarExtintores(); cargarTiposExtintor() }, [cargarExtintores, cargarTiposExtintor])

  const cambiarCampo = (event) => {
    const { name, value, type, checked } = event.target
    setFormulario((actual) => ({ ...actual, [name]: type === 'checkbox' ? checked : value }))
  }

  const abrirNuevo = () => { setEditando(null); setFormulario({ ...formularioInicial }); setMensaje(null); setMostrarFormulario(true) }
  const cancelar = () => { setEditando(null); setFormulario({ ...formularioInicial }); setMostrarFormulario(false) }

  const editarExtintor = (extintor) => {
    setEditando(extintor.id)
    setMostrarFormulario(true)
    setFormulario({ code: extintor.code || '', extinguisher_type_id: extintor.extinguisher_type_id ? String(extintor.extinguisher_type_id) : '', capacity: extintor.capacity || '', location: extintor.location || '', last_recharge_date: extintor.last_recharge_date || '', next_recharge_date: extintor.next_recharge_date || '', last_hydrostatic_test_date: extintor.last_hydrostatic_test_date || '', next_hydrostatic_test_date: extintor.next_hydrostatic_test_date || '', status: extintor.status || 'ACTIVE', is_stock: Boolean(extintor.is_stock) })
    setMensaje(null)
  }

  const guardar = async (event) => {
    event.preventDefault()
    try {
      setGuardando(true)
      const datos = { ...prepararDatos(formulario), extinguisher_type_id: Number(formulario.extinguisher_type_id) }
      const resultado = editando ? await actualizarExtintor(editando, datos, token) : await crearExtintor(datos, token)
      setExtintores((actuales) => editando ? actuales.map((item) => item.id === resultado.id ? resultado : item) : [...actuales, resultado])
      setMensaje({ tipo: 'success', texto: editando ? 'Extintor actualizado correctamente.' : 'Extintor creado correctamente.' })
      cancelar()
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible guardar el extintor.' })
    } finally { setGuardando(false) }
  }

  const desactivar = async (extintor) => {
    if (!window.confirm(`¿Deseas desactivar el extintor ${extintor.code}?`)) return
    try {
      await eliminarExtintor(extintor.id, token)
      setExtintores((actuales) => actuales.filter((item) => item.id !== extintor.id))
      setMensaje({ tipo: 'success', texto: 'Extintor desactivado correctamente.' })
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible desactivar el extintor.' })
    }
  }

  const campos = [['code', 'Código', 'text'], ['capacity', 'Capacidad', 'text'], ['location', 'Ubicación', 'text'], ['last_recharge_date', 'Última recarga', 'date'], ['next_recharge_date', 'Próxima recarga', 'date'], ['last_hydrostatic_test_date', 'Última prueba hidrostática', 'date'], ['next_hydrostatic_test_date', 'Próxima prueba hidrostática', 'date']]

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h2 className="fw-bold mb-1">Gestión de Extintores</h2><p className="text-muted mb-0">Inventario, ubicación, recargas y pruebas hidrostáticas.</p></div>
        <button className="btn btn-primary" onClick={abrirNuevo}>＋ Nuevo extintor</button>
      </div>

      {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}

      <div className="row g-3 mb-4">
        {[['Total', extintores.length], ['Activos', extintores.filter((item) => item.active).length], ['En stock', extintores.filter((item) => item.is_stock).length]].map(([titulo, valor]) => <div className="col-md-4" key={titulo}><div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted">{titulo}</div><div className="fs-3 fw-bold">{valor}</div></div></div></div>)}
      </div>

      <div className="card border-0 shadow-sm"><div className="card-body p-0">
        {cargando ? <div className="text-center py-5"><div className="spinner-border text-primary mb-2" role="status" /><div className="text-muted">Cargando extintores...</div></div> : extintores.length === 0 ? <div className="text-center py-5 text-muted">No hay extintores registrados.</div> : <div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Código</th><th>Tipo</th><th>Capacidad</th><th>Ubicación</th><th>Próxima recarga</th><th>Estado</th><th className="text-end">Acciones</th></tr></thead><tbody>{extintores.map((item) => <tr key={item.id}><td className="fw-semibold">{item.code}</td><td>{item.extinguisher_type?.name || '—'}</td><td>{item.capacity || '—'}</td><td>{item.location || '—'}</td><td>{item.next_recharge_date || '—'}</td><td><span className={`badge ${item.active ? 'text-bg-success' : 'text-bg-secondary'}`}>{item.active ? 'ACTIVO' : 'INACTIVO'}</span></td><td className="text-end"><button className="btn btn-sm btn-outline-primary me-2" onClick={() => editarExtintor(item)}>Editar</button>{item.active && <button className="btn btn-sm btn-outline-danger" onClick={() => desactivar(item)}>Desactivar</button>}</td></tr>)}</tbody></table></div>}
      </div></div>

      {mostrarFormulario && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', position: 'fixed', inset: 0, zIndex: 2000, overflow: 'hidden' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '700px', width: 'calc(100% - 2rem)', margin: '1rem auto' }}>
            <div className="modal-content" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
              <div className="modal-header py-2 px-3"><h5 className="modal-title mb-0">{editando ? 'Editar extintor' : 'Nuevo extintor'}</h5><button type="button" className="btn-close" onClick={cancelar} disabled={guardando} /></div>
              <form onSubmit={guardar} autoComplete="off">
                <div className="modal-body py-3 px-3" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 150px)' }}>
                  <div className="row g-3">
                    {campos.map(([campo, etiqueta, tipo]) => <div className="col-md-6" key={campo}><label className="form-label mb-1">{etiqueta}</label><input className="form-control" name={campo} type={tipo} value={formulario[campo] || ''} onChange={cambiarCampo} required={campo === 'code'} disabled={guardando} /></div>)}
                    <div className="col-md-6">
                      <label className="form-label mb-1">Tipo de extintor</label>
                      <select className="form-select" name="extinguisher_type_id" value={formulario.extinguisher_type_id} onChange={cambiarCampo} required disabled={guardando || cargandoTipos}>
                        <option value="">{cargandoTipos ? 'Cargando tipos...' : 'Seleccione un tipo de extintor...'}</option>
                        {tiposExtintor.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.name}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6"><label className="form-label mb-1">Estado</label><select className="form-select" name="status" value={formulario.status} onChange={cambiarCampo} disabled={guardando}><option value="ACTIVE">ACTIVO</option><option value="INACTIVE">INACTIVO</option></select></div>
                    <div className="col-md-6 d-flex align-items-end"><div className="form-check mb-2"><input className="form-check-input" id="is_stock" name="is_stock" type="checkbox" checked={formulario.is_stock} onChange={cambiarCampo} disabled={guardando} /><label className="form-check-label" htmlFor="is_stock">Es inventario en stock</label></div></div>
                  </div>
                </div>
                <div className="modal-footer py-2 px-3"><button type="button" className="btn btn-secondary" onClick={cancelar} disabled={guardando}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={guardando || cargandoTipos}>{guardando ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Guardando...</> : (editando ? 'Guardar cambios' : 'Crear extintor')}</button></div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExtinguishersPage
