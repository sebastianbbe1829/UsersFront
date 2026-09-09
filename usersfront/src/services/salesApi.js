const API_URL = import.meta.env.VITE_API_URL

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

const normalizarPayloadVenta = (datos) => ({
  ...datos,
  payments: Array.isArray(datos?.payments)
    ? datos.payments.map((payment) => ({
        ...payment,
        payment_method: payment.payment_method === 'CREDITO'
          ? 'CARTERA'
          : payment.payment_method,
      }))
    : datos?.payments,
})

export const crearVenta = async (datos, token) => procesarRespuesta(await fetch(
  `${API_URL}/sales`,
  { method: 'POST', headers: headers(token), body: JSON.stringify(normalizarPayloadVenta(datos)) },
))

export const crearVentaAutoconsumo = async (datos, token) => procesarRespuesta(await fetch(
  `${API_URL}/sales/autoconsumption`,
  { method: 'POST', headers: headers(token), body: JSON.stringify(normalizarPayloadVenta(datos)) },
))

export const obtenerVentas = async (token, { limit = 100, offset = 0 } = {}) => procesarRespuesta(await fetch(
  `${API_URL}/sales?limit=${limit}&offset=${offset}`,
  { headers: { Authorization: `Bearer ${token}` } },
))

export const obtenerVenta = async (saleId, token) => procesarRespuesta(await fetch(
  `${API_URL}/sales/${saleId}`,
  { headers: { Authorization: `Bearer ${token}` } },
))

export const enviarFacturaPorCorreo = async (saleId, token) => procesarRespuesta(await fetch(
  `${API_URL}/sales/${saleId}/invoice/email`,
  { method: 'POST', headers: headers(token) },
))

export const congelarVenta = async (datos, token) => procesarRespuesta(await fetch(
  `${API_URL}/sales/drafts`,
  { method: 'POST', headers: headers(token), body: JSON.stringify(datos) },
))

export const congelarVentaAutoconsumo = async (datos, token) => procesarRespuesta(await fetch(
  `${API_URL}/sales/drafts/autoconsumption`,
  { method: 'POST', headers: headers(token), body: JSON.stringify(datos) },
))

export const obtenerVentasCongeladas = async (token) => procesarRespuesta(await fetch(
  `${API_URL}/sales/drafts`,
  { headers: { Authorization: `Bearer ${token}` } },
))

export const eliminarVentaCongelada = async (draftId, token) => {
  const response = await fetch(`${API_URL}/sales/drafts/${draftId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) return procesarRespuesta(response)
  return null
}
