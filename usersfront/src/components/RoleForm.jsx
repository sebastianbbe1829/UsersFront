import { useState } from 'react'

function RoleForm({ rol, onGuardar, onCancelar, guardando = false, error = '' }) {
  const [formulario, setFormulario] = useState(() => ({
    code: rol?.code ?? '',
    name: rol?.name ?? '',
    description: rol?.description ?? '',
    status: rol?.status ?? 1,
  }))

  const cambiarCampo = (campo, valor) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  const guardar = (event) => {
    event.preventDefault()
    const datos = {
      code: formulario.code.trim(),
      name: formulario.name.trim(),
      description: formulario.description.trim() || null,
    }
    if (rol) datos.status = Number(formulario.status)
    onGuardar(datos)
  }

  return (
    <div className="modal d-block" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 2000, overflowY: 'auto' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '600px', width: 'calc(100% - 2rem)', margin: '1rem auto' }}>
        <div className="modal-content" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
          <div className="modal-header py-2 px-3">
            <div>
              <h5 className="modal-title fw-bold mb-0">{rol ? 'Editar rol' : 'Nuevo rol'}</h5>
              <small className="text-muted">{rol ? 'Actualiza la información del rol' : 'Ingresa la información del nuevo rol'}</small>
            </div>
            <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCancelar} disabled={guardando} />
          </div>

          <form onSubmit={guardar} autoComplete="off">
            <div className="modal-body py-3 px-3" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 150px)' }}>
              {error && (
                <div className="alert alert-danger py-2 mb-3" role="alert">
                  <div className="d-flex align-items-start">
                    <div className="me-2" style={{ fontSize: '1.1rem' }}>⚠️</div>
                    <div>{error}</div>
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-semibold mb-1">Código</label>
                <input type="text" className="form-control" value={formulario.code} onChange={(event) => cambiarCampo('code', event.target.value)} placeholder="Ej. ADMIN" maxLength={50} required disabled={guardando} />
                <div className="form-text">Identificador único del rol.</div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold mb-1">Nombre</label>
                <input type="text" className="form-control" value={formulario.name} onChange={(event) => cambiarCampo('name', event.target.value)} placeholder="Ej. Administrador" maxLength={100} required disabled={guardando} />
              </div>

              {rol && (
                <div className="mb-3">
                  <label className="form-label fw-semibold mb-1">Estado</label>
                  <select className="form-select" value={formulario.status} onChange={(event) => cambiarCampo('status', event.target.value)} disabled={guardando}>
                    <option value="1">Activo</option>
                    <option value="0">Inactivo</option>
                  </select>
                </div>
              )}

              <div className="mb-0">
                <label className="form-label fw-semibold mb-1">Descripción</label>
                <textarea className="form-control" rows="4" value={formulario.description} onChange={(event) => cambiarCampo('description', event.target.value)} placeholder="Descripción del rol..." maxLength={500} disabled={guardando} />
                <div className="form-text">Máximo 500 caracteres.</div>
              </div>
            </div>

            <div className="modal-footer py-2 px-3">
              <button type="button" className="btn btn-secondary" onClick={onCancelar} disabled={guardando}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />{rol ? 'Guardando...' : 'Creando...'}</>
                ) : (rol ? 'Guardar cambios' : 'Crear rol')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RoleForm