import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  crearRevisionExtintor,
  obtenerExtintores,
  obtenerItemsRevisionExtintor,
  obtenerRevisionExtintor,
  obtenerRevisiones,
  obtenerTiposExtintor,
} from '../services/api'

const hoy = () => {
  const fecha = new Date()
  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, '0')
  const day = String(fecha.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const FORM_INICIAL = {
  extinguisherId: '',
  inspectionDate: hoy(),
  result: 'APTO',
  observations: '',
  hydrostaticTestPerformed: false,
  hydrostaticTestDate: '',
  nextHydrostaticTestDate: '',
  items: {},
}

const Modal = ({
  title,
  children,
  onClose,
  footer,
  large = false,
}) => (
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
      className={`modal-dialog modal-dialog-centered ${
        large ? 'modal-xl' : 'modal-lg'
      }`}
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

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  </div>
)

const resultadoClase = (resultado) => {
  const valor = String(resultado || '').toUpperCase()

  if (valor === 'GOOD') {
    return 'text-bg-success'
  }

  if (valor === 'BAD') {
    return 'text-bg-danger'
  }

  return 'text-bg-secondary'
}

function ExtinguisherInspectionsPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const location = useLocation()

  const [extintores, setExtintores] = useState([])
  const [tipos, setTipos] = useState([])
  const [items, setItems] = useState([])
  const [revisiones, setRevisiones] = useState([])

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [mensaje, setMensaje] = useState(null)
  const [mostrarModal, setMostrarModal] = useState(false)

  const [detalle, setDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  const [formulario, setFormulario] = useState(FORM_INICIAL)

  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [estadoFiltro, setEstadoFiltro] = useState('todos')

  const [porPagina, setPorPagina] = useState(10)
  const [pagina, setPagina] = useState(1)

  /*
   * Si llegamos desde la pantalla de extintores mediante:
   *
   * /revisiones?extinguisher_id=2
   *
   * usamos el parámetro únicamente para filtrar las revisiones.
   *
   * IMPORTANTE:
   * No abrimos el modal de nueva revisión.
   */
  const extinguisherIdFiltro = useMemo(() => {
    const id = new URLSearchParams(
      location.search,
    ).get('extinguisher_id')

    return id ? String(id) : ''
  }, [location.search])

  const cargar = useCallback(async () => {
    if (!token) {
      return
    }

    try {
      setCargando(true)

      const [
        ext,
        cat,
        its,
        rev,
      ] = await Promise.all([
        obtenerExtintores(token),
        obtenerTiposExtintor(token),
        obtenerItemsRevisionExtintor(token),
        obtenerRevisiones(token),
      ])

      setExtintores(
        Array.isArray(ext) ? ext : [],
      )

      setTipos(
        Array.isArray(cat)
          ? cat.filter((x) => x.active)
          : [],
      )

      setItems(
        Array.isArray(its)
          ? its
              .filter((x) => x.active)
              .sort(
                (a, b) =>
                  (a.display_order ?? 0) -
                  (b.display_order ?? 0),
              )
          : [],
      )

      setRevisiones(
        Array.isArray(rev) ? rev : [],
      )
    } catch (error) {
      if (error.status === 401) {
        return manejarSesionExpirada()
      }

      setMensaje({
        tipo: 'danger',
        texto:
          error.message ||
          'No fue posible cargar las revisiones.',
      })
    } finally {
      setCargando(false)
    }
  }, [token, manejarSesionExpirada])

  useEffect(() => {
    const cargarDatos = async () => {
      await cargar()
    }

    void cargarDatos()
  }, [cargar])

  /*
   * Ya NO hacemos:
   *
   * abrirNueva(id)
   *
   * cuando existe extinguisher_id.
   *
   * El parámetro solo sirve para filtrar.
   */

  const extintoresMap = useMemo(
    () =>
      Object.fromEntries(
        extintores.map((e) => [e.id, e]),
      ),
    [extintores],
  )

  /*
   * Filtrado de revisiones.
   *
   * Si venimos desde un extintor específico,
   * solo mostramos sus revisiones.
   */
  const filtradas = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLowerCase()

    return revisiones.filter((r) => {
      const e =
        extintoresMap[r.extinguisher_id]

      const extintorOk =
        !extinguisherIdFiltro ||
        String(r.extinguisher_id) ===
          String(extinguisherIdFiltro)

      const textoOk =
        !texto ||
        [
          e?.code,
          e?.location,
          e?.capacity,
          e?.extinguisher_type?.name,
          r.result,
          r.observations,
        ].some((v) =>
          String(v ?? '')
            .toLowerCase()
            .includes(texto),
        )

      const tipoOk =
        tipoFiltro === 'todos' ||
        String(e?.extinguisher_type_id) ===
          String(tipoFiltro)

      const estadoOk =
        estadoFiltro === 'todos' ||
        String(r.result).toLowerCase() ===
          estadoFiltro

      return (
        extintorOk &&
        textoOk &&
        tipoOk &&
        estadoOk
      )
    })
  }, [
    revisiones,
    extintoresMap,
    busqueda,
    tipoFiltro,
    estadoFiltro,
    extinguisherIdFiltro,
  ])

  const totalPaginas = Math.ceil(
    filtradas.length / porPagina,
  )

  const paginaSegura = Math.min(
    pagina,
    Math.max(totalPaginas, 1),
  )

  const visibles = filtradas.slice(
    (paginaSegura - 1) * porPagina,
    paginaSegura * porPagina,
  )

  const desde = filtradas.length
    ? (paginaSegura - 1) * porPagina + 1
    : 0

  const hasta = Math.min(
    paginaSegura * porPagina,
    filtradas.length,
  )

  function abrirNueva(extintorId = '') {
    const e = extintorId
      ? extintoresMap[extintorId]
      : null

    const contador = Number(
      e?.inspections_since_hydrostatic_test ?? 0,
    )

    setFormulario({
      ...FORM_INICIAL,
      inspectionDate: hoy(),
      extinguisherId: extintorId
        ? String(extintorId)
        : '',
      items: Object.fromEntries(
        items.map((item) => [
          item.id,
          'GOOD',
        ]),
      ),
    })

    setMensaje(
      e && contador >= 4
        ? {
            tipo: 'warning',
            texto:
              'La próxima revisión requiere obligatoriamente una prueba hidrostática.',
          }
        : null,
    )

    setMostrarModal(true)
  }

  const cambiar = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setFormulario((f) => ({
      ...f,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }))
  }

  const verDetalle = async (revision) => {
    try {
      setCargandoDetalle(true)
      setDetalle(null)

      const completo =
        await obtenerRevisionExtintor(
          revision.id,
          token,
        )

      setDetalle(completo)
    } catch (error) {
      if (error.status === 401) {
        return manejarSesionExpirada()
      }

      setMensaje({
        tipo: 'danger',
        texto:
          error.message ||
          'No fue posible cargar el detalle de la revisión.',
      })
    } finally {
      setCargandoDetalle(false)
    }
  }

  const guardar = async (event) => {
    event.preventDefault()

    const e =
      extintoresMap[
        formulario.extinguisherId
      ]

    const contador = Number(
      e?.inspections_since_hydrostatic_test ?? 0,
    )

    if (!formulario.extinguisherId) {
      return setMensaje({
        tipo: 'danger',
        texto: 'Selecciona un extintor.',
      })
    }

    if (
      contador >= 4 &&
      !formulario.hydrostaticTestPerformed
    ) {
      return setMensaje({
        tipo: 'warning',
        texto:
          'La quinta revisión requiere obligatoriamente una prueba hidrostática.',
      })
    }

    if (
      formulario.hydrostaticTestPerformed &&
      !formulario.hydrostaticTestDate
    ) {
      return setMensaje({
        tipo: 'danger',
        texto:
          'Indica la fecha de la prueba hidrostática.',
      })
    }

    if (
      formulario.hydrostaticTestPerformed &&
      !formulario.nextHydrostaticTestDate
    ) {
      return setMensaje({
        tipo: 'danger',
        texto:
          'Indica la próxima fecha de prueba hidrostática.',
      })
    }

    try {
      setGuardando(true)

      const datos = {
        inspection_date:
          formulario.inspectionDate,

        result: formulario.result,

        observations:
          formulario.observations || null,

        hydrostatic_test_performed:
          formulario.hydrostaticTestPerformed,

        hydrostatic_test_date:
          formulario.hydrostaticTestPerformed
            ? formulario.hydrostaticTestDate
            : null,

        next_hydrostatic_test_date:
          formulario.hydrostaticTestPerformed
            ? formulario.nextHydrostaticTestDate
            : null,

        items: items.map((item) => ({
          inspection_item_id: item.id,
          result:
            formulario.items[item.id] ||
            'NA',
          observation: null,
        })),
      }

      const resultado =
        await crearRevisionExtintor(
          formulario.extinguisherId,
          datos,
          token,
        )

      setRevisiones((actuales) => [
        resultado,
        ...actuales,
      ])

      setExtintores((actuales) =>
        actuales.map((x) =>
          x.id ===
          Number(formulario.extinguisherId)
            ? {
                ...x,

                inspections_since_hydrostatic_test:
                  resultado.hydrostatic_test_performed
                    ? 0
                    : Number(
                        x.inspections_since_hydrostatic_test ??
                          0,
                      ) + 1,

                last_hydrostatic_test_date:
                  resultado.hydrostatic_test_performed
                    ? resultado.hydrostatic_test_date
                    : x.last_hydrostatic_test_date,

                next_hydrostatic_test_date:
                  resultado.hydrostatic_test_performed
                    ? resultado.next_hydrostatic_test_date
                    : x.next_hydrostatic_test_date,
              }
            : x,
        ),
      )

      setMostrarModal(false)

      setMensaje({
        tipo: 'success',
        texto:
          'Revisión registrada correctamente.',
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
          'No fue posible registrar la revisión.',
      })
    } finally {
      setGuardando(false)
    }
  }

  const nombreExtintor = (id) => {
    const e = extintoresMap[id]

    return e
      ? `${e.code} — ${
          e.extinguisher_type?.name ||
          'Sin tipo'
        }${
          e.capacity
            ? ` — ${e.capacity}`
            : ''
        }`
      : `Extintor #${id}`
  }

  const limpiar = () => {
    setBusqueda('')
    setTipoFiltro('todos')
    setEstadoFiltro('todos')
    setPagina(1)
  }

  /*
   * Si estamos viendo las revisiones de un
   * extintor concreto, obtenemos sus datos
   * para mostrar un encabezado informativo.
   */
  const extintorSeleccionado =
    extinguisherIdFiltro
      ? extintoresMap[
          extinguisherIdFiltro
        ]
      : null

  if (cargando) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center py-5">
          <div
            className="spinner-border text-primary mb-2"
            role="status"
          />

          <div className="text-muted">
            Cargando revisiones...
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
            Revisiones de extintores
          </h2>

          <p className="text-muted mb-0">
            Histórico de inspecciones y control
            del ciclo hidrostático.
          </p>

          {extintorSeleccionado && (
            <div className="mt-2">
              <span className="badge text-bg-primary me-2">
                Extintor seleccionado
              </span>

              <strong>
                {nombreExtintor(
                  extintorSeleccionado.id,
                )}
              </strong>
            </div>
          )}
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => abrirNueva()}
        >
          + Nueva revisión
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
            <div className="col-12 col-md-5">
              <label className="form-label fw-semibold small mb-1">
                Buscar
              </label>

              <input
                className="form-control form-control-sm"
                placeholder="Código, tipo, capacidad, ubicación..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value)
                  setPagina(1)
                }}
              />
            </div>

            <div className="col-6 col-md-3">
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
                Resultado
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

                <option value="apto">
                  Apto
                </option>

                <option value="no_apto">
                  No apto
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

          <div className="mt-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={limpiar}
            >
              × Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Fecha</th>
                <th>Extintor</th>
                <th>Revisión</th>
                <th>Resultado</th>
                <th>Hidrostática</th>
                <th>
                  Próxima hidrostática
                </th>
                <th>Observaciones</th>
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
                    No se encontraron revisiones.
                  </td>
                </tr>
              ) : (
                visibles.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.inspection_date}
                    </td>

                    <td className="fw-semibold">
                      {nombreExtintor(
                        r.extinguisher_id,
                      )}
                    </td>

                    <td>
                      <span className="badge text-bg-primary">
                        #{r.inspection_number}
                      </span>

                      <div className="small text-muted">
                        Ciclo {r.inspection_cycle}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          String(
                            r.result,
                          ).toLowerCase() ===
                          'apto'
                            ? 'text-bg-success'
                            : 'text-bg-danger'
                        }`}
                      >
                        {r.result}
                      </span>
                    </td>

                    <td>
                      {r.hydrostatic_test_performed ? (
                        <>
                          <span className="badge text-bg-warning">
                            Realizada
                          </span>

                          <div className="small">
                            {r.hydrostatic_test_date ||
                              '—'}
                          </div>
                        </>
                      ) : (
                        'No'
                      )}
                    </td>

                    <td>
                      {r.next_hydrostatic_test_date ||
                        '—'}
                    </td>

                    <td>
                      {r.observations || '—'}
                    </td>

                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        title="Ver detalle"
                        onClick={() =>
                          verDetalle(r)
                        }
                      >
                        👁
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mt-3">
        <small className="text-muted">
          Mostrando {desde} - {hasta} de{' '}
          {filtradas.length} revisiones
        </small>

        <div className="d-flex gap-1">
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

      {mostrarModal &&
        (() => {
          const e =
            extintoresMap[
              formulario.extinguisherId
            ]

          const requiere =
            Number(
              e?.inspections_since_hydrostatic_test ??
                0,
            ) >= 4

          return (
            <Modal
              title="Nueva revisión de extintor"
              onClose={() =>
                !guardando &&
                setMostrarModal(false)
              }
              large
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
                    form="formRevision"
                    className="btn btn-primary"
                    disabled={guardando}
                  >
                    {guardando
                      ? 'Guardando...'
                      : 'Guardar revisión'}
                  </button>
                </>
              }
            >
              <form
                id="formRevision"
                onSubmit={guardar}
              >
                <div className="row g-3">
                  <div className="col-md-7">
                    <label className="form-label fw-semibold">
                      Extintor
                    </label>

                    <select
                      className="form-select"
                      name="extinguisherId"
                      value={
                        formulario.extinguisherId
                      }
                      onChange={cambiar}
                      required
                      disabled={guardando}
                    >
                      <option value="">
                        Selecciona...
                      </option>

                      {extintores
                        .filter(
                          (x) => x.active,
                        )
                        .map((x) => (
                          <option
                            key={x.id}
                            value={x.id}
                          >
                            {x.code} —{' '}
                            {x
                              .extinguisher_type
                              ?.name ||
                              'Sin tipo'}{' '}
                            —{' '}
                            {x.capacity ||
                              'Sin capacidad'}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="col-md-5">
                    <label className="form-label fw-semibold">
                      Fecha de revisión
                    </label>

                    <input
                      type="date"
                      className="form-control"
                      name="inspectionDate"
                      value={
                        formulario.inspectionDate
                      }
                      onChange={cambiar}
                      required
                      disabled={guardando}
                    />
                  </div>
                </div>

                {e && (
                  <div
                    className={`alert ${
                      requiere
                        ? 'alert-warning'
                        : 'alert-info'
                    } mt-3 mb-3`}
                  >
                    <strong>
                      {e.code} — Revisiones:{' '}
                      {e.inspections_since_hydrostatic_test ??
                        0}{' '}
                      / 4
                    </strong>

                    {requiere && (
                      <div className="mt-1">
                        ⚠️ La próxima revisión
                        requiere prueba
                        hidrostática.
                      </div>
                    )}
                  </div>
                )}

                <hr />

                <h6 className="fw-bold">
                  Ítems de revisión
                </h6>

                <div className="row g-2">
                  {items.map((item) => (
                    <div
                      className="col-12 col-md-6"
                      key={item.id}
                    >
                      <div className="border rounded p-2">
                        <div className="fw-semibold mb-1">
                          {item.name}
                        </div>

                        <select
                          className="form-select form-select-sm"
                          value={
                            formulario.items[
                              item.id
                            ] || 'NA'
                          }
                          onChange={(ev) =>
                            setFormulario(
                              (f) => ({
                                ...f,
                                items: {
                                  ...f.items,
                                  [item.id]:
                                    ev.target.value,
                                },
                              }),
                            )
                          }
                          disabled={guardando}
                        >
                          <option value="GOOD">
                            GOOD
                          </option>

                          <option value="BAD">
                            BAD
                          </option>

                          <option value="NA">
                            N/A
                          </option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">
                      Resultado general
                    </label>

                    <select
                      className="form-select"
                      name="result"
                      value={formulario.result}
                      onChange={cambiar}
                      disabled={guardando}
                    >
                      <option value="APTO">
                        APTO
                      </option>

                      <option value="NO_APTO">
                        NO APTO
                      </option>
                    </select>
                  </div>

                  <div className="col-md-8">
                    <label className="form-label fw-semibold">
                      Observaciones
                    </label>

                    <textarea
                      className="form-control"
                      rows="2"
                      name="observations"
                      value={
                        formulario.observations
                      }
                      onChange={cambiar}
                      disabled={guardando}
                    />
                  </div>
                </div>

                <div
                  className={`border rounded p-3 mt-3 ${
                    requiere ||
                    formulario.hydrostaticTestPerformed
                      ? 'border-warning bg-light'
                      : ''
                  }`}
                >
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="hydrostaticTestPerformed"
                      name="hydrostaticTestPerformed"
                      checked={
                        formulario.hydrostaticTestPerformed
                      }
                      onChange={cambiar}
                      disabled={guardando}
                      required={requiere}
                    />

                    <label
                      className="form-check-label fw-bold"
                      htmlFor="hydrostaticTestPerformed"
                    >
                      Prueba hidrostática
                      realizada
                    </label>
                  </div>

                  {requiere && (
                    <div className="small text-danger mt-1">
                      Obligatoria para esta
                      revisión. Debes marcarla
                      para continuar.
                    </div>
                  )}

                  {formulario.hydrostaticTestPerformed && (
                    <div className="row g-3 mt-1">
                      <div className="col-md-6">
                        <label className="form-label">
                          Fecha de prueba
                          hidrostática
                        </label>

                        <input
                          type="date"
                          className="form-control"
                          name="hydrostaticTestDate"
                          value={
                            formulario.hydrostaticTestDate
                          }
                          onChange={cambiar}
                          required
                          disabled={guardando}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">
                          Próxima fecha de prueba
                          hidrostática
                        </label>

                        <input
                          type="date"
                          className="form-control"
                          name="nextHydrostaticTestDate"
                          value={
                            formulario.nextHydrostaticTestDate
                          }
                          onChange={cambiar}
                          required
                          disabled={guardando}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </Modal>
          )
        })()}

      {cargandoDetalle && (
        <Modal
          title="Detalle de revisión"
          onClose={() =>
            !cargandoDetalle &&
            setDetalle(null)
          }
          footer={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDetalle(null)}
              disabled={cargandoDetalle}
            >
              Cerrar
            </button>
          }
        >
          <div className="text-center py-4">
            <div
              className="spinner-border text-primary mb-2"
              role="status"
            />

            <div className="text-muted">
              Cargando detalle de la revisión...
            </div>
          </div>
        </Modal>
      )}

      {detalle && !cargandoDetalle && (
        <Modal
          title={`Detalle de revisión #${detalle.inspection_number}`}
          onClose={() => setDetalle(null)}
          large
          footer={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDetalle(null)}
            >
              Cerrar
            </button>
          }
        >
          <div className="row g-3">
            <div className="col-md-6">
              <strong>Extintor</strong>

              <div>
                {nombreExtintor(
                  detalle.extinguisher_id,
                )}
              </div>
            </div>

            <div className="col-md-3">
              <strong>Fecha</strong>

              <div>
                {detalle.inspection_date}
              </div>
            </div>

            <div className="col-md-3">
              <strong>Resultado</strong>

              <div>
                <span
                  className={`badge ${
                    String(
                      detalle.result,
                    ).toLowerCase() === 'apto'
                      ? 'text-bg-success'
                      : 'text-bg-danger'
                  }`}
                >
                  {detalle.result}
                </span>
              </div>
            </div>
          </div>

          {detalle.hydrostatic_test_performed && (
            <div className="alert alert-warning mt-3">
              <strong>
                Prueba hidrostática
              </strong>

              <div>
                Realizada:{' '}
                {detalle.hydrostatic_test_date ||
                  '—'}
              </div>

              <div>
                Próxima:{' '}
                {detalle.next_hydrostatic_test_date ||
                  '—'}
              </div>
            </div>
          )}

          <hr />

          <h6 className="fw-bold">
            Ítems de revisión
          </h6>

          <div className="row g-2">
            {(detalle.results || []).map(
              (item) => (
                <div
                  className="col-12 col-md-6"
                  key={item.id}
                >
                  <div className="border rounded p-2 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">
                        {item
                          .inspection_item
                          ?.name ||
                          item.inspection_item_name ||
                          item.name ||
                          `Ítem #${item.inspection_item_id}`}
                      </div>

                      {item.observation && (
                        <div className="small text-muted mt-1">
                          {item.observation}
                        </div>
                      )}
                    </div>

                    <span
                      className={`badge ${resultadoClase(
                        item.result,
                      )}`}
                    >
                      {item.result}
                    </span>
                  </div>
                </div>
              ),
            )}

            {!(detalle.results || []).length && (
              <div className="text-muted">
                No hay detalle de ítems
                disponible.
              </div>
            )}
          </div>

          {detalle.observations && (
            <div className="mt-3">
              <strong>
                Observaciones
              </strong>

              <div>
                {detalle.observations}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

export default ExtinguisherInspectionsPage