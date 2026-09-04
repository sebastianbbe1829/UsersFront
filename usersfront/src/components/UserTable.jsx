import {
  useMemo,
  useState,
} from 'react'
import Can from './Can'

function UserTable({
  usuarios,
  onNuevoUsuario,
  onEditarUsuario,
  onEliminarUsuario,
  onAdministrarRoles,
}) {
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [usuariosPorPagina, setUsuariosPorPagina] = useState(10)
  const [paginaActual, setPaginaActual] = useState(1)

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim()

    return usuarios.filter((usuario) => {
      const coincideBusqueda =
        !texto ||
        String(usuario.dni ?? '').toLowerCase().includes(texto) ||
        String(usuario.name ?? '').toLowerCase().includes(texto) ||
        String(usuario.email ?? '').toLowerCase().includes(texto) ||
        String(usuario.phone ?? '').toLowerCase().includes(texto)

      const coincideEstado =
        estadoFiltro === 'todos' ||
        (estadoFiltro === 'activos' && usuario.status === 1) ||
        (estadoFiltro === 'inactivos' && usuario.status === 0)

      return coincideBusqueda && coincideEstado
    })
  }, [usuarios, busqueda, estadoFiltro])

  const totalPaginas = Math.ceil(
    usuariosFiltrados.length / usuariosPorPagina
  )

  const indiceInicial = (paginaActual - 1) * usuariosPorPagina
  const indiceFinal = indiceInicial + usuariosPorPagina
  const usuariosPagina = usuariosFiltrados.slice(indiceInicial, indiceFinal)

  const cambiarBusqueda = (valor) => {
    setBusqueda(valor)
    setPaginaActual(1)
  }

  const cambiarEstado = (valor) => {
    setEstadoFiltro(valor)
    setPaginaActual(1)
  }

  const cambiarCantidad = (valor) => {
    setUsuariosPorPagina(Number(valor))
    setPaginaActual(1)
  }

  const cambiarPagina = (pagina) => {
    if (pagina < 1 || pagina > totalPaginas) return
    setPaginaActual(pagina)
  }

  const limpiarFiltros = () => {
    setBusqueda('')
    setEstadoFiltro('todos')
    setPaginaActual(1)
  }

  const paginas = Array.from(
    { length: totalPaginas },
    (_, indice) => indice + 1
  )

  const renderEstado = (usuario) => {
    const bloqueado = usuario.locked_at != null

    return (
      <div className="d-flex flex-column gap-1">
        {usuario.status ? (
          <span className="badge bg-success">Activo</span>
        ) : (
          <span className="badge bg-secondary">Inactivo</span>
        )}

        {bloqueado && (
          <span
            className="badge bg-danger"
            title="La cuenta está bloqueada por intentos fallidos de autenticación"
          >
            🔒 Bloqueada
          </span>
        )}

        {usuario.failed_login_attempts > 0 && (
          <small className="text-muted">
            {usuario.failed_login_attempts} intento(s) fallido(s)
          </small>
        )}
      </div>
    )
  }

  return (
    <div className="container-fluid px-0 pb-3">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-2">
        <div>
          <h4 className="mb-0 fw-bold">Usuarios</h4>
          <small className="text-muted">
            Gestión de usuarios del sistema
          </small>
        </div>

        <Can permission="USER_CREATE">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onNuevoUsuario}
          >
            + Nuevo usuario
          </button>
        </Can>
      </div>

      <div className="card shadow-sm border-0 mb-2">
        <div className="card-body py-2 px-3">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-7">
              <label className="form-label fw-semibold small mb-1">
                Buscar usuario
              </label>
              <div className="input-group input-group-sm">
                <span className="input-group-text">🔎</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Identificación, nombre, email o teléfono..."
                  value={busqueda}
                  onChange={(e) => cambiarBusqueda(e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label fw-semibold small mb-1">
                Estado
              </label>
              <select
                className="form-select form-select-sm"
                value={estadoFiltro}
                onChange={(e) => cambiarEstado(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label fw-semibold small mb-1">
                Mostrar
              </label>
              <select
                className="form-select form-select-sm"
                value={usuariosPorPagina}
                onChange={(e) => cambiarCantidad(e.target.value)}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>

          {(busqueda || estadoFiltro !== 'todos') && (
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
                <th>Número de identificación</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {usuariosPagina.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                usuariosPagina.map((usuario) => (
                  <tr key={usuario.dni}>
                    <td>{usuario.dni}</td>
                    <td>{usuario.name}</td>
                    <td>{usuario.email}</td>
                    <td>{usuario.phone}</td>
                    <td>{renderEstado(usuario)}</td>
                    <td>
                      <div className="d-flex justify-content-center align-items-center gap-1 flex-nowrap">
                        <Can permission="USER_UPDATE">
                          <button
                            type="button"
                            className="btn btn-warning btn-sm py-0 px-2"
                            title={
                              usuario.locked_at != null
                                ? 'Editar usuario / desbloquear cuenta'
                                : 'Editar usuario'
                            }
                            aria-label={`Editar usuario ${usuario.name}`}
                            onClick={() => onEditarUsuario(usuario)}
                          >
                            {usuario.locked_at != null ? '🔓' : '✏️'}
                          </button>
                        </Can>

                        <Can permission="USER_DELETE">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm py-0 px-2"
                            title="Eliminar usuario"
                            aria-label={`Eliminar usuario ${usuario.name}`}
                            onClick={() => onEliminarUsuario(usuario)}
                          >
                            🗑️
                          </button>
                        </Can>

                        <Can permission="USER_UPDATE">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm py-0 px-2"
                            title="Administrar roles"
                            aria-label={`Administrar roles de ${usuario.name}`}
                            onClick={() => onAdministrarRoles(usuario)}
                          >
                            👥
                          </button>
                        </Can>
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
        {usuariosPagina.length === 0 ? (
          <div className="card shadow-sm text-center py-4">
            <div className="text-muted">No se encontraron usuarios.</div>
          </div>
        ) : (
          usuariosPagina.map((usuario) => (
            <div className="card shadow-sm mb-2" key={usuario.dni}>
              <div className="card-body py-3">
                <div className="mb-2">
                  <div className="text-muted small">Nombre</div>
                  <div className="fw-bold">{usuario.name}</div>
                </div>

                <div className="mb-2">
                  <div className="text-muted small">Número de identificación</div>
                  <div>{usuario.dni}</div>
                </div>

                <div className="mb-2">
                  <div className="text-muted small">Email</div>
                  <div className="text-break">{usuario.email}</div>
                </div>

                <div className="mb-2">
                  <div className="text-muted small">Teléfono</div>
                  <div>{usuario.phone}</div>
                </div>

                <div className="mb-2">
                  <div className="text-muted small mb-1">Estado</div>
                  {renderEstado(usuario)}
                </div>

                <div className="d-grid gap-1">
                  <Can permission="USER_UPDATE">
                    <button
                      type="button"
                      className="btn btn-warning btn-sm"
                      onClick={() => onEditarUsuario(usuario)}
                    >
                      {usuario.locked_at != null
                        ? '🔓 Desbloquear / editar usuario'
                        : '✏️ Editar'}
                    </button>
                  </Can>

                  <Can permission="USER_UPDATE">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => onAdministrarRoles(usuario)}
                    >
                      👥 Administrar roles
                    </button>
                  </Can>

                  <Can permission="USER_DELETE">
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => onEliminarUsuario(usuario)}
                    >
                      🗑️ Eliminar
                    </button>
                  </Can>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-1 mt-2 small text-muted">
        <div>
          Mostrando{' '}
          {usuariosFiltrados.length === 0 ? 0 : indiceInicial + 1}
          {' - '}
          {Math.min(indiceFinal, usuariosFiltrados.length)}
          {' de '}
          {usuariosFiltrados.length}
          {' usuarios'}
        </div>

        <div>
          Total: <strong>{usuarios.length}</strong>
          {' | '}
          Activos:{' '}
          <strong className="text-success">
            {usuarios.filter((usuario) => usuario.status === 1).length}
          </strong>
          {' | '}
          Inactivos:{' '}
          <strong>
            {usuarios.filter((usuario) => usuario.status === 0).length}
          </strong>
          {' | '}
          Bloqueados:{' '}
          <strong className="text-danger">
            {usuarios.filter((usuario) => usuario.locked_at != null).length}
          </strong>
        </div>
      </div>

      {totalPaginas > 1 && (
        <nav className="mt-2" aria-label="Paginación de usuarios">
          <ul className="pagination pagination-sm justify-content-center flex-wrap mb-0">
            <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
              >
                Anterior
              </button>
            </li>

            {paginas.map((pagina) => (
              <li
                key={pagina}
                className={`page-item ${paginaActual === pagina ? 'active' : ''}`}
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

            <li
              className={`page-item ${
                paginaActual === totalPaginas ? 'disabled' : ''
              }`}
            >
              <button
                type="button"
                className="page-link"
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
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
