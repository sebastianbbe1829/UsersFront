import { useMemo, useState } from "react";

function RoleTable({ roles = [], onNuevoRol, onEditarRol, onEliminarRol }) {
  const safeRoles = Array.isArray(roles) ? roles : [];
  // usa safeRoles en lugar de roles en el useMemo
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");

  const rolesFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return roles.filter((rol) => {
      const coincideBusqueda =
        !texto ||
        String(rol.code ?? "").toLowerCase().includes(texto) ||
        String(rol.name ?? "").toLowerCase().includes(texto);

      const coincideEstado =
        estadoFiltro === "todos" ||
        (estadoFiltro === "activos" && rol.status === 1) ||
        (estadoFiltro === "inactivos" && rol.status === 0);

      return coincideBusqueda && coincideEstado;
    });
  }, [safeRoles, busqueda, estadoFiltro]);

  return (
    <div className="container-fluid px-0">
      {/* Botón Nuevo Rol */}
      <div className="d-flex justify-content-end mb-2">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onNuevoRol}
        >
          + Nuevo rol
        </button>
      </div>

      {/* Filtros */}
      <div className="card shadow-sm border-0 mb-2">
        <div className="card-body py-2">
          <div className="row g-2">
            <div className="col-md-8">
              <label className="form-label small fw-semibold mb-1">
                Buscar rol
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Código o nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold mb-1">
                Estado
              </label>
              <select
                className="form-select form-select-sm"
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 table-sm">
            <thead className="table-dark">
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rolesFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-4 text-muted"
                  >
                    No se encontraron roles.
                  </td>
                </tr>
              ) : (
                rolesFiltrados.map((rol) => (
                  <tr key={rol.id ?? rol.code}>
                    <td>{rol.code}</td>
                    <td>{rol.name}</td>
                    <td>{rol.description}</td>
                    <td>
                      {rol.status === 1 ? (
                        <span className="badge bg-success">Activo</span>
                      ) : (
                        <span className="badge bg-secondary">Inactivo</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-1">
                        <button
                          className="btn btn-warning btn-sm py-0"
                          onClick={() => onEditarRol(rol)}
                        >
                          ✏ Editar
                        </button>
                        <button
                          className="btn btn-danger btn-sm py-0"
                          onClick={() => onEliminarRol(rol)}
                        >
                          🗑 Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RoleTable;
