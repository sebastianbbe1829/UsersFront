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

export const solicitarRecuperacionPassword = async (tenant, email) => {
  const response = await fetch(
    `${API_URL}/auth/password-recovery/${encodeURIComponent(tenant)}/request`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }
  )

  return procesarRespuesta(response)
}

export const restablecerPassword = async (
  tenant,
  email,
  code,
  newPassword
) => {
  const response = await fetch(
    `${API_URL}/auth/password-recovery/${encodeURIComponent(tenant)}/reset`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        code,
        new_password: newPassword,
      }),
    }
  )

  return procesarRespuesta(response)
}
