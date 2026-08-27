const API_URL = import.meta.env.VITE_API_URL

const procesarRespuesta = async (response) => {
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(
      data?.detail || 'Error autenticando usuario SUPER'
    )

    error.status = response.status

    throw error
  }

  return data
}


// ============================================================
// LOGIN SUPER
//
// Utiliza el MISMO endpoint de login que el usuario normal.
// La diferencia está en super_mode=true y el código MFA.
// ============================================================

export const loginSuper = async (
  email,
  password,
  otp,
  tenant,
) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: email,
      password,
      tenant,
      super_mode: true,
      otp,
    }),
  })

  return procesarRespuesta(response)
}


// ============================================================
// BOOTSTRAP SUPER
//
// Se mantiene separado porque no es un login.
// ============================================================

export const bootstrapSuper = async (
  email,
  password,
  secret,
) => {
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
