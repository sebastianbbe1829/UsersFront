const API_URL = import.meta.env.VITE_API_URL

const procesarRespuesta = async (response) => {
  const resultado = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(
      resultado?.detail || 'Ocurrió un error inesperado.'
    )
    error.status = response.status
    throw error
  }

  return resultado
}

const headersAutenticacion = (token) => ({
  Authorization: `Bearer ${token}`,
})

export const obtenerTodosLosTenants = async (token) => {
  const response = await fetch(`${API_URL}/tenants/admin`, {
    method: 'GET',
    headers: headersAutenticacion(token),
  })

  return procesarRespuesta(response)
}

export const obtenerTenantAdministrado = async (tenantId, token) => {
  const response = await fetch(`${API_URL}/tenants/admin/${tenantId}`, {
    method: 'GET',
    headers: headersAutenticacion(token),
  })

  return procesarRespuesta(response)
}

export const crearTenantComoSuper = async (datos, otp, token) => {
  const response = await fetch(`${API_URL}/tenants/admin/provision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Super-MFA-OTP': otp,
    },
    body: JSON.stringify(datos),
  })

  return procesarRespuesta(response)
}

export const actualizarTenantComoSuper = async (
  tenantId,
  datos,
  otp,
  token
) => {
  const response = await fetch(`${API_URL}/tenants/admin/${tenantId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Super-MFA-OTP': otp,
    },
    body: JSON.stringify(datos),
  })

  return procesarRespuesta(response)
}
