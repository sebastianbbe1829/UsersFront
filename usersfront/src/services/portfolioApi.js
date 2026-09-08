const API_URL = import.meta.env.VITE_API_URL

const procesarRespuesta = async (response) => {
  const resultado = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(resultado?.detail || 'Ocurrió un error en cartera.')
    error.status = response.status
    throw error
  }
  return resultado
}

const headers = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  Authorization: `Bearer ${token}`,
})

export const obtenerCupoCliente = async (clientId, token) => procesarRespuesta(await fetch(
  `${API_URL}/portfolio/clients/${encodeURIComponent(clientId)}/credit-limit`,
  { headers: headers(token) },
))

export const actualizarCupoCliente = async (clientId, approvedLimit, token) => procesarRespuesta(await fetch(
  `${API_URL}/portfolio/clients/${encodeURIComponent(clientId)}/credit-limit`,
  {
    method: 'PUT',
    headers: headers(token, true),
    body: JSON.stringify({ approved_limit: approvedLimit }),
  },
))

export const obtenerObligaciones = async (token, clientId = null) => {
  const query = clientId ? `?client_id=${encodeURIComponent(clientId)}` : ''
  return procesarRespuesta(await fetch(`${API_URL}/portfolio/obligations${query}`, { headers: headers(token) }))
}

export const obtenerObligacionesCliente = async (clientId, token) => procesarRespuesta(await fetch(
  `${API_URL}/portfolio/clients/${encodeURIComponent(clientId)}/obligations`,
  { headers: headers(token) },
))

export const obtenerPagosCartera = async (token, clientId = null) => {
  const query = clientId ? `?client_id=${encodeURIComponent(clientId)}` : ''
  return procesarRespuesta(await fetch(`${API_URL}/portfolio/payments${query}`, { headers: headers(token) }))
}

export const registrarPagoCartera = async (datos, token) => procesarRespuesta(await fetch(
  `${API_URL}/portfolio/payments`,
  {
    method: 'POST',
    headers: headers(token, true),
    body: JSON.stringify(datos),
  },
))
