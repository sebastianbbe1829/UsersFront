import { useNavigate } from 'react-router-dom'
import CashPage from './CashPage'
import { obtenerTenantDesdeUrl } from '../utils/tenant'

export default function CashPageGuard() {
  const navigate = useNavigate()

  const volverWelcome = () => {
    const tenant = obtenerTenantDesdeUrl()
    navigate(tenant ? `/${encodeURIComponent(tenant)}/welcome` : '/welcome')
  }

  return (
    <>
      <div className="container-fluid pt-3">
        <button type="button" className="btn btn-sm btn-link text-decoration-none p-0" onClick={volverWelcome}>
          ← Volver
        </button>
      </div>
      <CashPage />
    </>
  )
}
