import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  actualizarItemRevisionExtintor,
  crearItemRevisionExtintor,
  eliminarItemRevisionExtintor,
  obtenerItemsRevisionExtintorAdmin,
} from '../services/inspectionItemsApi'

const FORM_INICIAL = {
  code: '',
  name: '',
  display_order: 0,
  active: true,
}

const Modal = ({ title, children, onClose, footer }) => (
  <div
    className="modal d-block"
    role="dialog"
    aria-modal="true"
    style={{
      backgroundColor: 'rgba(0,0,0,.5)',
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
    }}
  >
    <div
      className="modal-dialog modal-dialog-centered"
      style={{
        width: 'calc(100% - 2rem)',
        margin: '1rem auto',
      }}
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

function ExtinguisherInspectionItemsPage() {
  const { token, manejarSesionExpirada } = useAuth()

  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [formulario, setFormulario] = useState(FORM_INICIAL)
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('todos')
  const [porPagina, setPorPagina] = useState(10)
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    let activo = true

    const cargar = async () => {
      if (!token) {
        if (activo) {
          setCargando(false)
        }
        return
      }

      try {
        const resultado =
          await obtenerItemsRevisionExtintorAdmin(token)

        if (activo) {
          setItems(
            Array.isArray(resultado)
              ? resultado
              : [],
          )
        }
      } catch (error) {
        if (error.status === 401) {
          manejarSesionExpirada()
          return
        }

        if (activo) {
          setMensaje({
            tipo: 'danger',
            texto:
              error.message ||
              'No fue posible cargar los ítems de revisión.',
          })
        }
      } finally {
        if (activo) {
          setCargando(false)
        }
      }
    }

    const ejecutarCarga = async () => {
      await cargar()
    }

    void ejecutarCarga()

    return () => {
      activo = false
    }
  }, [token, manejarSesionExpirada])

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    return items.filter((item) => {
      const textoOk =
        !texto ||
        [
          item.code,
          item.name,
          item.display_order,
        ].some((valor) =>
          String(valor ?? '')
            .toLowerCase()
            .includes(texto),
        )

      const estadoOk =
        estado === 'todos' ||
        (estado === 'activos'
          ? item.active
          : !item.active)

      return textoOk && estadoOk
    })
  }, [items, busqueda, estado])

  const totalPaginas = Math.ceil(
    filtrados.length / porPagina,
  )

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

  const activos = items.filter(
    (item) => item.active,
  ).length

  const inactivos = items.filter(
    (item) => !item.active,
  ).length

  const hayFiltros = Boolean(
    busqueda || estado !== 'todos',
  )

  const limpiarFiltros = () => {
    setBusqueda('')
    setEstado('todos')
    setPagina(1)
  }

  const abrirCrear = () => {
    setEditando(null)
    setFormulario(FORM_INICIAL)
    setMensaje(null)
    setMostrarModal(true)
  }

  const abrirEditar = (item) => {
    setEditando(item)

    setFormulario({
      code: item.code || '',
      name: item.name || '',
      display_order: item.display_order ?? 0,
      active: Boolean(item.active),
    })

    setMensaje(null)
    setMostrarModal(true)
  }

  const cambiar = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setFormulario((actual) => ({
      ...actual,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'display_order'
            ? Number(value)
            : value,
    }))
  }

  const guardar = async (event) => {
    event.preventDefault()

    try {
      setGuardando(true)

      const datos = {
        ...formulario,
        code: formulario.code.trim(),
        name: formulario.name.trim(),
      }

      const resultado = editando
        ? await actualizarItemRevisionExtintor(
            editando.id,
            datos,
            token,
          )
        : await crearItemRevisionExtintor(
            datos,
            token,
          )

      setItems((actuales) =>
        (
          editando
            ? actuales.map((item) =>
                item.id === resultado.id
                  ? resultado
                  : item,
              )
            : [...actuales, resultado]
        ).sort(
          (a, b) =>
            (a.display_order ?? 0) -
              (b.display_order ?? 0) ||
            a.id - b.id,
        ),
      )

      setMostrarModal(false)

      setMensaje({
        tipo: 'success',
        texto: editando
          ? 'Ítem actualizado correctamente.'
          : 'Ítem creado correctamente.',
      })
    } catch (error) {
      if (error.status === 401) {
        return manejarSesionExpirada()
      }

      setMensaje({
        tipo:
          error.status === 409
            ? 'warning'
            : 'danger',
        texto:
          error.message ||
          'No fue posible guardar el ítem.',
      })
    } finally {
      setGuardando(false)
    }
  }

  const desactivar = async (item) => {
    if (
      !window.confirm(
        `¿Deseas desactivar el ítem "${item.name}"?`,
      )
    ) {
      return
    }

    try {
      const resultado =
        await eliminarItemRevisionExtintor(
          item.id,
          token,
        )

      setItems((actuales) =>
        actuales.map((x) =>
          x.id === resultado.id
            ? resultado
            : x,
        ),
      )

      setMensaje({
        tipo: 'success',
        texto:
          'Ítem desactivado correctamente.',
      })
    } catch (error) {
      if (error.status === 401) {
        return manejarSesionExpirada()
      }

      setMensaje({
        tipo: 'danger',
        texto:
          error.message ||
          'No fue posible desactivar el ítem.',
      })
    }
  }

  if (cargando) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center py-5">
          <div
            className="spinner-border text-primary mb-2"
            role="status"
          />
          <div className="text-muted">
            Cargando ítems de revisión...
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
            Ítems de revisión
          </h2>
          <p className="text-muted mb-0">
            Catálogo de elementos que se verifican
            durante las revisiones de extintores.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={abrirCrear}
        >
          + Nuevo ítem
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

      <div className="card shadow-sm border-0 mb-2">
        <div className="card-body py-2 px-3">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small mb-1">
                🔎 Buscar ítem
              </label>

              <input
                className="form-control form-control-sm"
                placeholder="Código, nombre u orden..."
                value={busqueda}
                onChange={(event) => {
                  setBusqueda(event.target.value)
                  setPagina(1)
                }}
              />
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label fw-semibold small mb-1">
                Estado
              </label>

              <select
                className="form-select form-select-sm"
                value={estado}
                onChange={(event) => {
                  setEstado(event.target.value)
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

            <div className="col-6 col-md-2">
              <label className="form-label fw-semibold small mb-1">
                Mostrar
              </label>

              <select
                className="form-select form-select-sm"
                value={porPagina}
                onChange={(event) => {
                  setPorPagina(
                    Number(event.target.value),
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

            <div className="col-12 col-md-2 text-md-end">
              {hayFiltros && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={limpiarFiltros}
                >
                  × Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 d-none d-md-block">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Orden</th>
                <th>Código</th>
                <th>Nombre</th>
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
                    colSpan="5"
                    className="text-center py-4 text-muted"
                  >
                    No se encontraron ítems.
                  </td>
                </tr>
              ) : (
                visibles.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.display_order}
                    </td>

                    <td className="fw-semibold">
                      {item.code}
                    </td>

                    <td>{item.name}</td>

                    <td>
                      <span
                        className={`badge ${
                          item.active
                            ? 'text-bg-success'
                            : 'text-bg-secondary'
                        }`}
                      >
                        {item.active
                          ? 'Activo'
                          : 'Inactivo'}
                      </span>
                    </td>

                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-warning btn-sm me-1"
                        onClick={() =>
                          abrirEditar(item)
                        }
                      >
                        ✏️
                      </button>

                      {item.active && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            desactivar(item)
                          }
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-md-none">
        <div className="d-flex flex-column gap-3">
          {visibles.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-4 text-muted">
                No se encontraron ítems.
              </div>
            </div>
          ) : (
            visibles.map((item) => (
              <div
                key={item.id}
                className="card border-0 shadow-sm"
              >
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                    <div>
                      <div className="small text-muted">
                        Orden
                      </div>

                      <div className="fw-bold">
                        #{item.display_order}
                      </div>
                    </div>

                    <span
                      className={`badge ${
                        item.active
                          ? 'text-bg-success'
                          : 'text-bg-secondary'
                      }`}
                    >
                      {item.active
                        ? 'Activo'
                        : 'Inactivo'}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="small text-muted">
                      Código
                    </div>

                    <div className="fw-semibold text-break">
                      {item.code}
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="small text-muted">
                      Elemento
                    </div>

                    <div className="fw-semibold text-break">
                      {item.name}
                    </div>
                  </div>

                  <div className="d-grid gap-1">
                    <button
                      type="button"
                      className="btn btn-warning btn-sm"
                      onClick={() =>
                        abrirEditar(item)
                      }
                    >
                      ✏️ Editar
                    </button>

                    {item.active && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          desactivar(item)
                        }
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
      </div>

      <div className="d-flex flex-column flex-md-row justify-content-between gap-1 small text-muted mt-3">
        <span>
          Mostrando{' '}
          <strong>
            {desde} - {hasta}
          </strong>{' '}
          de{' '}
          <strong>
            {filtrados.length}
          </strong>{' '}
          ítems
        </span>

        <span>
          Total: <strong>{items.length}</strong>{' '}
          | Activos:{' '}
          <strong>{activos}</strong>{' '}
          | Inactivos:{' '}
          <strong>{inactivos}</strong>
        </span>
      </div>

      {totalPaginas > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() =>
              setPagina((p) =>
                Math.max(1, p - 1),
              )
            }
            disabled={paginaSegura === 1}
          >
            ‹ Anterior
          </button>

          <span className="small text-muted">
            Página {paginaSegura} de{' '}
            {totalPaginas}
          </span>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() =>
              setPagina((p) =>
                Math.min(
                  totalPaginas,
                  p + 1,
                ),
              )
            }
            disabled={
              paginaSegura === totalPaginas
            }
          >
            Siguiente ›
          </button>
        </div>
      )}

      {mostrarModal && (
        <Modal
          title={
            editando
              ? 'Editar ítem de revisión'
              : 'Nuevo ítem de revisión'
          }
          onClose={() =>
            !guardando &&
            setMostrarModal(false)
          }
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  setMostrarModal(false)
                }
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                form="formItemRevision"
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
            id="formItemRevision"
            onSubmit={guardar}
          >
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Código
                </label>

                <input
                  className="form-control"
                  name="code"
                  value={formulario.code}
                  onChange={cambiar}
                  maxLength="50"
                  required
                  disabled={guardando}
                  placeholder="Ej. MANOMETER"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Orden de visualización
                </label>

                <input
                  type="number"
                  min="0"
                  className="form-control"
                  name="display_order"
                  value={
                    formulario.display_order
                  }
                  onChange={cambiar}
                  required
                  disabled={guardando}
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">
                  Nombre
                </label>

                <input
                  className="form-control"
                  name="name"
                  value={formulario.name}
                  onChange={cambiar}
                  maxLength="100"
                  required
                  disabled={guardando}
                  placeholder="Ej. Manómetro"
                />
              </div>

              {editando && (
                <div className="col-12">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="itemActive"
                      name="active"
                      checked={
                        formulario.active
                      }
                      onChange={cambiar}
                      disabled={guardando}
                    />

                    <label
                      className="form-check-label fw-semibold"
                      htmlFor="itemActive"
                    >
                      Ítem activo
                    </label>
                  </div>

                  <div className="form-text">
                    Si está inactivo, no aparecerá
                    como opción en las nuevas
                    revisiones.
                  </div>
                </div>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default ExtinguisherInspectionItemsPage