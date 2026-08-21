// src/components/RoleForm.jsx
import { useEffect, useState } from "react";

const backdropStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000,
};

const dialogStyle = {
  width: "100%",
  maxWidth: "640px",
  background: "#fff",
  borderRadius: "8px",
  boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
  overflow: "hidden",
};

const headerStyle = {
  padding: "16px 20px",
  borderBottom: "1px solid #e9ecef",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const bodyStyle = {
  padding: "16px 20px",
};

const footerStyle = {
  padding: "12px 20px",
  borderTop: "1px solid #e9ecef",
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
};

function RoleForm({ show = false, initial = null, onSubmit, onCancel }) {
  const [code, setCode] = useState(initial?.code || "");
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [status, setStatus] = useState(initial?.status ?? 1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCode(initial?.code || "");
    setName(initial?.name || "");
    setDescription(initial?.description || "");
    setStatus(initial?.status ?? 1);
  }, [initial, show]);

  useEffect(() => {
    // Evitar scroll del body mientras el modal está abierto
    if (show) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [show]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ code, name, description, status });
    } catch (err) {
      // onSubmit puede lanzar; lo dejamos propagar o manejar en RolesPage
      console.error("RoleForm submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    // cerrar solo si se clickea el backdrop (no el dialog)
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div style={backdropStyle} onMouseDown={handleBackdropClick} role="dialog" aria-modal="true">
      <div style={dialogStyle} onMouseDown={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h5 style={{ margin: 0 }}>{initial ? "Editar Rol" : "Nuevo Rol"}</h5>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar"
            style={{
              border: "none",
              background: "transparent",
              fontSize: 18,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={bodyStyle}>
            <div className="mb-3">
              <label className="form-label">Código</label>
              <input
                className="form-control"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={!!initial}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Nombre</label>
              <input
                className="form-control"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-control"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="mb-0">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(Number(e.target.value))}
              >
                <option value={1}>Activo</option>
                <option value={0}>Inactivo</option>
              </select>
            </div>
          </div>

          <div style={footerStyle}>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Guardando..." : initial ? "Guardar cambios" : "Crear rol"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RoleForm;
