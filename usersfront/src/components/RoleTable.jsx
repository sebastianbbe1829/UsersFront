import {
  useMemo,
  useState,
} from 'react'


function RoleTable({
  roles,
  onNuevoRol,
  onEditarRol,
  onEliminarRol,
}) {

  // ============================================================
  // ESTADOS
  // ============================================================

  const [busqueda, setBusqueda] =
    useState('')

  const [estadoFiltro, setEstadoFiltro] =
    useState('todos')

  const [rolesPorPagina, setRolesPorPagina] =
    useState(10)

  const [paginaActual, setPaginaActual] =
    useState(1)


  // ============================================================
  // FILTRAR ROLES
  // ============================================================

  const rolesFiltrados =
    useMemo(() => {

      const texto =
        busqueda
          .toLowerCase()
          .trim()


      return roles.filter(
        (rol) => {

          const coincideBusqueda =
            !texto ||
            String(
              rol.code ?? ''
            )
              .toLowerCase()
              .includes(texto) ||

            String(
              rol.name ?? ''
            )
              .toLowerCase()
              .includes(texto) ||

            String(
              rol.description ?? ''
            )
              .toLowerCase()
              .includes(texto)


          const coincideEstado =
            estadoFiltro === 'todos' ||

            (
              estadoFiltro === 'activos' &&
              rol.status === 1
            ) ||

            (
              estadoFiltro === 'inactivos' &&
              rol.status === 0
            )


          return (
            coincideBusqueda &&
            coincideEstado
          )

        }
      )

    }, [
      roles,
      busqueda,
      estadoFiltro,
    ])


  // ============================================================
  // PAGINACIÓN
  // ============================================================

  const totalPaginas =
    Math.ceil(
      rolesFiltrados.length /
      rolesPorPagina
    )


  const indiceInicial =
    (paginaActual - 1) *
    rolesPorPagina


  const indiceFinal =
    indiceInicial +
    rolesPorPagina


  const rolesPagina =
    rolesFiltrados.slice(
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

    setRolesPorPagina(
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
            Roles
          </h4>


          <small className="text-muted">
            Gestión de roles del sistema
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
            onNuevoRol
          }
        >
          + Nuevo rol
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


            {/* ================================================= */}
            {/* BUSCAR                                            */}
            {/* ================================================= */}

            <div className="col-12 col-md-7">

              <label
                className="
                  form-label
                  fw-semibold
                  small
                  mb-1
                "
              >
                Buscar rol
              </label>


              <div className="input-group input-group-sm">

                <span
                  className="
                    input-group-text
                  "
                >
                  🔎
                </span>


                <input
                  type="text"
                  className="
                    form-control
                  "
                  placeholder="
                    Código, nombre o descripción...
                  "
                  value={busqueda}
                  onChange={(e) =>
                    cambiarBusqueda(
                      e.target.value
                    )
                  }
                />

              </div>

            </div>


            {/* ================================================= */}
            {/* ESTADO                                             */}
            {/* ================================================= */}

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


            {/* ================================================= */}
            {/* MOSTRAR                                            */}
            {/* ================================================= */}

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
                value={rolesPorPagina}
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


          {/* ================================================= */}
          {/* LIMPIAR FILTROS                                   */}
          {/* ================================================= */}

          {(busqueda ||
            estadoFiltro !== 'todos') && (

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

            <thead
              className="
                table-dark
              "
            >

              <tr>

                <th>
                  Código
                </th>

                <th>
                  Nombre
                </th>

                <th>
                  Descripción
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

              {rolesPagina.length === 0 ? (

                <tr>

                  <td
                    colSpan="5"
                    className="
                      text-center
                      py-4
                      text-muted
                    "
                  >
                    No se encontraron roles.
                  </td>

                </tr>

              ) : (

                rolesPagina.map(
                  (rol) => (

                    <tr
                      key={rol.id}
                    >

                      <td>
                        {rol.code}
                      </td>


                      <td>
                        {rol.name}
                      </td>


                      <td>
                        {rol.description || '—'}
                      </td>


                      <td>

                        {rol.status === 1 ? (

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
                            onClick={() =>
                              onEditarRol(
                                rol
                              )
                            }
                          >
                            ✏️ Editar
                          </button>


                          <button
                            type="button"
                            className="
                              btn
                              btn-danger
                              btn-sm
                              py-0
                            "
                            onClick={() =>
                              onEliminarRol(
                                rol
                              )
                            }
                          >
                            🗑️ Eliminar
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

        {rolesPagina.length === 0 ? (

          <div
            className="
              card
              shadow-sm
              text-center
              py-4
            "
          >

            <div className="text-muted">
              No se encontraron roles.
            </div>

          </div>

        ) : (

          rolesPagina.map(
            (rol) => (

              <div
                className="
                  card
                  shadow-sm
                  mb-2
                "
                key={rol.id}
              >

                <div className="card-body py-3">


                  {/* CÓDIGO */}

                  <div className="mb-2">

                    <div
                      className="
                        text-muted
                        small
                      "
                    >
                      Código
                    </div>

                    <div
                      className="
                        fw-bold
                      "
                    >
                      {rol.code}
                    </div>

                  </div>


                  {/* NOMBRE */}

                  <div className="mb-2">

                    <div
                      className="
                        text-muted
                        small
                      "
                    >
                      Nombre
                    </div>

                    <div>
                      {rol.name}
                    </div>

                  </div>


                  {/* DESCRIPCIÓN */}

                  <div className="mb-2">

                    <div
                      className="
                        text-muted
                        small
                      "
                    >
                      Descripción
                    </div>

                    <div
                      className="
                        text-break
                      "
                    >
                      {rol.description || '—'}
                    </div>

                  </div>


                  {/* ESTADO */}

                  <div className="mb-2">

                    <div
                      className="
                        text-muted
                        small
                        mb-1
                      "
                    >
                      Estado
                    </div>


                    {rol.status === 1 ? (

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

                  </div>


                  {/* ACCIONES */}

                  <div
                    className="
                      d-grid
                      gap-1
                    "
                  >

                    <button
                      type="button"
                      className="
                        btn
                        btn-warning
                        btn-sm
                      "
                      onClick={() =>
                        onEditarRol(
                          rol
                        )
                      }
                    >
                      ✏️ Editar
                    </button>


                    <button
                      type="button"
                      className="
                        btn
                        btn-danger
                        btn-sm
                      "
                      onClick={() =>
                        onEliminarRol(
                          rol
                        )
                      }
                    >
                      🗑️ Eliminar
                    </button>

                  </div>

                </div>

              </div>

            )
          )

        )}

      </div>


      {/* ====================================================== */}
      {/* INFORMACIÓN                                          */}
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

          {rolesFiltrados.length === 0
            ? 0
            : indiceInicial + 1}

          {' - '}

          {Math.min(
            indiceFinal,
            rolesFiltrados.length
          )}

          {' de '}

          {rolesFiltrados.length}

          {' roles'}

        </div>


        <div>

          Total:{' '}
          <strong>
            {roles.length}
          </strong>

          {' | '}

          Activos:{' '}

          <strong
            className="text-success"
          >
            {
              roles.filter(
                (rol) =>
                  rol.status === 1
              ).length
            }
          </strong>

          {' | '}

          Inactivos:{' '}

          <strong>
            {
              roles.filter(
                (rol) =>
                  rol.status === 0
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
          aria-label="Paginación de roles"
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

            {/* ANTERIOR */}

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


            {/* NÚMEROS */}

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


            {/* SIGUIENTE */}

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


export default RoleTable