// src/components/DeleteRoleModal.jsx
import { useState, useEffect } from "react";

function DeleteRoleModal({ role, show = false, onConfirm, onCancel }) {
  const [submitting, setSubmitting] = useState(false);

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

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(role);
    } catch (err) {
      console.error("Error al eliminar rol:", err);
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
              <h5 className="modal-title">Eliminar Rol</h5>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCancel}></button>
            </div>

            <div className="modal-body">
              <div className="d-flex gap-3 align-items-start">
                <div>
                  <div
                    className="rounded-circle bg-warning d-flex align-items-center justify-content-center"
                    style={{ width: 44, height: 44 }}
                    aria-hidden="true"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-exclamation-triangle" viewBox="0 0 16 16">
                      <path d="M7.938 2.016a.13.13 0 0 1 .125 0l6.857 3.95c.11.063.18.18.18.308v7.86c0 .128-.07.245-.18.308l-6.857 3.95a.13.13 0 0 1-.125 0L1.08 14.442A.31.31 0 0 1 .9 14.134V6.274c0-.128.07-.245.18-.308L7.938 2.016zM8 5.5c-.535 0-.954.462-.9.995l.35 3.507c.05.5.48.898.95.898s.9-.398.95-.898l.35-3.507A.905.905 0 0 0 8 5.5zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
                    </svg>
                  </div>
                </div>

                <div className="flex-grow-1">
                  <p className="mb-2 fw-semibold">¿Estás seguro de que deseas eliminar este rol?</p>

                  <ul className="list-unstyled small mb-0">
                    <li><strong>Código:</strong> <span className="text-monospace">{role.code}</span></li>
                    <li><strong>Nombre:</strong> {role.name}</li>
                    {role.description && <li><strong>Descripción:</strong> {role.description}</li>}
                  </ul>

                  <p className="mt-3 text-muted small">
                    Importante: esta acción no se puede deshacer. Si el rol está asignado a usuarios, la eliminación puede afectar accesos.
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={submitting}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? "Eliminando..." : "Sí, eliminar rol"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* backdrop de Bootstrap */}
      <div className="modal-backdrop show"></div>
    </>
  );
}

export default DeleteRoleModal;
