import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  actualizarExtintor,
  crearExtintor,
  eliminarExtintor,
  obtenerExtintores,
  obtenerRevisiones,
  obtenerTiposExtintor,
} from '../services/api'

const FORM_INICIAL = {
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

const hoy = () => new Date()

const Modal = ({ title, children, footer, onClose, large = false }) => (
  <div
    className="modal d-block"
    role="dialog"
    aria-modal="true"
    style={{
      backgroundColor: 'rgba(0,0,0,.5)',
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      overflowY: 'auto',
    }}
  >
    <div
      className={`modal-dialog modal-dialog-centered ${large ? 'modal-lg' : ''}`}
      style={{ width: 'calc(100% - 2rem)', margin: '1rem auto' }}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">{title}</h5>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Cerrar"
          />
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  </div>
)

const alertaRecarga = (fecha) => {
  if (!fecha) return null

  const fechaRecarga = new Date(`${fecha}T00:00:00`)
  const actual = hoy()
  actual.setHours(0, 0, 0, 0)

  const dias = Math.ceil((fechaRecarga - actual) / 86400000)

  if (dias < 0) return { clase: 'text-bg-danger', texto: 'Vencida', dias }
  if (dias === 0) return { clase: 'text-bg-danger', texto: 'Hoy', dias }
  if (dias <= 7) {
    return {
      clase: 'text-bg-warning',
      texto: `En ${dias} día${dias === 1 ? '' : 's'}`,
      dias,
    }
  }

  return { clase: 'text-bg-success', texto: 'Normal', dias }
}

function ExtinguishersPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const navigate = useNavigate()

  const [extintores, setExtintores] = useState([])
  const [tipos, setTipos] = useState([])
  const [revisiones, setRevisiones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [formulario, setFormulario] = useState(FORM_INICIAL)
  const [editando, setEditando] = useState(null)
  const [eliminandoItem, setEliminandoItem] = useState(null)
  const [verItem, setVerItem] = useState(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [stockFiltro, setStockFiltro] = useState('todos')
  const [porPagina, setPorPagina] = useState(10)
  const [pagina, setPagina] = useState(1)

  const cargar = useCallback(async () => {
    if (!token) return

    try {
      setCargando(true)

      const [ext, cat, rev] = await Promise.all([
        obtenerExtintores(token),
        obtenerTiposExtintor(token),
        obtenerRevisiones(token),
      ])

      setExtintores(Array.isArray(ext) ? ext : [])
      setTipos(Array.isArray(cat) ? cat.filter((x) => x.active) : [])
      setRevisiones(Array.isArray(rev) ? rev : [])
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

  useEffect(() => {
    cargar()
  }, [cargar])

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    return extintores.filter((e) => {
      const textoOk =
        !texto ||
        [
          e.code,
          e.capacity,
          e.location,
          e.extinguisher_type?.name,
        ].some((v) =>
          String(v ?? '').toLowerCase().includes(texto),
        )

      const tipoOk =
        tipoFiltro === 'todos' ||
        String(e.extinguisher_type_id) === String(tipoFiltro)

      const estadoOk =
        estadoFiltro === 'todos' ||
        (estadoFiltro === 'activos' && e.active) ||
        (estadoFiltro === 'inactivos' && !e.active)

      const stockOk =
        stockFiltro === 'todos' ||
        (stockFiltro === 'stock' && e.is_stock) ||
        (stockFiltro === 'ubicados' && !e.is_stock)

      return textoOk && tipoOk && estadoOk && stockOk
    })
  }, [
    extintores,
    busqueda,
    tipoFiltro,
    estadoFiltro,
    stockFiltro,
  ])

  const totalPaginas = Math.ceil(filtrados.length / porPagina)

  const paginaSegura = Math.min(
    pagina,
    Math.max(totalPaginas, 1),
  )

  const visibles = filtrados.slice(
    (paginaSegura - 1) * porPagina,
    paginaSegura * porPagina,
  )

  const desde = filtrados.length
    ? (paginaSegura - 1) * porPagina + 1
    : 0

  const hasta = Math.min(
    paginaSegura * porPagina,
    filtrados.length,
  )

  const activos = extintores.filter((x) => x.active).length
  const inactivos = extintores.filter((x) => !x.active).length

  const abrirNuevo = () => {
    setEditando(null)
    setFormulario({ ...FORM_INICIAL })
    setMensaje(null)
    setMostrarModal(true)
  }

  const abrirEditar = (e) => {
    setEditando(e.id)

    setFormulario({
      ...FORM_INICIAL,
      code: e.code || '',
      extinguisher_type_id: e.extinguisher_type_id
        ? String(e.extinguisher_type_id)
        : '',
      capacity: e.capacity || '',
      location: e.location || '',
      last_recharge_date: e.last_recharge_date || '',
      next_recharge_date: e.next_recharge_date || '',
      last_hydrostatic_test_date:
        e.last_hydrostatic_test_date || '',
      next_hydrostatic_test_date:
        e.next_hydrostatic_test_date || '',
      status: e.status || 'ACTIVE',
      is_stock: Boolean(e.is_stock),
    })

    setMensaje(null)
    setMostrarModal(true)
  }

  const cerrarModal = () => {
    if (guardando) return

    setMostrarModal(false)
    setEditando(null)
    setFormulario({ ...FORM_INICIAL })
  }

  const cambiarCampo = (event) => {
    const { name, value, type, checked } = event.target

    setFormulario((f) => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const guardar = async (event) => {
    event.preventDefault()

    try {
      setGuardando(true)

      const datos = {
        ...formulario,
        extinguisher_type_id: Number(
          formulario.extinguisher_type_id,
        ),
        last_recharge_date:
          formulario.last_recharge_date || null,
        next_recharge_date:
          formulario.next_recharge_date || null,
        last_hydrostatic_test_date:
          formulario.last_hydrostatic_test_date || null,
        next_hydrostatic_test_date:
          formulario.next_hydrostatic_test_date || null,
      }

      const resultado = editando
        ? await actualizarExtintor(editando, datos, token)
        : await crearExtintor(datos, token)

      setExtintores((actuales) =>
        editando
          ? actuales.map((x) =>
              x.id === resultado.id ? resultado : x,
            )
          : [...actuales, resultado],
      )

      setMostrarModal(false)
      setEditando(null)
      setFormulario({ ...FORM_INICIAL })

      setMensaje({
        tipo: 'success',
        texto: editando
          ? 'Extintor actualizado correctamente.'
          : 'Extintor creado correctamente.',
      })
    } catch (error) {
      if (error.status === 401) {
        return manejarSesionExpirada()
      }

      setMensaje({
        tipo: 'danger',
        texto:
          error.message ||
          'No fue posible guardar el extintor.',
      })
    } finally {
      setGuardando(false)
    }
  }

  const confirmarEliminacion = async () => {
    if (!eliminandoItem) return

    try {
      setEliminando(true)

      await eliminarExtintor(eliminandoItem.id, token)

      setExtintores((actuales) =>
        actuales.map((x) =>
          x.id === eliminandoItem.id
            ? {
                ...x,
                active: false,
                status: 'INACTIVE',
              }
            : x,
        ),
      )

      setEliminandoItem(null)

      setMensaje({
        tipo: 'success',
        texto: 'Extintor desactivado correctamente.',
      })
    } catch (error) {
      if (error.status === 401) {
        return manejarSesionExpirada()
      }

      setMensaje({
        tipo: 'danger',
        texto:
          error.message ||
          'No fue posible desactivar el extintor.',
      })
    } finally {
      setEliminando(false)
    }
  }

  const abrirRevisiones = (e) =>
    navigate(
      `../extintores/revisiones?extinguisher_id=${e.id}`,
    )

  const ultimaRevision = (id) =>
    revisiones
      .filter(
        (r) =>
          Number(r.extinguisher_id) === Number(id),
      )
      .sort((a, b) =>
        String(b.inspection_date).localeCompare(
          String(a.inspection_date),
        ),
      )[0]

  const abrirDetalle = (e) => setVerItem(e)

  const hayFiltros = Boolean(
    busqueda ||
      tipoFiltro !== 'todos' ||
      estadoFiltro !== 'todos' ||
      stockFiltro !== 'todos',
  )

  const limpiarFiltros = () => {
    setBusqueda('')
    setTipoFiltro('todos')
    setEstadoFiltro('todos')
    setStockFiltro('todos')
    setPagina(1)
  }

  const renderAcciones = (e, mobile = false) => (
    <div
      className={
        mobile
          ? 'd-grid gap-1'
          : 'd-flex justify-content-center gap-1'
      }
    >
      <button
        type="button"
        className="btn btn-primary btn-sm"
        title="Ver"
        onClick={() => abrirDetalle(e)}
      >
        {mobile ? '👁 Ver' : '👁'}
      </button>

      <button
        type="button"
        className={`btn ${
          mobile ? 'btn-primary' : 'btn-info'
        } btn-sm`}
        title="Revisiones"
        onClick={() => abrirRevisiones(e)}
      >
        {mobile ? '📋 Revisiones' : '📋'}
      </button>

      <button
        type="button"
        className="btn btn-warning btn-sm"
        title="Editar"
        onClick={() => abrirEditar(e)}
      >
        {mobile ? '✏️ Editar' : '✏️'}
      </button>

      {e.active && (
        <button
          type="button"
          className="btn btn-danger btn-sm"
          title="Desactivar"
          onClick={() => setEliminandoItem(e)}
          disabled={eliminando}
        >
          {mobile ? '🗑️ Desactivar' : '🗑️'}
        </button>
      )}
    </div>
  )

  const renderDesktopRow = (e) => {
    const contador = Number(
      e.inspections_since_hydrostatic_test ?? 0,
    )

    const requiere =
      Boolean(e.hydrostatic_test_required) ||
      contador >= 4

    const alerta = alertaRecarga(
      e.next_recharge_date,
    )

    return (
      <tr key={e.id}>
        <td className="fw-semibold">{e.code}</td>

        <td>
          {e.extinguisher_type?.name || '—'}
        </td>

        <td>{e.capacity || '—'}</td>

        <td>{e.location || '—'}</td>

        <td>
          <span
            className={`badge ${
              requiere
                ? 'text-bg-warning'
                : 'text-bg-primary'
            }`}
          >
            {contador} / 4
          </span>

          {requiere && (
            <div className="small text-warning-emphasis fw-semibold">
              ⚠️ Hidrostática requerida
            </div>
          )}
        </td>

        <td>
          {e.next_recharge_date ? (
            <>
              <span
                className={`badge ${
                  alerta?.clase ||
                  'text-bg-secondary'
                }`}
              >
                {e.next_recharge_date}
              </span>

              {alerta &&
                alerta.texto !== 'Normal' && (
                  <div className="small fw-semibold">
                    {alerta.texto === 'Hoy'
                      ? '🚨'
                      : '⚠️'}{' '}
                    {alerta.texto}
                  </div>
                )}
            </>
          ) : (
            '—'
          )}
        </td>

        <td>
          {e.active ? (
            <span className="badge text-bg-success">
              Activo
            </span>
          ) : (
            <span className="badge text-bg-secondary">
              Inactivo
            </span>
          )}
        </td>

        <td>{renderAcciones(e)}</td>
      </tr>
    )
  }

  const renderMobileCard = (e) => {
    const contador = Number(
      e.inspections_since_hydrostatic_test ?? 0,
    )

    const requiere =
      Boolean(e.hydrostatic_test_required) ||
      contador >= 4

    const alerta = alertaRecarga(
      e.next_recharge_date,
    )

    const ultima = ultimaRevision(e.id)

    return (
      <div
        className="card shadow-sm border-0 mb-3 extinguisher-mobile-card"
        key={e.id}
      >
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
            <div>
              <div className="text-muted small">
                Código
              </div>

              <div className="fw-bold fs-5">
                {e.code}
              </div>
            </div>

            {e.active ? (
              <span className="badge text-bg-success">
                Activo
              </span>
            ) : (
              <span className="badge text-bg-secondary">
                Inactivo
              </span>
            )}
          </div>

          <div className="row g-2 mb-2">
            <div className="col-6">
              <div className="text-muted small">
                Tipo
              </div>

              <div className="fw-semibold text-break">
                {e.extinguisher_type?.name || '—'}
              </div>
            </div>

            <div className="col-6">
              <div className="text-muted small">
                Capacidad
              </div>

              <div className="fw-semibold">
                {e.capacity || '—'}
              </div>
            </div>

            <div className="col-12">
              <div className="text-muted small">
                Ubicación
              </div>

              <div className="text-break">
                {e.location || '—'}
              </div>
            </div>

            <div className="col-6">
              <div className="text-muted small">
                Revisiones
              </div>

              <span
                className={`badge ${
                  requiere
                    ? 'text-bg-warning'
                    : 'text-bg-primary'
                }`}
              >
                {contador} / 4
              </span>
            </div>

            <div className="col-6">
              <div className="text-muted small">
                Próxima recarga
              </div>

              {e.next_recharge_date ? (
                <span
                  className={`badge ${
                    alerta?.clase ||
                    'text-bg-secondary'
                  }`}
                >
                  {e.next_recharge_date}
                </span>
              ) : (
                <span className="text-muted">
                  —
                </span>
              )}
            </div>
          </div>

          {requiere && (
            <div className="alert alert-warning py-2 px-3 mb-2 small">
              ⚠️ Hidrostática requerida
            </div>
          )}

          {ultima && (
            <div className="small text-muted border-top pt-2 mb-2">
              Última revisión:{' '}
              <strong>{ultima.inspection_date}</strong>{' '}
              · {ultima.result}
            </div>
          )}

          <div className="border-top pt-3 mt-2">
            {renderAcciones(e, true)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            Gestión de Extintores
          </h2>

          <p className="text-muted mb-0">
            Inventario, ubicación, recargas,
            revisiones y pruebas hidrostáticas.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={abrirNuevo}
        >
          ＋ Nuevo extintor
        </button>
      </div>

      {mensaje && (
        <div
          className={`alert alert-${mensaje.tipo}`}
          role="alert"
        >
          {mensaje.texto}
        </div>
      )}

      {cargando ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <div
              className="spinner-border text-primary mb-2"
              role="status"
            />

            <div className="text-muted">
              Cargando extintores...
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="card shadow-sm border-0 mb-2">
            <div className="card-body py-2 px-3">
              <div className="row g-2 align-items-end">
                <div className="col-12 col-md-5">
                  <label className="form-label fw-semibold small mb-1">
                    Buscar extintor
                  </label>

                  <input
                    className="form-control form-control-sm"
                    placeholder="Código, tipo, capacidad o ubicación..."
                    value={busqueda}
                    onChange={(e) => {
                      setBusqueda(e.target.value)
                      setPagina(1)
                    }}
                  />
                </div>

                <div className="col-6 col-md-2">
                  <label className="form-label fw-semibold small mb-1">
                    Tipo
                  </label>

                  <select
                    className="form-select form-select-sm"
                    value={tipoFiltro}
                    onChange={(e) => {
                      setTipoFiltro(e.target.value)
                      setPagina(1)
                    }}
                  >
                    <option value="todos">
                      Todos
                    </option>

                    {tipos.map((t) => (
                      <option
                        key={t.id}
                        value={t.id}
                      >
                        {t.name}
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
                    onChange={(e) => {
                      setEstadoFiltro(e.target.value)
                      setPagina(1)
                    }}
                  >
                    <option value="todos">
                      Todos
                    </option>

                    <option value="activos">
                      Activos
                    </option>

                    <option value="inactivos">
                      Inactivos
                    </option>
                  </select>
                </div>

                <div className="col-6 col-md-1">
                  <label className="form-label fw-semibold small mb-1">
                    Stock
                  </label>

                  <select
                    className="form-select form-select-sm"
                    value={stockFiltro}
                    onChange={(e) => {
                      setStockFiltro(e.target.value)
                      setPagina(1)
                    }}
                  >
                    <option value="todos">
                      Todos
                    </option>

                    <option value="stock">
                      Stock
                    </option>

                    <option value="ubicados">
                      Ubicados
                    </option>
                  </select>
                </div>

                <div className="col-6 col-md-2">
                  <label className="form-label fw-semibold small mb-1">
                    Mostrar
                  </label>

                  <select
                    className="form-select form-select-sm"
                    value={porPagina}
                    onChange={(e) => {
                      setPorPagina(
                        Number(e.target.value),
                      )
                      setPagina(1)
                    }}
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
                    className="btn btn-outline-secondary btn-sm"
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
              <table className="table table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Código</th>
                    <th>Tipo</th>
                    <th>Capacidad</th>
                    <th>Ubicación</th>
                    <th>Revisiones</th>
                    <th>Próxima recarga</th>
                    <th>Estado</th>
                    <th className="text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibles.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="text-center py-4 text-muted"
                      >
                        No se encontraron extintores.
                      </td>
                    </tr>
                  ) : (
                    visibles.map(renderDesktopRow)
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-md-none">
            {visibles.length === 0 ? (
              <div className="card shadow-sm text-center py-4">
                <div className="text-muted">
                  No se encontraron extintores.
                </div>
              </div>
            ) : (
              visibles.map(renderMobileCard)
            )}
          </div>

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mt-3">
            <div>
              <small className="text-muted">
                Mostrando {desde} - {hasta} de{' '}
                {filtrados.length} extintores
              </small>

              <div className="small text-muted">
                Total:{' '}
                <strong>{extintores.length}</strong> |
                Activos: <strong>{activos}</strong> |
                Inactivos:{' '}
                <strong>{inactivos}</strong>
              </div>
            </div>

            <div className="d-flex gap-1 flex-wrap">
              {Array.from(
                { length: totalPaginas },
                (_, i) => i + 1,
              ).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`btn btn-sm ${
                    p === paginaSegura
                      ? 'btn-primary'
                      : 'btn-outline-secondary'
                  }`}
                  onClick={() => setPagina(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {mostrarModal && (
        <Modal
          title={
            editando
              ? 'Editar extintor'
              : 'Nuevo extintor'
          }
          onClose={cerrarModal}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cerrarModal}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                form="extinguisher-form"
                className="btn btn-primary"
                disabled={guardando}
              >
                {guardando
                  ? 'Guardando...'
                  : 'Guardar'}
              </button>
            </>
          }
        >
          <form
            id="extinguisher-form"
            onSubmit={guardar}
          >
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">
                  Código
                </label>

                <input
                  className="form-control"
                  name="code"
                  value={formulario.code}
                  onChange={cambiarCampo}
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">
                  Tipo
                </label>

                <select
                  className="form-select"
                  name="extinguisher_type_id"
                  value={
                    formulario.extinguisher_type_id
                  }
                  onChange={cambiarCampo}
                  required
                >
                  <option value="">
                    Selecciona un tipo...
                  </option>

                  {tipos.map((t) => (
                    <option
                      key={t.id}
                      value={t.id}
                    >
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">
                  Capacidad
                </label>

                <input
                  className="form-control"
                  name="capacity"
                  value={formulario.capacity}
                  onChange={cambiarCampo}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">
                  Ubicación
                </label>

                <input
                  className="form-control"
                  name="location"
                  value={formulario.location}
                  onChange={cambiarCampo}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">
                  Última recarga
                </label>

                <input
                  type="date"
                  className="form-control"
                  name="last_recharge_date"
                  value={
                    formulario.last_recharge_date
                  }
                  onChange={cambiarCampo}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">
                  Próxima recarga
                </label>

                <input
                  type="date"
                  className="form-control"
                  name="next_recharge_date"
                  value={
                    formulario.next_recharge_date
                  }
                  onChange={cambiarCampo}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">
                  Última prueba hidrostática
                </label>

                <input
                  type="date"
                  className="form-control"
                  name="last_hydrostatic_test_date"
                  value={
                    formulario.last_hydrostatic_test_date
                  }
                  onChange={cambiarCampo}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">
                  Próxima prueba hidrostática
                </label>

                <input
                  type="date"
                  className="form-control"
                  name="next_hydrostatic_test_date"
                  value={
                    formulario.next_hydrostatic_test_date
                  }
                  onChange={cambiarCampo}
                />
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="is_stock"
                    id="is_stock"
                    checked={formulario.is_stock}
                    onChange={cambiarCampo}
                  />

                  <label
                    className="form-check-label"
                    htmlFor="is_stock"
                  >
                    Este extintor está en stock
                  </label>
                </div>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {eliminandoItem && (
        <Modal
          title="Desactivar extintor"
          onClose={() =>
            !eliminando &&
            setEliminandoItem(null)
          }
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  setEliminandoItem(null)
                }
                disabled={eliminando}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmarEliminacion}
                disabled={eliminando}
              >
                {eliminando
                  ? 'Desactivando...'
                  : 'Sí, desactivar'}
              </button>
            </>
          }
        >
          <p className="mb-0">
            ¿Deseas desactivar el extintor{' '}
            <strong>
              {eliminandoItem.code}
            </strong>
            ?
          </p>
        </Modal>
      )}

      {verItem && (
        <Modal
          title={`Extintor ${verItem.code}`}
          onClose={() => setVerItem(null)}
        >
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="text-muted small">
                Tipo
              </div>

              <div className="fw-semibold">
                {verItem.extinguisher_type?.name ||
                  '—'}
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="text-muted small">
                Capacidad
              </div>

              <div>
                {verItem.capacity || '—'}
              </div>
            </div>

            <div className="col-12">
              <div className="text-muted small">
                Ubicación
              </div>

              <div>
                {verItem.location || '—'}
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="text-muted small">
                Última recarga
              </div>

              <div>
                {verItem.last_recharge_date ||
                  '—'}
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="text-muted small">
                Próxima recarga
              </div>

              <div>
                {verItem.next_recharge_date ||
                  '—'}
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="text-muted small">
                Última prueba hidrostática
              </div>

              <div>
                {verItem.last_hydrostatic_test_date ||
                  '—'}
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="text-muted small">
                Próxima prueba hidrostática
              </div>

              <div>
                {verItem.next_hydrostatic_test_date ||
                  '—'}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default ExtinguishersPage