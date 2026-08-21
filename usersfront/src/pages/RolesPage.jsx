// src/pages/RolesPage.jsx
import { useState, useEffect } from "react";
import RoleTable from "../components/RoleTable";
import RoleForm from "../components/RoleForm";
import EditRoleForm from "../components/EditRoleForm";
import DeleteRoleModal from "../components/DeleteRoleModal";
import { obtenerRoles, tokenEstaExpirado } from "../services/api";

const API_URL = import.meta.env.VITE_API_URL;

function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [deleteRole, setDeleteRole] = useState(null);

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      setError(null);

      try {
        let token = localStorage.getItem("access_token");
        if (!token) {
          setError("No hay token. Inicia sesión.");
          setRoles([]);
          setLoading(false);
          return;
        }
        if (token.startsWith("Bearer ")) token = token.replace(/^Bearer\s+/i, "");
        if (tokenEstaExpirado(token)) {
          setError("La sesión expiró. Inicia sesión nuevamente.");
          setRoles([]);
          setLoading(false);
          return;
        }

        const data = await obtenerRoles(token);
        if (Array.isArray(data)) setRoles(data);
        else {
          setRoles([]);
          setError("Respuesta inesperada del servidor.");
        }
      } catch (err) {
        console.error("Error cargando roles:", err);
        setError(err?.message || "Error al cargar roles.");
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // Helper: obtiene el id numérico del rol.
  // Si role.id existe lo devuelve; si no, intenta GET /roles/{code} para resolverlo.
  const resolveRoleId = async (role) => {
    if (!role) throw new Error("Rol inválido");
    if (typeof role.id === "number") return role.id;

    // Si el backend tiene GET /roles/{role_id} que acepta code, esto fallará.
    // Aquí asumimos que existe un endpoint para buscar por code: GET /roles?code=read
    // Si tu API tiene otro endpoint para obtener por code, adáptalo.
    // Intentamos primero GET /roles/{code} (por si el backend acepta code en GET)
    const rawToken = localStorage.getItem("access_token") || "";
    let token = rawToken.startsWith("Bearer ") ? rawToken.replace(/^Bearer\s+/i, "") : rawToken;

    // 1) Intentar GET /roles/{code} (algunos backends permiten esto)
    try {
      const urlByCode = `${API_URL}/roles/${encodeURIComponent(role.code)}`;
      const res = await fetch(urlByCode, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const body = await res.json();
        if (body && typeof body.id === "number") return body.id;
      }
    } catch (e) {
      // no fatal, seguimos al siguiente intento
      console.debug("GET by code falló:", e);
    }

    // 2) Intentar buscar por query: GET /roles?code=read (si tu API soporta filtros)
    try {
      const urlQuery = `${API_URL}/roles?code=${encodeURIComponent(role.code)}`;
      const res2 = await fetch(urlQuery, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res2.ok) {
        const list = await res2.json();
        if (Array.isArray(list) && list.length > 0 && typeof list[0].id === "number") {
          return list[0].id;
        }
      }
    } catch (e) {
      console.debug("GET by query falló:", e);
    }

    // Si no pudimos resolver el id, lanzamos error claro
    throw new Error("No se pudo resolver el id numérico del rol. Asegúrate de que la API devuelva 'id' o exponga un endpoint para buscar por código.");
  };

  // Crear rol
  const handleAddRole = async (newRole) => {
    setError(null);
    const rawToken = localStorage.getItem("access_token") || "";
    let token = rawToken.startsWith("Bearer ") ? rawToken.replace(/^Bearer\s+/i, "") : rawToken;

    try {
      const res = await fetch(`${API_URL}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newRole),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw Object.assign(new Error(errBody?.detail || `Error ${res.status} al crear rol`), { status: res.status });
      }
      const created = await res.json();
      setRoles((prev) => [...prev, created]);
      setShowForm(false);
    } catch (err) {
      console.error("handleAddRole error:", err);
      setError(err.message || "No se pudo crear el rol.");
    }
  };

  // Editar rol usando PATCH a /roles/{id}
  const handleEditRole = async (updatedRole) => {
    setError(null);
    try {
      const id = await resolveRoleId(updatedRole);
      const rawToken = localStorage.getItem("access_token") || "";
      let token = rawToken.startsWith("Bearer ") ? rawToken.replace(/^Bearer\s+/i, "") : rawToken;

      const url = `${API_URL}/roles/${encodeURIComponent(id)}`;
      const payload = {
        name: updatedRole.name,
        description: updatedRole.description,
        status: typeof updatedRole.status === "boolean" ? updatedRole.status : Number(updatedRole.status),
      };

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const message = errBody?.detail || `Error ${res.status} al actualizar rol`;
        throw Object.assign(new Error(message), { status: res.status, detail: errBody });
      }

      const updated = await res.json();
      setRoles((prev) => prev.map((r) => (r.code === updated.code || r.id === updated.id ? updated : r)));
      setEditRole(null);
      setShowForm(false);
    } catch (err) {
      console.error("handleEditRole error:", err);
      setError(err.message || "No se pudo actualizar el rol.");
    }
  };

  // Eliminar rol usando DELETE a /roles/{id}
  const handleDeleteRole = async (rol) => {
    setError(null);
    try {
      const id = await resolveRoleId(rol);
      const rawToken = localStorage.getItem("access_token") || "";
      let token = rawToken.startsWith("Bearer ") ? rawToken.replace(/^Bearer\s+/i, "") : rawToken;

      const res = await fetch(`${API_URL}/roles/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const message = errBody?.detail || `Error ${res.status} al eliminar rol`;
        throw Object.assign(new Error(message), { status: res.status });
      }

      setRoles((prev) => prev.filter((r) => r.code !== rol.code && r.id !== id));
      setDeleteRole(null);
    } catch (err) {
      console.error("handleDeleteRole error:", err);
      setError(err.message || "No se pudo eliminar el rol.");
    }
  };

  return (
    <div className="container py-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">Gestión de Roles</h2>
      </div>

      {error && <div className="alert alert-warning" role="alert">{error}</div>}

      {loading ? (
        <div className="card shadow-sm border-0"><div className="card-body">Cargando roles...</div></div>
      ) : (
        <RoleTable
          roles={roles}
          onNuevoRol={() => { setEditRole(null); setShowForm(true); }}
          onEditarRol={(rol) => { setEditRole(rol); setShowForm(true); }}
          onEliminarRol={(rol) => setDeleteRole(rol)}
        />
      )}

      <RoleForm
        show={showForm && !editRole}
        initial={null}
        onSubmit={handleAddRole}
        onCancel={() => { setShowForm(false); setEditRole(null); }}
      />

      <EditRoleForm
        show={showForm && !!editRole}
        role={editRole}
        onSubmit={handleEditRole}
        onCancel={() => { setShowForm(false); setEditRole(null); }}
      />

      <DeleteRoleModal
        role={deleteRole}
        show={!!deleteRole}
        onConfirm={async (rol) => { await handleDeleteRole(rol); }}
        onCancel={() => setDeleteRole(null)}
      />
    </div>
  );
}

export default RolesPage;
