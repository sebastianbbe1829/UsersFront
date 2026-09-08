const procesarRespuesta = async (response) => {
  const resultado = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(resultado?.detail || 'Ocurrió un error al procesar la venta.')
    error.status = response.status
    throw error
  }
  return resultado
}

const headers = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
})

export const crearVenta = async (datos, token) => procesarRespuesta(await fetch(
  '/sales',
  { method: 'POST', headers: headers(token), body: JSON.stringify(datos) },
))

export const obtenerVentas = async (token, { limit = 100, offset = 0 } = {}) => procesarRespuesta(await fetch(
  `/sales?limit=${limit}&offset=${offset}`,
  { headers: { Authorization: `Bearer ${token}` } },
))

export const obtenerVenta = async (saleId, token) => procesarRespuesta(await fetch(
  `/sales/${saleId}`,
  { headers: { Authorization: `Bearer ${token}` } },
))

export const enviarFacturaPorCorreo = async (saleId, token) => procesarRespuesta(await fetch(
  `/sales/${saleId}/invoice/email`,
  { method: 'POST', headers: headers(token) },
))
