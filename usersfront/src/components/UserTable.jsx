import { useState, useEffect } from 'react'

function UserTable({
  usuarios,
  onNuevoUsuario,
  onEditarUsuario,
  onEliminarUsuario,
}) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  // Cantidad de usuarios por página
  const [usuariosPorPagina, setUsuariosPorPagina] = useState(10)

  // Página actual
  const [paginaActual, setPaginaActual] = useState(1)

  // ==========================
  // FILTRAR USUARIOS
  // ==========================

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const textoBusqueda = busqueda
      .toLowerCase()
      .trim()

    const dni = String(usuario.dni || '').toLowerCase()
    const nombre = String(usuario.name || '').toLowerCase()
    const email = String(usuario.email || '').toLowerCase()
    const telefono = String(usuario.phone || '').toLowerCase()

    const coincideBusqueda =
      textoBusqueda === '' ||
      dni.includes(textoBusqueda) ||
      nombre.includes(textoBusqueda) ||
      email.includes(textoBusqueda) ||
      telefono.includes(textoBusqueda)

    const coincideEstado =
      filtroEstado === 'todos' ||
      (filtroEstado === 'activos' && usuario.status === true) ||
      (filtroEstado === 'inactivos' && usuario.status === false)

    return coincideBusqueda && coincideEstado
  })

  // ==========================
  // PAGINACIÓN
  // ==========================

  const totalUsuarios = usuariosFiltrados.length

  const totalPaginas =
    Math.ceil(totalUsuarios / usuariosPorPagina)

  // Si cambiamos los filtros y la página actual
  // ya no existe, volvemos a la primera.
  useEffect(() => {
    if (
      totalPaginas > 0 &&
      paginaActual > totalPaginas
    ) {
      setPaginaActual(1)
    }
  }, [
    totalPaginas,
    paginaActual,
  ])

  const indiceInicial =
    (paginaActual - 1) * usuariosPorPagina

  const indiceFinal =
    indiceInicial + usuariosPorPagina

  const usuariosPagina =
    usuariosFiltrados.slice(
      indiceInicial,
      indiceFinal
    )

  // ==========================
  // CAMBIAR PÁGINA
  // ==========================

  const cambiarPagina = (pagina) => {
    if (
      pagina < 1 ||
      pagina > totalPaginas
    ) {
      return
    }

    setPaginaActual(pagina)
  }

  // ==========================
  // CAMBIAR CANTIDAD POR PÁGINA
  // ==========================

  const cambiarUsuariosPorPagina = (event) => {
    const cantidad = Number(event.target.value)

    setUsuariosPorPagina(cantidad)

    // Cuando cambiamos la cantidad,
    // volvemos a la primera página.
    setPaginaActual(1)
  }

  // ==========================
  // GENERAR BOTONES DE PÁGINAS
  // ==========================

  const paginas = []

  for (let i = 1; i <= totalPaginas; i++) {
    paginas.push(i)
  }

  // ==========================
  // RESET DE PÁGINA AL BUSCAR
  // ==========================

  const cambiarBusqueda = (event) => {
    setBusqueda(event.target.value)
    setPaginaActual(1)
  }

  const cambiarFiltroEstado = (event) => {
    setFiltroEstado(event.target.value)
    setPaginaActual(1)
  }

  return (
    <div className="container py-4">

      {/* ========================== */}
      {/* ENCABEZADO */}
      {/* ========================== */}

      <div className="d-flex justify-content-between align-items-center mb-4">

        <div>

          <h2 className="mb-1">
            Usuarios
          </h2>

          <p className="text-muted mb-0">
            Gestión de usuarios del sistema
          </p>

        </div>

        <button
          className="btn btn-primary"
          onClick={onNuevoUsuario}
        >
          + Nuevo usuario
        </button>

      </div>


      {/* ========================== */}
      {/* FILTROS */}
      {/* ========================== */}

      <div className="card shadow-sm mb-3">

        <div className="card-body">

          <div className="row g-3">

            {/* BUSCAR */}

            <div className="col-md-7">

              <label className="form-label fw-semibold">
                Buscar usuario
              </label>

              <div className="input-group">

                <span className="input-group-text">
                  🔎
                </span>

                <input
                  type="text"
                  className="form-control"
                  placeholder="DNI, nombre, email o teléfono..."
                  value={busqueda}
                  onChange={cambiarBusqueda}
                />

                {busqueda && (

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setBusqueda('')
                      setPaginaActual(1)
                    }}
                  >
                    ✕
                  </button>

                )}

              </div>

            </div>


            {/* ESTADO */}

            <div className="col-md-3">

              <label className="form-label fw-semibold">
                Estado
              </label>

              <select
                className="form-select"
                value={filtroEstado}
                onChange={cambiarFiltroEstado}
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


            {/* USUARIOS POR PÁGINA */}

            <div className="col-md-2">

              <label className="form-label fw-semibold">
                Mostrar
              </label>

              <select
                className="form-select"
                value={usuariosPorPagina}
                onChange={cambiarUsuariosPorPagina}
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

        </div>

      </div>


      {/* ========================== */}
      {/* TABLA */}
      {/* ========================== */}

      <div className="card shadow-sm">

        <div className="card-body p-0">

          <div className="table-responsive">

            <table className="table table-hover align-middle mb-0">

              <thead className="table-dark">

                <tr>

                  <th>DNI</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
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
                      className="text-center py-5"
                    >

                      <div
                        style={{
                          fontSize: '2.5rem',
                        }}
                      >
                        🔍
                      </div>

                      <div className="mt-2 fw-semibold">
                        No se encontraron usuarios
                      </div>

                      <div className="text-muted">
                        Intenta cambiar los filtros de búsqueda.
                      </div>

                    </td>

                  </tr>

                ) : (

                  usuariosPagina.map((user) => (

                    <tr key={user.dni}>

                      <td>
                        {user.dni}
                      </td>

                      <td className="fw-semibold">
                        {user.name}
                      </td>

                      <td>
                        {user.email}
                      </td>

                      <td>
                        {user.phone}
                      </td>

                      <td>

                        {user.status ? (

                          <span className="badge bg-success">
                            Activo
                          </span>

                        ) : (

                          <span className="badge bg-secondary">
                            Inactivo
                          </span>

                        )}

                      </td>

                      <td className="text-center">

                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={() =>
                            onEditarUsuario(user)
                          }
                        >
                          ✏️ Editar
                        </button>

                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() =>
                            onEliminarUsuario(user)
                          }
                        >
                          🗑️ Eliminar
                        </button>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>


      {/* ========================== */}
      {/* INFORMACIÓN */}
      {/* ========================== */}

      <div className="d-flex justify-content-between align-items-center mt-3">

        <div className="text-muted">

          {totalUsuarios > 0 ? (

            <>
              Mostrando{' '}
              <strong>
                {indiceInicial + 1}
              </strong>
              {' - '}
              <strong>
                {Math.min(
                  indiceFinal,
                  totalUsuarios
                )}
              </strong>
              {' '}de{' '}
              <strong>
                {totalUsuarios}
              </strong>
              {' '}usuarios
            </>

          ) : (

            'No hay usuarios'

          )}

        </div>


        <div className="text-muted">

          Total: {' '}

          <strong>
            {usuarios.length}
          </strong>

          {' | '}

          Activos: {' '}

          <strong className="text-success">
            {
              usuarios.filter(
                (usuario) =>
                  usuario.status === true
              ).length
            }
          </strong>

          {' | '}

          Inactivos: {' '}

          <strong>
            {
              usuarios.filter(
                (usuario) =>
                  usuario.status === false
              ).length
            }
          </strong>

        </div>

      </div>


      {/* ========================== */}
      {/* PAGINACIÓN */}
      {/* ========================== */}

      {totalPaginas > 1 && (

        <div className="d-flex justify-content-center mt-4">

          <nav>

            <ul className="pagination">

              {/* ANTERIOR */}

              <li
                className={`page-item ${
                  paginaActual === 1
                    ? 'disabled'
                    : ''
                }`}
              >

                <button
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
                  «
                </button>

              </li>


              {/* PÁGINAS */}

              {paginas.map((pagina) => (

                <li
                  key={pagina}
                  className={`page-item ${
                    paginaActual === pagina
                      ? 'active'
                      : ''
                  }`}
                >

                  <button
                    className="page-link"
                    onClick={() =>
                      cambiarPagina(pagina)
                    }
                  >
                    {pagina}
                  </button>

                </li>

              ))}


              {/* SIGUIENTE */}

              <li
                className={`page-item ${
                  paginaActual === totalPaginas
                    ? 'disabled'
                    : ''
                }`}
              >

                <button
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
                  »
                </button>

              </li>

            </ul>

          </nav>

        </div>

      )}

    </div>
  )
}

export default UserTable