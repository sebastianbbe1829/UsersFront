import {
  useMemo,
  useState,
} from 'react'

function PermissionTable({
  permisos,
  onNuevoPermiso,
}) {

  // ============================================================
  // ESTADOS
  // ============================================================

  const [busqueda, setBusqueda] =
    useState('')

  const [estadoFiltro, setEstadoFiltro] =
    useState('todos')

  const [permisosPorPagina, setPermisosPorPagina] =
    useState(10)

  const [paginaActual, setPaginaActual] =
    useState(1)


  // ============================================================
  // FILTRAR PERMISOS
  // ============================================================

  const permisosFiltrados =
    useMemo(() => {

      const texto =
        busqueda
          .toLowerCase()
          .trim()


      return permisos.filter(
        (permiso) => {

          const coincideBusqueda =
            !texto ||

            String(
              permiso.code ?? ''
            )
              .toLowerCase()
              .includes(texto) ||

            String(
              permiso.name ?? ''
            )
              .toLowerCase()
              .includes(texto)


          const coincideEstado =
            estadoFiltro === 'todos' ||

            (
              estadoFiltro === 'activos' &&
              permiso.status === 1
            ) ||

            (
              estadoFiltro === 'inactivos' &&
              permiso.status === 0
            )


          return (
            coincideBusqueda &&
            coincideEstado
          )
        }
      )

    }, [
      permisos,
      busqueda,
      estadoFiltro,
    ])


  // ============================================================
  // PAGINACIÓN
  // ============================================================

  const totalPaginas =
    Math.ceil(
      permisosFiltrados.length /
      permisosPorPagina
    )


  const indiceInicial =
    (paginaActual - 1) *
    permisosPorPagina


  const indiceFinal =
    indiceInicial +
    permisosPorPagina


  const permisosPagina =
    permisosFiltrados.slice(
      indiceInicial,
      indiceFinal
    )


  // ============================================================
  // CAMBIAR BÚSQUEDA
  // ============================================================

  const cambiarBusqueda = (
    valor
  ) => {

    setBusqueda(valor)
    setPaginaActual(1)

  }


  // ============================================================
  // CAMBIAR ESTADO
  // ============================================================

  const cambiarEstado = (
    valor
  ) => {

    setEstadoFiltro(valor)
    setPaginaActual(1)

  }


  // ============================================================
  // CAMBIAR CANTIDAD
  // ============================================================

  const cambiarCantidad = (
    valor
  ) => {

    setPermisosPorPagina(
      Number(valor)
    )

    setPaginaActual(1)

  }


  // ============================================================
  // CAMBIAR PÁGINA
  // ============================================================

  const cambiarPagina = (
    pagina
  ) => {

    if (
      pagina < 1 ||
      pagina > totalPaginas
    ) {
      return
    }

    setPaginaActual(pagina)

  }


  // ============================================================
  // LIMPIAR FILTROS
  // ============================================================

  const limpiarFiltros = () => {

    setBusqueda('')
    setEstadoFiltro('todos')
    setPaginaActual(1)

  }


  // ============================================================
  // PÁGINAS
  // ============================================================

  const paginas = []

  for (
    let i = 1;
    i <= totalPaginas;
    i++
  ) {

    paginas.push(i)

  }


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div className="container-fluid px-0 pb-3">


      {/* ====================================================== */}
      {/* ENCABEZADO                                             */}
      {/* ====================================================== */}

      <div
        className="
          d-flex
          flex-column
          flex-md-row
          justify-content-between
          align-items-md-center
          gap-2
          mb-2
        "
      >

        <div>

          <h4
            className="
              mb-0
              fw-bold
            "
          >
            Permisos
          </h4>

          <small className="text-muted">
            Gestión de permisos globales del sistema
          </small>

        </div>


        <button
          type="button"
          className="
            btn
            btn-primary
            btn-sm
          "
          onClick={
            onNuevoPermiso
          }
        >
          + Nuevo permiso
        </button>

      </div>


      {/* ====================================================== */}
      {/* FILTROS                                                */}
      {/* ====================================================== */}

      <div
        className="
          card
          shadow-sm
          border-0
          mb-2
        "
      >

        <div
          className="
            card-body
            py-2
            px-3
          "
        >

          <div className="row g-2 align-items-end">


            {/* BUSCAR */}

            <div className="col-12 col-md-7">

              <label
                className="
                  form-label
                  fw-semibold
                  small
                  mb-1
                "
              >
                Buscar permiso
              </label>

              <div className="input-group input-group-sm">

                <span className="input-group-text">
                  🔎
                </span>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Código o nombre..."
                  value={busqueda}
                  onChange={(e) =>
                    cambiarBusqueda(
                      e.target.value
                    )
                  }
                />

              </div>

            </div>


            {/* ESTADO */}

            <div className="col-6 col-md-3">

              <label
                className="
                  form-label
                  fw-semibold
                  small
                  mb-1
                "
              >
                Estado
              </label>

              <select
                className="
                  form-select
                  form-select-sm
                "
                value={estadoFiltro}
                onChange={(e) =>
                  cambiarEstado(
                    e.target.value
                  )
                }
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


            {/* MOSTRAR */}

            <div className="col-6 col-md-2">

              <label
                className="
                  form-label
                  fw-semibold
                  small
                  mb-1
                "
              >
                Mostrar
              </label>

              <select
                className="
                  form-select
                  form-select-sm
                "
                value={permisosPorPagina}
                onChange={(e) =>
                  cambiarCantidad(
                    e.target.value
                  )
                }
              >

                <option value="5">
                  5
                </option>

                <option value="10">
                  10
                </option>

                <option value="20">
                  20
                </option>

                <option value="50">
                  50
                </option>

              </select>

            </div>

          </div>


          {/* LIMPIAR */}

          {(
            busqueda ||
            estadoFiltro !== 'todos'
          ) && (

            <div className="mt-2">

              <button
                type="button"
                className="
                  btn
                  btn-outline-secondary
                  btn-sm
                  py-0
                "
                onClick={
                  limpiarFiltros
                }
              >
                × Limpiar filtros
              </button>

            </div>

          )}

        </div>

      </div>


      {/* ====================================================== */}
      {/* TABLA DESKTOP                                         */}
      {/* ====================================================== */}

      <div
        className="
          card
          shadow-sm
          border-0
          d-none
          d-md-block
        "
      >

        <div className="table-responsive">

          <table
            className="
              table
              table-hover
              align-middle
              mb-0
              table-sm
            "
          >

            <thead className="table-dark">

              <tr>

                <th>
                  Código
                </th>

                <th>
                  Nombre
                </th>

                <th>
                  Estado
                </th>

                <th className="text-center">
                  Acciones
                </th>

              </tr>

            </thead>


            <tbody>

              {permisosPagina.length === 0 ? (

                <tr>

                  <td
                    colSpan="4"
                    className="
                      text-center
                      py-4
                      text-muted
                    "
                  >
                    No se encontraron permisos.
                  </td>

                </tr>

              ) : (

                permisosPagina.map(
                  (permiso) => (

                    <tr
                      key={permiso.id}
                    >

                      <td>
                        {permiso.code}
                      </td>

                      <td>
                        {permiso.name}
                      </td>

                      <td>

                        {permiso.status === 1 ? (

                          <span
                            className="
                              badge
                              bg-success
                            "
                          >
                            Activo
                          </span>

                        ) : (

                          <span
                            className="
                              badge
                              bg-secondary
                            "
                          >
                            Inactivo
                          </span>

                        )}

                      </td>


                      <td>

                        <div
                          className="
                            d-flex
                            justify-content-center
                            gap-1
                            flex-wrap
                          "
                        >

                          <button
                            type="button"
                            className="
                              btn
                              btn-warning
                              btn-sm
                              py-0
                            "
                            disabled
                            title="Disponible cuando exista el endpoint de actualización"
                          >
                            ✏️ Editar
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ====================================================== */}
      {/* TARJETAS MOBILE                                       */}
      {/* ====================================================== */}

      <div className="d-md-none">

        {permisosPagina.length === 0 ? (

          <div
            className="
              card
              shadow-sm
              text-center
              py-4
            "
          >

            <div className="text-muted">
              No se encontraron permisos.
            </div>

          </div>

        ) : (

          permisosPagina.map(
            (permiso) => (

              <div
                className="
                  card
                  shadow-sm
                  mb-2
                "
                key={permiso.id}
              >

                <div className="card-body py-3">


                  <div className="mb-2">

                    <div className="text-muted small">
                      Código
                    </div>

                    <div className="fw-bold">
                      {permiso.code}
                    </div>

                  </div>


                  <div className="mb-2">

                    <div className="text-muted small">
                      Nombre
                    </div>

                    <div>
                      {permiso.name}
                    </div>

                  </div>


                  <div className="mb-2">

                    <div className="text-muted small mb-1">
                      Estado
                    </div>

                    {permiso.status === 1 ? (

                      <span className="badge bg-success">
                        Activo
                      </span>

                    ) : (

                      <span className="badge bg-secondary">
                        Inactivo
                      </span>

                    )}

                  </div>


                  <div className="d-grid">

                    <button
                      type="button"
                      className="
                        btn
                        btn-warning
                        btn-sm
                      "
                      disabled
                      title="Disponible cuando exista el endpoint de actualización"
                    >
                      ✏️ Editar
                    </button>

                  </div>

                </div>

              </div>

            )
          )

        )}

      </div>


      {/* ====================================================== */}
      {/* INFORMACIÓN                                           */}
      {/* ====================================================== */}

      <div
        className="
          d-flex
          flex-column
          flex-md-row
          justify-content-between
          align-items-md-center
          gap-1
          mt-2
          small
          text-muted
        "
      >

        <div>

          Mostrando{' '}

          {permisosFiltrados.length === 0
            ? 0
            : indiceInicial + 1}

          {' - '}

          {Math.min(
            indiceFinal,
            permisosFiltrados.length
          )}

          {' de '}

          {permisosFiltrados.length}

          {' permisos'}

        </div>


        <div>

          Total:{' '}

          <strong>
            {permisos.length}
          </strong>

          {' | '}

          Activos:{' '}

          <strong className="text-success">

            {
              permisos.filter(
                (permiso) =>
                  permiso.status === 1
              ).length
            }

          </strong>

          {' | '}

          Inactivos:{' '}

          <strong>

            {
              permisos.filter(
                (permiso) =>
                  permiso.status === 0
              ).length
            }

          </strong>

        </div>

      </div>


      {/* ====================================================== */}
      {/* PAGINACIÓN                                            */}
      {/* ====================================================== */}

      {totalPaginas > 1 && (

        <nav
          className="mt-2"
          aria-label="Paginación de permisos"
        >

          <ul
            className="
              pagination
              pagination-sm
              justify-content-center
              flex-wrap
              mb-0
            "
          >

            <li
              className={
                `page-item ${
                  paginaActual === 1
                    ? 'disabled'
                    : ''
                }`
              }
            >

              <button
                type="button"
                className="page-link"
                onClick={() =>
                  cambiarPagina(
                    paginaActual - 1
                  )
                }
                disabled={
                  paginaActual === 1
                }
              >
                Anterior
              </button>

            </li>


            {paginas.map(
              (pagina) => (

                <li
                  key={pagina}
                  className={
                    `page-item ${
                      paginaActual === pagina
                        ? 'active'
                        : ''
                    }`
                  }
                >

                  <button
                    type="button"
                    className="page-link"
                    onClick={() =>
                      cambiarPagina(
                        pagina
                      )
                    }
                  >
                    {pagina}
                  </button>

                </li>

              )
            )}


            <li
              className={
                `page-item ${
                  paginaActual === totalPaginas
                    ? 'disabled'
                    : ''
                }`
              }
            >

              <button
                type="button"
                className="page-link"
                onClick={() =>
                  cambiarPagina(
                    paginaActual + 1
                  )
                }
                disabled={
                  paginaActual === totalPaginas
                }
              >
                Siguiente
              </button>

            </li>

          </ul>

        </nav>

      )}

    </div>

  )
}

export default PermissionTable