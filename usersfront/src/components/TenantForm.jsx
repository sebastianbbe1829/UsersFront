import { useState } from 'react'

const FORMULARIO_INICIAL = {
  tenant_name: '',
  tenant_slug: '',
  admin_dni: '',
  admin_name: '',
  admin_email: '',
  admin_password: '',
  admin_phone: '',
}

function TenantForm({ onContinuar, onCancelar, guardando = false }) {
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormulario((actual) => ({ ...actual, [name]: value }))
    setError('')
  }

  const enviar = (event) => {
    event.preventDefault()

    if (!formulario.tenant_name.trim() || !formulario.tenant_slug.trim()) {
      setError('El nombre y el slug del tenant son obligatorios.')
      return
    }

    onContinuar(formulario)
  }

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', position: 'fixed', inset: 0, zIndex: 2000, overflow: 'hidden' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '650px', width: 'calc(100% - 2rem)', margin: '1rem auto' }}>
        <div className="modal-content" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
          <div className="modal-header py-2 px-3">
            <h5 className="modal-title mb-0">Nuevo tenant</h5>
            <button type="button" className="btn-close" onClick={onCancelar} disabled={guardando} />
          </div>

          <form onSubmit={enviar} autoComplete="off">
            <div className="modal-body py-3 px-3" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 150px)' }}>
              {error && <div className="alert alert-danger py-2">❌ {error}</div>}

              <h6 className="fw-bold mb-3">Datos del tenant</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-8">
                  <label className="form-label mb-1">Nombre</label>
                  <input name="tenant_name" className="form-control" value={formulario.tenant_name} onChange={handleChange} minLength="2" maxLength="150" required disabled={guardando} />
                </div>
                <div className="col-md-4">
                  <label className="form-label mb-1">Slug</label>
                  <input name="tenant_slug" className="form-control" value={formulario.tenant_slug} onChange={handleChange} minLength="2" maxLength="100" required disabled={guardando} />
                </div>
              </div>

              <h6 className="fw-bold mb-3">Administrador inicial</h6>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label mb-1">DNI</label>
                  <input name="admin_dni" className="form-control" value={formulario.admin_dni} onChange={handleChange} minLength="5" maxLength="20" required disabled={guardando} />
                </div>
                <div className="col-md-8">
                  <label className="form-label mb-1">Nombre</label>
                  <input name="admin_name" className="form-control" value={formulario.admin_name} onChange={handleChange} minLength="2" maxLength="100" required disabled={guardando} />
                </div>
                <div className="col-md-6">
                  <label className="form-label mb-1">Correo</label>
                  <input type="email" name="admin_email" className="form-control" value={formulario.admin_email} onChange={handleChange} required disabled={guardando} />
                </div>
                <div className="col-md-6">
                  <label className="form-label mb-1">Teléfono</label>
                  <input name="admin_phone" className="form-control" value={formulario.admin_phone} onChange={handleChange} minLength="7" maxLength="20" disabled={guardando} />
                </div>
                <div className="col-md-6">
                  <label className="form-label mb-1">Contraseña inicial</label>
                  <input type="password" name="admin_password" className="form-control" value={formulario.admin_password} onChange={handleChange} minLength="6" required disabled={guardando} autoComplete="new-password" />
                </div>
              </div>
            </div>

            <div className="modal-footer py-2 px-3">
              <button type="button" className="btn btn-secondary" onClick={onCancelar} disabled={guardando}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? <><span className="spinner-border spinner-border-sm me-2" />Procesando...</> : 'Crear tenant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TenantForm
