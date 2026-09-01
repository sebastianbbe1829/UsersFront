import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '../contexts/AuthContext'
import {
  actualizarExtintor,
  crearExtintor,
  eliminarExtintor,
  obtenerExtintores,
} from '../services/api'

const formularioInicial = {
  code: '',
  extinguisher_type: 'POLVO_QUIMICO_SECO',
  capacity: '',
  location: '',
  last_recharge_date: '',
  next_recharge_date: '',
  last_hydrostatic_test_date: '',
  next_hydrostatic_test_date: '',
  status: 'ACTIVE',
  is_stock: false,
}

const prepararDatos = (formulario) => {
  const datos = { ...formulario }
  Object.keys(datos).forEach((campo) => {
    if (datos[campo] === '') datos[campo] = null
  })
  return datos
}

function ExtinguishersPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [extintores, setExtintores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [editando, setEditando] = useState(null)
  const [formulario, setFormulario] = useState(formularioInicial)
  const [mensaje, setMensaje] = useState(null)

  const cargarExtintores = useCallback(async () => {
    if (!token) return
    try {
      setCargando(true)
      const resultado = await obtenerExtintores(token)
      setExtintores(Array.isArray(resultado) ? resultado : [])
      setMensaje(null)
    } catch (error) {
      if (error.status === 401) {
        manejarSesionExpirada()
        return
      }
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible consultar los extintores.' })
    } finally {
      setCargando(false)
    }
  }, [token, manejarSesionExpirada])

  useEffect(() => {
    cargarExtintores()
  }, [cargarExtintores])

  const cambiarCampo = (event) => {
    const { name, value, type, checked } = event.target
    setFormulario((actual) => ({ ...actual, [name]: type === 'checkbox' ? checked : value }))
  }

  const nuevoExtintor = () => {
    setEditando(null)
    setFormulario(formularioInicial)
    setMensaje(null)
  }

  const editarExtintor = (extintor) => {
    setEditando(extintor.id)
    setFormulario({
      code: extintor.code || '',
      extinguisher_type: extintor.extinguisher_type || '',
      capacity: extintor.capacity || '',
      location: extintor.location || '',
      last_recharge_date: extintor.last_recharge_date || '',
      next_recharge_date: extintor.next_recharge_date || '',
      last_hydrostatic_test_date: extintor.last_hydrostatic_test_date || '',
      next_hydrostatic_test_date: extintor.next_hydrostatic_test_date || '',
      status: extintor.status || 'ACTIVE',
      is_stock: Boolean(extintor.is_stock),
    })
    setMensaje(null)
  }

  const guardar = async (event) => {
    event.preventDefault()
    try {
      setGuardando(true)
      const datos = prepararDatos(formulario)
      const resultado = editando
        ? await actualizarExtintor(editando, datos, token)
        : await crearExtintor(datos, token)

      setExtintores((actuales) => editando
        ? actuales.map((item) => item.id === resultado.id ? resultado : item)
        : [...actuales, resultado]
      )
      setMensaje({ tipo: 'success', texto: editando ? 'Extintor actualizado correctamente.' : 'Extintor creado correctamente.' })
      nuevoExtintor()
    } catch (error) {
      if (error.status === 401) {
        manejarSesionExpirada()
        return
      }
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible guardar el extintor.' })
    } finally {
      setGuardando(false)
    }
  }

  const desactivar = async (extintor) => {
    if (!window.confirm(`¿Deseas desactivar el extintor ${extintor.code}?`)) return
    try {
      await eliminarExtintor(extintor.id, token)
      setExtintores((actuales) => actuales.filter((item) => item.id !== extintor.id))
      setMensaje({ tipo: 'success', texto: 'Extintor desactivado correctamente.' })
    } catch (error) {
      if (error.status === 401) {
        manejarSesionExpirada()
        return
      }
      setMensaje({ tipo: 'danger', texto: error.message || 'No fue posible desactivar el extintor.' })
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Gestión de Extintores</h2>
          <p className="text-muted mb-0">Inventario, ubicación, recargas y pruebas hidrostáticas.</p>
        </div>
        <button className="btn btn-primary" onClick={nuevoExtintor}>＋ Nuevo extintor</button>
      </div>

      {mensaje && <div className={`alert alert-${mensaje.tipo}`} role="alert">{mensaje.texto}</div>}

      <div className="row g-3 mb-4">
        <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted">Total</div><div className="fs-3 fw-bold">{extintores.length}</div></div></div></div>
        <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted">Activos</div><div className="fs-3 fw-bold">{extintores.filter((item) => item.active).length}</div></div></div></div>
        <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><div className="text-muted">En stock</div><div className="fs-3 fw-bold">{extintores.filter((item) => item.is_stock).length}</div></div></div></div>
      </div>

      {(editando !== null || formulario.code === '') && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="fw-bold mb-3">{editando ? 'Editar extintor' : 'Nuevo extintor'}</h5>
            <form onSubmit={guardar}>
              <div className="row g-3">
                {[
                  ['code', 'Código', 'text'],
                  ['extinguisher_type', 'Tipo de extintor', 'text'],
                  ['capacity', 'Capacidad', 'text'],
                  ['location', 'Ubicación', 'text'],
                  ['last_recharge_date', 'Última recarga', 'date'],
                  ['next_recharge_date', 'Próxima recarga', 'date'],
                  ['last_hydrostatic_test_date', 'Última prueba hidrostática', 'date'],
                  ['next_hydrostatic_test_date', 'Próxima prueba hidrostática', 'date'],
                ].map(([campo, etiqueta, tipo]) => (
                  <div className="col-md-6" key={campo}>
                    <label className="form-label">{etiqueta}</label>
                    <input className="form-control" name={campo} type={tipo} value={formulario[campo] || ''} onChange={cambiarCampo} required={['code', 'extinguisher_type'].includes(campo)} />
                  </div>
                ))}
                <div className="col-md-6">
                  <label className="form-label">Estado</label>
                  <select className="form-select" name="status" value={formulario.status} onChange={cambiarCampo}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
                <div className="col-md-6 d-flex align-items-end">
                  <div className="form-check mb-2">
                    <input className="form-check-input" id="is_stock" name="is_stock" type="checkbox" checked={formulario.is_stock} onChange={cambiarCampo} />
                    <label className="form-check-label" htmlFor="is_stock">Es inventario en stock</label>
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2 mt-4">
                <button className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => { setEditando(null); setFormulario(formularioInicial) }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {cargando ? (
            <div className="text-center py-5"><div className="spinner-border text-primary mb-2" role="status" /><div className="text-muted">Cargando extintores...</div></div>
          ) : extintores.length === 0 ? (
            <div className="text-center py-5 text-muted">No hay extintores registrados.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead><tr><th>Código</th><th>Tipo</th><th>Capacidad</th><th>Ubicación</th><th>Próxima recarga</th><th>Estado</th><th className="text-end">Acciones</th></tr></thead>
                <tbody>
                  {extintores.map((item) => (
                    <tr key={item.id}>
                      <td className="fw-semibold">{item.code}</td>
                      <td>{item.extinguisher_type}</td>
                      <td>{item.capacity || '—'}</td>
                      <td>{item.location || '—'}</td>
                      <td>{item.next_recharge_date || '—'}</td>
                      <td><span className={`badge ${item.active ? 'text-bg-success' : 'text-bg-secondary'}`}>{item.active ? 'ACTIVO' : 'INACTIVO'}</span></td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editarExtintor(item)}>Editar</button>
                        {item.active && <button className="btn btn-sm btn-outline-danger" onClick={() => desactivar(item)}>Desactivar</button>}
                      </td>
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

export default ExtinguishersPage
