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

export const solicitarOtpActivacion = async (dni, token) => {
  const response = await fetch(
    `${API_URL}/users/activate/${encodeURIComponent(dni)}/${encodeURIComponent(token)}/otp`,
    { method: 'POST' }
  )

  return procesarRespuesta(response)
}

export const validarOtpActivacion = async (dni, token, code) => {
  const response = await fetch(
    `${API_URL}/users/activate/${encodeURIComponent(dni)}/${encodeURIComponent(token)}/otp/validate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }
  )

  return procesarRespuesta(response)
}
