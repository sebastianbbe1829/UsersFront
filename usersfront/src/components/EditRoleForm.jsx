import { useEffect, useState } from "react";

function EditRoleForm({ show = false, role = null, onSubmit, onCancel }) {
  const [code, setCode] = useState(role?.code || "");
  const [name, setName] = useState(role?.name || "");
  const [description, setDescription] = useState(role?.description || "");
  const [status, setStatus] = useState(role?.status ?? 1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCode(role?.code || "");
    setName(role?.name || "");
    setDescription(role?.description || "");
    setStatus(role?.status ?? 1);
  }, [role, show]);

  useEffect(() => {
    if (show) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [show]);

  if (!show || !role) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ code, name, description, status });
    } catch (err) {
      console.error("EditRoleForm submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-md modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Editar Rol</h5>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCancel}></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Código</label>
                  <input
                    type="text"
                    className="form-control"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    disabled
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
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

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal-backdrop show"></div>
    </>
  );
}

export default EditRoleForm;
