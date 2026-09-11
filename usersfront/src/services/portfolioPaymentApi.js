const API_URL = import.meta.env.VITE_API_URL

const procesarRespuesta = async (response) => {
  const resultado = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(resultado?.detail?.message || resultado?.detail || 'Ocurrió un error en pagos de cartera.')
    error.status = response.status
    throw error
  }
  return resultado
}

const headers = (token) => ({ Authorization: `Bearer ${token}` })

export const buscarClientesParaPago = async (token, { search = '', limit = 100, offset = 0 } = {}) => {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  if (search.trim()) params.set('search', search.trim())
  return procesarRespuesta(await fetch(
    `${API_URL}/portfolio/payments/clients?${params.toString()}`,
    { headers: headers(token) },
  ))
}

export const obtenerObligacionesParaPago = async (clientId, token) => procesarRespuesta(await fetch(
  `${API_URL}/portfolio/payments/clients/${encodeURIComponent(clientId)}/obligations`,
  { headers: headers(token) },
))
