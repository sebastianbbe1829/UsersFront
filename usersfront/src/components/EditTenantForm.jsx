import { useState } from 'react'

function EditTenantForm({ tenant, onContinuar, onCancelar, guardando = false }) {
  const [formulario, setFormulario] = useState({
    name: tenant?.name || '',
    slug: tenant?.slug || '',
    status: tenant?.status ?? 1,
  })
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormulario((actual) => ({
      ...actual,
      [name]: name === 'status' ? Number(value) : value,
    }))
    setError('')
  }

  const enviar = (event) => {
    event.preventDefault()

    if (!formulario.name.trim() || !formulario.slug.trim()) {
      setError('El nombre y el slug del tenant son obligatorios.')
      return
    }

    onContinuar(formulario)
  }

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', position: 'fixed', inset: 0, zIndex: 2000, overflow: 'hidden' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '550px', width: 'calc(100% - 2rem)', margin: '1rem auto' }}>
        <div className="modal-content">
          <div className="modal-header py-2 px-3">
            <div>
              <h5 className="modal-title mb-0">Editar tenant</h5>
              <small className="text-muted">Tenant #{tenant?.id}</small>
            </div>
            <button type="button" className="btn-close" onClick={onCancelar} disabled={guardando} />
          </div>

          <form onSubmit={enviar} autoComplete="off">
            <div className="modal-body py-3 px-3">
              {error && <div className="alert alert-danger py-2">❌ {error}</div>}

              <div className="mb-3">
                <label className="form-label mb-1">Nombre</label>
                <input name="name" className="form-control" value={formulario.name} onChange={handleChange} minLength="2" maxLength="150" required disabled={guardando} />
              </div>

              <div className="mb-3">
                <label className="form-label mb-1">Slug</label>
                <input name="slug" className="form-control" value={formulario.slug} onChange={handleChange} minLength="2" maxLength="100" required disabled={guardando} />
              </div>

              <div className="mb-0">
                <label className="form-label mb-1">Estado</label>
                <select name="status" className="form-select" value={formulario.status} onChange={handleChange} disabled={guardando}>
                  <option value={1}>Activo</option>
                  <option value={0}>Inactivo</option>
                </select>
              </div>
            </div>

            <div className="modal-footer py-2 px-3">
              <button type="button" className="btn btn-secondary" onClick={onCancelar} disabled={guardando}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? <><span className="spinner-border spinner-border-sm me-2" />Procesando...</> : 'Actualizar tenant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditTenantForm
