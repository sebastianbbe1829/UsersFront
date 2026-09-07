import { useState } from 'react'
import { levantarRestriccionCliente } from '../services/clientsApi'

function ClientComplianceOverrideModal({ cliente, token, onClose, onSuccess, onSessionExpired }) {
  const [reason, setReason] = useState('')
  const [otp, setOtp] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  if (!cliente) return null

  const confirmar = async (event) => {
    event.preventDefault()
    try {
      setGuardando(true)
      setError(null)
      const resultado = await levantarRestriccionCliente(cliente.id, { reason: reason.trim(), otp: otp.trim() }, token)
      onSuccess(resultado)
    } catch (err) {
      if (err.status === 401 && onSessionExpired) return onSessionExpired()
      setError(err.message || 'No fue posible levantar la restricción.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,.5)', position: 'fixed', inset: 0, zIndex: 2100 }} role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Levantar restricción de compliance</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={guardando} aria-label="Cerrar" />
          </div>
          <form onSubmit={confirmar}>
            <div className="modal-body">
              <div className="alert alert-danger">
                <strong>Cliente bloqueado.</strong> Esta operación constituye una excepción de compliance y quedará auditada.
              </div>
              <p className="mb-3"><strong>{cliente.full_name}</strong> — {cliente.identification_number}</p>
              {cliente.list_type && <p className="text-muted small">Lista: {cliente.list_type}</p>}
              {error && <div className="alert alert-danger" role="alert">{error}</div>}
              <div className="mb-3">
                <label className="form-label fw-semibold">Justificación</label>
                <textarea className="form-control" rows="4" minLength="10" maxLength="2000" required value={reason} onChange={(event) => setReason(event.target.value)} disabled={guardando} placeholder="Indique la autorización y motivo de la excepción..." />
              </div>
              <div className="mb-1">
                <label className="form-label fw-semibold">Código MFA</label>
                <input className="form-control" inputMode="numeric" autoComplete="one-time-code" minLength="6" maxLength="8" required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} disabled={guardando} placeholder="Código de tu autenticador" />
              </div>
              <small className="text-muted">Se validará el MFA de la sesión SUPER actual. El MATCH histórico no será eliminado.</small>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
              <button type="submit" className="btn btn-danger" disabled={guardando || reason.trim().length < 10 || otp.length < 6}>{guardando ? 'Validando MFA...' : 'Confirmar liberación'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ClientComplianceOverrideModal
