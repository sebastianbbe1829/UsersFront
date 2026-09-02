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

export const obtenerConfigTenantComoSuper = async (tenantId, token) => {
  const response = await fetch(
    `${API_URL}/tenant-config/admin/${tenantId}`,
    {
      method: 'GET',
      headers: headersAutenticacion(token),
    }
  )

  return procesarRespuesta(response)
}

export const actualizarConfigTenantComoSuper = async (
  tenantId,
  datos,
  otp,
  token
) => {
  const response = await fetch(
    `${API_URL}/tenant-config/admin/${tenantId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Super-MFA-OTP': otp,
      },
      body: JSON.stringify(datos),
    }
  )

  return procesarRespuesta(response)
}
