import { useState } from 'react'

function SuperMfaModal({ onConfirmar, onCancelar, guardando = false }) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')

  const enviar = async (event) => {
    event.preventDefault()

    if (!/^\d{6}$/.test(otp)) {
      setError('Ingresa un código OTP válido de 6 dígitos.')
      return
    }

    try {
      setError('')
      await onConfirmar(otp)
    } catch (err) {
      setError(err.message || 'No fue posible completar la operación.')
    }
  }

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', position: 'fixed', inset: 0, zIndex: 2100, overflow: 'hidden' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '430px', width: 'calc(100% - 2rem)', margin: '1rem auto' }}>
        <div className="modal-content">
          <div className="modal-header py-2 px-3">
            <h5 className="modal-title mb-0">Verificación SUPER</h5>
            <button type="button" className="btn-close" onClick={onCancelar} disabled={guardando} />
          </div>

          <form onSubmit={enviar} autoComplete="off">
            <div className="modal-body py-3 px-3">
              <p className="mb-3">Para confirmar esta operación administrativa ingresa el código OTP de tu autenticador.</p>

              {error && <div className="alert alert-danger py-2">❌ {error}</div>}

              <label className="form-label fw-semibold">Código OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
                className="form-control text-center fs-4"
                value={otp}
                onChange={(event) => {
                  setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                  setError('')
                }}
                autoFocus
                disabled={guardando}
                placeholder="000000"
              />
            </div>

            <div className="modal-footer py-2 px-3">
              <button type="button" className="btn btn-secondary" onClick={onCancelar} disabled={guardando}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? <><span className="spinner-border spinner-border-sm me-2" />Verificando...</> : 'Confirmar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SuperMfaModal
