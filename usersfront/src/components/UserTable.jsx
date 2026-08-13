import {
  useMemo,
  useState,
} from 'react'


function UserTable({
  usuarios,
  onNuevoUsuario,
  onEditarUsuario,
  onEliminarUsuario,
}) {

  // ==========================
  // ESTADOS
  // ==========================

  const [busqueda, setBusqueda] =
    useState('')

  const [estadoFiltro, setEstadoFiltro] =
    useState('todos')

  const [usuariosPorPagina, setUsuariosPorPagina] =
    useState(10)

  const [paginaActual, setPaginaActual] =
    useState(1)


  // ==========================
  // FILTRAR USUARIOS
  // ==========================

  const usuariosFiltrados =
    useMemo(() => {

      const texto =
        busqueda
          .toLowerCase()
          .trim()

      return usuarios.filter(
        (usuario) => {

          // --------------------------
          // BUSQUEDA
          // --------------------------

          const coincideBusqueda =
            !texto ||
            String(
              usuario.dni ?? ''
            )
              .toLowerCase()
              .includes(texto) ||

            String(
              usuario.name ?? ''
            )
              .toLowerCase()
              .includes(texto) ||

            String(
              usuario.email ?? ''
            )
              .toLowerCase()
              .includes(texto) ||

            String(
              usuario.phone ?? ''
            )
              .toLowerCase()
              .includes(texto)


          // --------------------------
          // FILTRO ESTADO
          // --------------------------

          const coincideEstado =
            estadoFiltro === 'todos' ||
            (
              estadoFiltro === 'activos' &&
              usuario.status === 1
            ) ||
            (
              estadoFiltro === 'inactivos' &&
              usuario.status === 0
            )


          return (
            coincideBusqueda &&
            coincideEstado
          )

        }
      )

    }, [
      usuarios,
      busqueda,
      estadoFiltro,
    ])


  // ==========================
  // PAGINACIÓN
  // ==========================

  const totalPaginas =
    Math.ceil(
      usuariosFiltrados.length /
      usuariosPorPagina
    )


  const indiceInicial =
    (paginaActual - 1) *
    usuariosPorPagina


  const indiceFinal =
    indiceInicial +
    usuariosPorPagina


  const usuariosPagina =
    usuariosFiltrados.slice(
      indiceInicial,
      indiceFinal
    )


  // ==========================
  // CAMBIAR BÚSQUEDA
  // ==========================

  const cambiarBusqueda = (
    valor
  ) => {

    setBusqueda(valor)

    setPaginaActual(1)

  }


  // ==========================
  // CAMBIAR ESTADO
  // ==========================

  const cambiarEstado = (
    valor
  ) => {

    setEstadoFiltro(valor)

    setPaginaActual(1)

  }


  // ==========================
  // CAMBIAR CANTIDAD
  // ==========================

  const cambiarCantidad = (
    valor
  ) => {

    setUsuariosPorPagina(
      Number(valor)
    )

    setPaginaActual(1)

  }


  // ==========================
  // CAMBIAR PÁGINA
  // ==========================

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


  // ==========================
  // LIMPIAR FILTROS
  // ==========================

  const limpiarFiltros = () => {

    setBusqueda('')

    setEstadoFiltro('todos')

    setPaginaActual(1)

  }


  // ==========================
  // PÁGINAS A MOSTRAR
  // ==========================

  const paginas = []

  for (
    let i = 1;
    i <= totalPaginas;
    i++
  ) {

    paginas.push(i)

  }


  // ==========================
  // RENDER
  // ==========================

  return (

    <div className="container pb-5">


      {/* ========================== */}
      {/* ENCABEZADO */}
      {/* ========================== */}

      <div
        className="
          d-flex
          flex-column
          flex-md-row
          justify-content-between
          align-items-md-center
          gap-3
          mb-4
        "
      >

        <div>

          <h2 className="mb-1">
            Usuarios
          </h2>

          <p className="text-muted mb-0">
            Gestión de usuarios del sistema
          </p>

        </div>


        <button
          type="button"
          className="btn btn-primary"
          onClick={onNuevoUsuario}
        >
          + Nuevo usuario
        </button>

      </div>


      {/* ========================== */}
      {/* FILTROS */}
      {/* ========================== */}

      <div
        className="
          card
          shadow-sm
          mb-3
        "
      >

        <div className="card-body">


          <div className="row g-3">


            {/* ========================== */}
            {/* BUSCAR */}
            {/* ========================== */}

            <div className="col-12 col-md-7">

              <label
                className="form-label fw-bold"
              >
                Buscar usuario
              </label>


              <div className="input-group">

                <span
                  className="input-group-text"
                >
                  🔎
                </span>


                <input
                  type="text"
                  className="form-control"
                  placeholder="Número de identificación, nombre, email o teléfono..."
                  value={busqueda}
                  onChange={(e) =>
                    cambiarBusqueda(
                      e.target.value
                    )
                  }
                  style={{
                    textAlign: 'left',
                  }}
                />

              </div>

            </div>


            {/* ========================== */}
            {/* ESTADO */}
            {/* ========================== */}

            <div className="col-12 col-md-3">

              <label
                className="form-label fw-bold"
              >
                Estado
              </label>


              <select
                className="form-select"
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


            {/* ========================== */}
            {/* MOSTRAR */}
            {/* ========================== */}

            <div className="col-12 col-md-2">

              <label
                className="form-label fw-bold"
              >
                Mostrar
              </label>


              <select
                className="form-select"
                value={usuariosPorPagina}
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


          {/* ========================== */}
          {/* LIMPIAR */}
          {/* ========================== */}

          {(busqueda ||
            estadoFiltro !== 'todos') && (

            <div className="mt-3">

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={limpiarFiltros}
              >
                ✕ Limpiar filtros
              </button>

            </div>

          )}

        </div>

      </div>


      {/* ========================== */}
      {/* TABLA DESKTOP */}
      {/* ========================== */}

      <div
        className="
          card
          shadow-sm
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
            "
          >

            <thead
              className="table-dark"
            >

              <tr>

                <th>
                  Número de identificación
                </th>

                <th>
                  Nombre
                </th>

                <th>
                  Email
                </th>

                <th>
                  Teléfono
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

              {usuariosPagina.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="
                      text-center
                      py-5
                      text-muted
                    "
                  >
                    No se encontraron usuarios.

                  </td>

                </tr>

              ) : (

                usuariosPagina.map(
                  (usuario) => (

                    <tr
                      key={usuario.dni}
                    >

                      <td>
                        {usuario.dni}
                      </td>


                      <td>
                        {usuario.name}
                      </td>


                      <td>
                        {usuario.email}
                      </td>


                      <td>
                        {usuario.phone}
                      </td>


                      <td>

                        {usuario.status ? (

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
                            gap-2
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
                              onEditarUsuario(
                                usuario
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
                              onEliminarUsuario(
                                usuario
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


      {/* ========================== */}
      {/* TARJETAS MOBILE */}
      {/* ========================== */}

      <div
        className="
          d-md-none
        "
      >

        {usuariosPagina.length === 0 ? (

          <div
            className="
              card
              shadow-sm
              text-center
              py-5
            "
          >

            <div className="text-muted">

              No se encontraron usuarios.

            </div>

          </div>

        ) : (

          usuariosPagina.map(
            (usuario) => (

              <div
                className="
                  card
                  shadow-sm
                  mb-3
                "
                key={usuario.dni}
              >

                <div className="card-body">


                  {/* ========================== */}
                  {/* NOMBRE */}
                  {/* ========================== */}

                  <div className="mb-3">

                    <div
                      className="
                        text-muted
                        small
                      "
                    >
                      Nombre
                    </div>

                    <div
                      className="
                        fw-bold
                        fs-5
                      "
                    >
                      {usuario.name}
                    </div>

                  </div>


                  {/* ========================== */}
                  {/* DNI */}
                  {/* ========================== */}

                  <div className="mb-3">

                    <div
                      className="
                        text-muted
                        small
                      "
                    >
                      Número de identificación
                    </div>

                    <div>
                      {usuario.dni}
                    </div>

                  </div>


                  {/* ========================== */}
                  {/* EMAIL */}
                  {/* ========================== */}

                  <div className="mb-3">

                    <div
                      className="
                        text-muted
                        small
                      "
                    >
                      Email
                    </div>

                    <div
                      className="text-break"
                    >
                      {usuario.email}
                    </div>

                  </div>


                  {/* ========================== */}
                  {/* TELÉFONO */}
                  {/* ========================== */}

                  <div className="mb-3">

                    <div
                      className="
                        text-muted
                        small
                      "
                    >
                      Teléfono
                    </div>

                    <div>
                      {usuario.phone}
                    </div>

                  </div>


                  {/* ========================== */}
                  {/* ESTADO */}
                  {/* ========================== */}

                  <div className="mb-3">

                    <div
                      className="
                        text-muted
                        small
                        mb-1
                      "
                    >
                      Estado
                    </div>


                    {usuario.status ? (

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


                  {/* ========================== */}
                  {/* ACCIONES */}
                  {/* ========================== */}

                  <div
                    className="
                      d-grid
                      gap-2
                    "
                  >

                    <button
                      type="button"
                      className="
                        btn
                        btn-warning
                      "
                      onClick={() =>
                        onEditarUsuario(
                          usuario
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
                      "
                      onClick={() =>
                        onEliminarUsuario(
                          usuario
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


      {/* ========================== */}
      {/* INFORMACIÓN */}
      {/* ========================== */}

      <div
        className="
          d-flex
          flex-column
          flex-md-row
          justify-content-between
          align-items-md-center
          gap-2
          mt-3
          text-muted
        "
      >

        <div>

          Mostrando{' '}

          {usuariosFiltrados.length === 0
            ? 0
            : indiceInicial + 1}

          {' - '}

          {Math.min(
            indiceFinal,
            usuariosFiltrados.length
          )}

          {' de '}

          {usuariosFiltrados.length}

          {' usuarios'}

        </div>


        <div>

          Total:{' '}
          <strong>
            {usuarios.length}
          </strong>

          {' | '}

          Activos:{' '}

          <strong
            className="text-success"
          >
            {
              usuarios.filter(
                (usuario) =>
                  usuario.status === 1
              ).length
            }
          </strong>

          {' | '}

          Inactivos:{' '}

          <strong>
            {
              usuarios.filter(
                (usuario) =>
                  usuario.status === 0
              ).length
            }
          </strong>

        </div>

      </div>


      {/* ========================== */}
      {/* PAGINACIÓN */}
      {/* ========================== */}

      {totalPaginas > 1 && (

        <nav
          className="mt-4"
          aria-label="Paginación de usuarios"
        >

          <ul
            className="
              pagination
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


export default UserTable