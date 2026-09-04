const API_URL = import.meta.env.VITE_API_URL

const procesarRespuesta = async (response) => {
  const resultado = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(resultado?.detail || 'Ocurrió un error inesperado.')
    error.status = response.status
    throw error
  }

  return resultado
}

const headersAutenticacion = (token) => ({
  Authorization: `Bearer ${token}`,
})

export const obtenerGlobalSupers = async (token) => {
  const response = await fetch(`${API_URL}/global-users/supers`, {
    method: 'GET',
    headers: headersAutenticacion(token),
  })
  return procesarRespuesta(response)
}

export const obtenerGlobalSuper = async (superId, token) => {
  const response = await fetch(`${API_URL}/global-users/supers/${superId}`, {
    method: 'GET',
    headers: headersAutenticacion(token),
  })
  return procesarRespuesta(response)
}

export const obtenerGlobalSuperMfaProvisioning = async (superId, token) => {
  const response = await fetch(`${API_URL}/global-users/supers/${superId}/mfa-provisioning`, {
    method: 'GET',
    headers: headersAutenticacion(token),
  })
  return procesarRespuesta(response)
}

export const crearGlobalSuper = async (datos, otp, token) => {
  const response = await fetch(`${API_URL}/global-users/supers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headersAutenticacion(token),
      'X-Super-MFA-OTP': otp,
    },
    body: JSON.stringify(datos),
  })
  return procesarRespuesta(response)
}

export const actualizarGlobalSuper = async (superId, datos, otp, token) => {
  const response = await fetch(`${API_URL}/global-users/supers/${superId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...headersAutenticacion(token),
      'X-Super-MFA-OTP': otp,
    },
    body: JSON.stringify(datos),
  })
  return procesarRespuesta(response)
}
