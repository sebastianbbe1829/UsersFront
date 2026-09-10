const API_URL = import.meta.env.VITE_API_URL

const procesarRespuesta = async (response) => {
  const resultado = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(resultado?.detail || 'Ocurrió un error en caja.')
    error.status = response.status
    throw error
  }
  return resultado
}

const headers = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  Authorization: `Bearer ${token}`,
})

export const obtenerCajaActual = async (token) => {
  const response = await fetch(`${API_URL}/cash/registers/current`, { headers: headers(token) })
  if (response.status === 404) return null
  return procesarRespuesta(response)
}

export const obtenerCajas = async (token) => procesarRespuesta(
  await fetch(`${API_URL}/cash/registers`, { headers: headers(token) }),
)

export const abrirCaja = async (openingAmount, token) => procesarRespuesta(await fetch(
  `${API_URL}/cash/registers/open`,
  {
    method: 'POST',
    headers: headers(token, true),
    body: JSON.stringify({ opening_amount: openingAmount }),
  },
))

export const obtenerResumenCaja = async (registerId, token) => procesarRespuesta(await fetch(
  `${API_URL}/cash/registers/${encodeURIComponent(registerId)}/summary`,
  { headers: headers(token) },
))

export const registrarMovimientoCaja = async (registerId, datos, token) => procesarRespuesta(await fetch(
  `${API_URL}/cash/registers/${encodeURIComponent(registerId)}/movements`,
  {
    method: 'POST',
    headers: headers(token, true),
    body: JSON.stringify(datos),
  },
))

export const cerrarCaja = async (registerId, datos, token) => procesarRespuesta(await fetch(
  `${API_URL}/cash/registers/${encodeURIComponent(registerId)}/close`,
  {
    method: 'POST',
    headers: headers(token, true),
    body: JSON.stringify(datos),
  },
))
