import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '../contexts/AuthContext'
import {
  actualizarExtintor,
  crearExtintor,
  eliminarExtintor,
  obtenerExtintores,
  obtenerTiposExtintor,
} from '../services/api'

const formularioInicial = {
  code: '',
  extinguisher_type_id: '',
  capacity: '',
  location: '',
  last_recharge_date: '',
  next_recharge_date: '',
  last_hydrostatic_test_date: '',
  next_hydrostatic_test_date: '',
  status: 'ACTIVE',
  is_stock: false,
}

const prepararDatos = (formulario) =>
  Object.fromEntries(
    Object.entries(formulario).map(([campo, valor]) => [
      campo,
      valor === '' ? null : valor,
    ])
  )

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

  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [stockFiltro, setStockFiltro] = useState('todos')
  const [extintoresPorPagina, setExtintoresPorPagina] = useState(10)
  const [paginaActual, setPaginaActual] = useState(1)

  const cargarExtintores = useCallback(async () => {
    if (!token) return

    try {
      setCargando(true)
      const resultado = await obtenerExtintores(token)
      setExtintores(Array.isArray(resultado) ? resultado : [])
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({
        tipo: 'danger',
        texto: error.message || 'No fue posible consultar los extintores.',
      })
    } finally {
      setCargando(false)
    }
  }, [token, manejarSesionExpirada])

  const cargarTiposExtintor = useCallback(async () => {
    if (!token) return

    try {
      setCargandoTipos(true)
      const resultado = await obtenerTiposExtintor(token)
      setTiposExtintor(
        Array.isArray(resultado)
          ? resultado.filter((tipo) => tipo.active)
          : []
      )
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({
        tipo: 'danger',
        texto:
          error.message || 'No fue posible consultar los tipos de extintor.',
      })
    } finally {
      setCargandoTipos(false)
    }
  }, [token, manejarSesionExpirada])

  useEffect(() => {
    cargarExtintores()
    cargarTiposExtintor()
  }, [cargarExtintores, cargarTiposExtintor])

  const extintoresFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim()

    return extintores.filter((extintor) => {
      const coincideBusqueda =
        !texto ||
        String(extintor.code ?? '').toLowerCase().includes(texto) ||
        String(extintor.capacity ?? '').toLowerCase().includes(texto) ||
        String(extintor.location ?? '').toLowerCase().includes(texto) ||
        String(extintor.extinguisher_type?.name ?? '')
          .toLowerCase()
          .includes(texto)

      const coincideTipo =
        tipoFiltro === 'todos' ||
        String(extintor.extinguisher_type_id) === String(tipoFiltro)

      const coincideEstado =
        estadoFiltro === 'todos' ||
        (estadoFiltro === 'activos' && extintor.active) ||
        (estadoFiltro === 'inactivos' && !extintor.active)

      const coincideStock =
        stockFiltro === 'todos' ||
        (stockFiltro === 'stock' && extintor.is_stock) ||
        (stockFiltro === 'ubicados' && !extintor.is_stock)

      return (
        coincideBusqueda &&
        coincideTipo &&
        coincideEstado &&
        coincideStock
      )
    })
  }, [extintores, busqueda, tipoFiltro, estadoFiltro, stockFiltro])

  const totalPaginas = Math.ceil(
    extintoresFiltrados.length / extintoresPorPagina
  )

  const paginaSegura = Math.min(
    paginaActual,
    Math.max(totalPaginas, 1)
  )

  const indiceInicial =
    (paginaSegura - 1) * extintoresPorPagina

  const extintoresPagina = extintoresFiltrados.slice(
    indiceInicial,
    indiceInicial + extintoresPorPagina
  )

  const cambiarBusqueda = (valor) => {
    setBusqueda(valor)
    setPaginaActual(1)
  }

  const cambiarTipo = (valor) => {
    setTipoFiltro(valor)
    setPaginaActual(1)
  }

  const cambiarEstado = (valor) => {
    setEstadoFiltro(valor)
    setPaginaActual(1)
  }

  const cambiarStock = (valor) => {
    setStockFiltro(valor)
    setPaginaActual(1)
  }

  const cambiarCantidad = (valor) => {
    setExtintoresPorPagina(Number(valor))
    setPaginaActual(1)
  }

  const cambiarPagina = (pagina) => {
    if (pagina < 1 || pagina > totalPaginas) return
    setPaginaActual(pagina)
  }

  const limpiarFiltros = () => {
    setBusqueda('')
    setTipoFiltro('todos')
    setEstadoFiltro('todos')
    setStockFiltro('todos')
    setPaginaActual(1)
  }

  const abrirNuevo = () => {
    setEditando(null)
    setFormulario({ ...formularioInicial })
    setMensaje(null)
    setMostrarFormulario(true)
  }

  const cancelar = () => {
    setEditando(null)
    setFormulario({ ...formularioInicial })
    setMostrarFormulario(false)
  }

  const editarExtintor = (extintor) => {
    setEditando(extintor.id)
    setMostrarFormulario(true)
    setFormulario({
      code: extintor.code || '',
      extinguisher_type_id: extintor.extinguisher_type_id
        ? String(extintor.extinguisher_type_id)
        : '',
      capacity: extintor.capacity || '',
      location: extintor.location || '',
      last_recharge_date: extintor.last_recharge_date || '',
      next_recharge_date: extintor.next_recharge_date || '',
      last_hydrostatic_test_date:
        extintor.last_hydrostatic_test_date || '',
      next_hydrostatic_test_date:
        extintor.next_hydrostatic_test_date || '',
      status: extintor.status || 'ACTIVE',
      is_stock: Boolean(extintor.is_stock),
    })
    setMensaje(null)
  }

  const cambiarCampo = (event) => {
    const { name, value, type, checked } = event.target
    setFormulario((actual) => ({
      ...actual,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const guardar = async (event) => {
    event.preventDefault()

    try {
      setGuardando(true)
      const datos = {
        ...prepararDatos(formulario),
        extinguisher_type_id: Number(formulario.extinguisher_type_id),
      }

      const resultado = editando
        ? await actualizarExtintor(editando, datos, token)
        : await crearExtintor(datos, token)

      setExtintores((actuales) =>
        editando
          ? actuales.map((item) =>
              item.id === resultado.id ? resultado : item
            )
          : [...actuales, resultado]
      )

      setMensaje({
        tipo: 'success',
        texto: editando
          ? 'Extintor actualizado correctamente.'
          : 'Extintor creado correctamente.',
      })
      cancelar()
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({
        tipo: 'danger',
        texto: error.message || 'No fue posible guardar el extintor.',
      })
    } finally {
      setGuardando(false)
    }
  }

  const desactivar = async (extintor) => {
    if (!window.confirm(`¿Deseas desactivar el extintor ${extintor.code}?`)) {
      return
    }

    try {
      await eliminarExtintor(extintor.id, token)
      setExtintores((actuales) =>
        actuales.map((item) =>
          item.id === extintor.id
            ? { ...item, active: false, status: 'INACTIVE' }
            : item
        )
      )
      setMensaje({
        tipo: 'success',
        texto: 'Extintor desactivado correctamente.',
      })
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMensaje({
        tipo: 'danger',
        texto: error.message || 'No fue posible desactivar el extintor.',
      })
    }
  }

  const paginas = Array.from(
    { length: totalPaginas },
    (_, indice) => indice + 1
  )

  const activos = extintores.filter((item) => item.active).length
  const inactivos = extintores.filter((item) => !item.active).length

  const mostrandoDesde =
    extintoresFiltrados.length === 0 ? 0 : indiceInicial + 1

  const mostrandoHasta = Math.min(
    indiceInicial + extintoresPorPagina,
    extintoresFiltrados.length
  )

  const hayFiltros =
    busqueda ||
    tipoFiltro !== 'todos' ||
    estadoFiltro !== 'todos' ||
    stockFiltro !== 'todos'

  const campos = [
    ['code', 'Código', 'text'],
    ['capacity', 'Capacidad', 'text'],
    ['location', 'Ubicación', 'text'],
    ['last_recharge_date', 'Última recarga', 'date'],
    ['next_recharge_date', 'Próxima recarga', 'date'],
    ['last_hydrostatic_test_date', 'Última prueba hidrostática', 'date'],
    ['next_hydrostatic_test_date', 'Próxima prueba hidrostática', 'date'],
  ]

  return (
    <>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Gestión de Extintores</h2>
        <p className="text-muted mb-0">
          Inventario, ubicación, recargas y pruebas hidrostáticas.
        </p>
      </div>

      {mensaje && (
        <div className={`alert alert-${mensaje.tipo}`} role="alert">
          {mensaje.texto}
        </div>
      )}

      {cargando ? (
        <div className="card shadow-sm border-0 mb-3">
          <div className="card-body text-center py-4">
            <div className="spinner-border text-primary mb-2" role="status" />
            <div className="text-muted">Cargando extintores...</div>
          </div>
        </div>
      ) : (
        <div className="container-fluid px-0 pb-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-2">
            <div>
              <h4 className="mb-0 fw-bold">Extintores</h4>
              <small className="text-muted">
                Gestión del inventario de extintores
              </small>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={abrirNuevo}
            >
              + Nuevo extintor
            </button>
          </div>

          <div className="card shadow-sm border-0 mb-2">
            <div className="card-body py-2 px-3">
              <div className="row g-2 align-items-end">
                <div className="col-12 col-md-5">
                  <label className="form-label fw-semibold small mb-1">
                    Buscar extintor
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text">🔎</span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Código, tipo, capacidad o ubicación..."
                      value={busqueda}
                      onChange={(event) => cambiarBusqueda(event.target.value)}
                    />
                  </div>
                </div>

                <div className="col-6 col-md-2">
                  <label className="form-label fw-semibold small mb-1">
                    Tipo
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={tipoFiltro}
                    onChange={(event) => cambiarTipo(event.target.value)}
                  >
                    <option value="todos">Todos</option>
                    {tiposExtintor.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-6 col-md-2">
                  <label className="form-label fw-semibold small mb-1">
                    Estado
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={estadoFiltro}
                    onChange={(event) => cambiarEstado(event.target.value)}
                  >
                    <option value="todos">Todos</option>
                    <option value="activos">Activos</option>
                    <option value="inactivos">Inactivos</option>
                  </select>
                </div>

                <div className="col-6 col-md-1">
                  <label className="form-label fw-semibold small mb-1">
                    Stock
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={stockFiltro}
                    onChange={(event) => cambiarStock(event.target.value)}
                  >
                    <option value="todos">Todos</option>
                    <option value="stock">Stock</option>
                    <option value="ubicados">Ubicados</option>
                  </select>
                </div>

                <div className="col-6 col-md-2">
                  <label className="form-label fw-semibold small mb-1">
                    Mostrar
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={extintoresPorPagina}
                    onChange={(event) => cambiarCantidad(event.target.value)}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>

              {hayFiltros && (
                <div className="mt-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm py-0"
                    onClick={limpiarFiltros}
                  >
                    × Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="card shadow-sm border-0 d-none d-md-block">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 table-sm">
                <thead className="table-dark">
                  <tr>
                    <th>Código</th>
                    <th>Tipo</th>
                    <th>Capacidad</th>
                    <th>Ubicación</th>
                    <th>Próxima recarga</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {extintoresPagina.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">
                        No se encontraron extintores.
                      </td>
                    </tr>
                  ) : (
                    extintoresPagina.map((extintor) => (
                      <tr key={extintor.id}>
                        <td className="fw-semibold">{extintor.code}</td>
                        <td>{extintor.extinguisher_type?.name || '—'}</td>
                        <td>{extintor.capacity || '—'}</td>
                        <td>{extintor.location || '—'}</td>
                        <td>{extintor.next_recharge_date || '—'}</td>
                        <td>{extintor.is_stock ? 'Sí' : 'No'}</td>
                        <td>
                          {extintor.active ? (
                            <span className="badge bg-success">Activo</span>
                          ) : (
                            <span className="badge bg-secondary">Inactivo</span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex justify-content-center align-items-center gap-1 flex-nowrap">
                            <button
                              type="button"
                              className="btn btn-warning btn-sm py-0 px-2"
                              title="Editar extintor"
                              onClick={() => editarExtintor(extintor)}
                            >
                              ✏️
                            </button>
                            {extintor.active && (
                              <button
                                type="button"
                                className="btn btn-danger btn-sm py-0 px-2"
                                title="Desactivar extintor"
                                onClick={() => desactivar(extintor)}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-md-none">
            {extintoresPagina.length === 0 ? (
              <div className="card shadow-sm text-center py-4">
                <div className="text-muted">No se encontraron extintores.</div>
              </div>
            ) : (
              extintoresPagina.map((extintor) => (
                <div className="card shadow-sm mb-2" key={extintor.id}>
                  <div className="card-body py-3">
                    <div className="mb-2">
                      <div className="text-muted small">Código</div>
                      <div className="fw-bold">{extintor.code}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Tipo</div>
                      <div>{extintor.extinguisher_type?.name || '—'}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Capacidad</div>
                      <div>{extintor.capacity || '—'}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Ubicación</div>
                      <div>{extintor.location || '—'}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Próxima recarga</div>
                      <div>{extintor.next_recharge_date || '—'}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Estado</div>
                      {extintor.active ? (
                        <span className="badge bg-success">Activo</span>
                      ) : (
                        <span className="badge bg-secondary">Inactivo</span>
                      )}
                    </div>
                    <div className="d-grid gap-1">
                      <button
                        type="button"
                        className="btn btn-warning btn-sm"
                        onClick={() => editarExtintor(extintor)}
                      >
                        ✏️ Editar
                      </button>
                      {extintor.active && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => desactivar(extintor)}
                        >
                          🗑️ Desactivar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 mt-2">
            <small className="text-muted">
              Mostrando {mostrandoDesde} - {mostrandoHasta} de {extintoresFiltrados.length} extintores
            </small>

            {totalPaginas > 1 && (
              <nav aria-label="Paginación de extintores">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${paginaSegura === 1 ? 'disabled' : ''}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => cambiarPagina(paginaSegura - 1)}
                      disabled={paginaSegura === 1}
                    >
                      Anterior
                    </button>
                  </li>

                  {paginas.map((pagina) => (
                    <li
                      key={pagina}
                      className={`page-item ${pagina === paginaSegura ? 'active' : ''}`}
                    >
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => cambiarPagina(pagina)}
                      >
                        {pagina}
                      </button>
                    </li>
                  ))}

                  <li className={`page-item ${paginaSegura === totalPaginas ? 'disabled' : ''}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => cambiarPagina(paginaSegura + 1)}
                      disabled={paginaSegura === totalPaginas}
                    >
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>

          <div className="mt-2 text-muted small">
            Total: <strong>{extintores.length}</strong> | Activos: <strong>{activos}</strong> | Inactivos: <strong>{inactivos}</strong>
          </div>
        </div>
      )}

      {mostrarFormulario && (
        <div
          className="modal d-block"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            overflow: 'hidden',
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{
              maxWidth: '700px',
              width: 'calc(100% - 2rem)',
              margin: '1rem auto',
            }}
          >
            <div
              className="modal-content"
              style={{ maxHeight: 'calc(100vh - 2rem)' }}
            >
              <div className="modal-header py-2 px-3">
                <h5 className="modal-title mb-0">
                  {editando ? 'Editar extintor' : 'Nuevo extintor'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={cancelar}
                  disabled={guardando}
                />
              </div>

              <form onSubmit={guardar} autoComplete="off">
                <div
                  className="modal-body py-3 px-3"
                  style={{
                    overflowY: 'auto',
                    maxHeight: 'calc(100vh - 150px)',
                  }}
                >
                  <div className="row g-3">
                    {campos.map(([campo, etiqueta, tipo]) => (
                      <div className="col-md-6" key={campo}>
                        <label className="form-label mb-1">{etiqueta}</label>
                        <input
                          className="form-control"
                          name={campo}
                          type={tipo}
                          value={formulario[campo] || ''}
                          onChange={cambiarCampo}
                          required={campo === 'code'}
                          disabled={guardando}
                        />
                      </div>
                    ))}

                    <div className="col-md-6">
                      <label className="form-label mb-1">Tipo de extintor</label>
                      <select
                        className="form-select"
                        name="extinguisher_type_id"
                        value={formulario.extinguisher_type_id}
                        onChange={cambiarCampo}
                        required
                        disabled={guardando || cargandoTipos}
                      >
                        <option value="">
                          {cargandoTipos
                            ? 'Cargando tipos...'
                            : 'Seleccione un tipo de extintor...'}
                        </option>
                        {tiposExtintor.map((tipo) => (
                          <option key={tipo.id} value={tipo.id}>
                            {tipo.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label mb-1">Estado</label>
                      <select
                        className="form-select"
                        name="status"
                        value={formulario.status}
                        onChange={cambiarCampo}
                        disabled={guardando}
                      >
                        <option value="ACTIVE">ACTIVO</option>
                        <option value="INACTIVE">INACTIVO</option>
                      </select>
                    </div>

                    <div className="col-md-6 d-flex align-items-end">
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          id="is_stock"
                          name="is_stock"
                          type="checkbox"
                          checked={formulario.is_stock}
                          onChange={cambiarCampo}
                          disabled={guardando}
                        />
                        <label className="form-check-label" htmlFor="is_stock">
                          Es inventario en stock
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer py-2 px-3">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={cancelar}
                    disabled={guardando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={guardando || cargandoTipos}
                  >
                    {guardando ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Guardando...
                      </>
                    ) : (
                      editando ? 'Guardar cambios' : 'Crear extintor'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ExtinguishersPage
