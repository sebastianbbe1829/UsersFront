const API_URL = import.meta.env.VITE_API_URL

const procesarRespuesta = async (response) => {
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail || 'Error autenticando usuario SUPER')
  }

  return data
}

export const loginSuper = async (
  email,
  password,
  otp,
  tenant,
) => {
  const response = await fetch(`${API_URL}/auth/super/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      otp,
      tenant,
    }),
  })

  return procesarRespuesta(response)
}

export const bootstrapSuper = async (email, password, secret) => {
  const response = await fetch(`${API_URL}/auth/super/bootstrap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SUPER-BOOTSTRAP-SECRET': secret,
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  return procesarRespuesta(response)
}
