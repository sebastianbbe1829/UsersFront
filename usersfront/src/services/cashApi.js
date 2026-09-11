const API_URL = import.meta.env.VITE_API_URL

const procesarRespuesta = async (response) => {
  const resultado = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = resultado?.detail
    const message = typeof detail === 'object' ? detail.message : detail
    const error = new Error(message || 'Ocurrió un error en caja.')
    error.status = response.status
    error.code = typeof detail === 'object' ? detail.code : undefined
    throw error
  }
  return resultado
}

const headers = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  Authorization: `Bearer ${token}`,
})

const procesarArchivo = async (response) => {
  if (!response.ok) {
    const resultado = await response.json().catch(() => null)
    const detail = resultado?.detail
    const message = typeof detail === 'object' ? detail.message : detail
    const error = new Error(message || 'No fue posible generar el reporte de Caja.')
    error.status = response.status
    error.code = typeof detail === 'object' ? detail.code : undefined
    throw error
  }
  return response.blob()
}

export const obtenerContextoCaja = async (token) => procesarRespuesta(
  await fetch(`${API_URL}/cash/my-context`, { headers: headers(token) }),
)

export const obtenerDiaActual = async (token) => procesarRespuesta(
  await fetch(`${API_URL}/cash/days/current`, { headers: headers(token) }),
)

export const iniciarDia = async (token, businessDate) => procesarRespuesta(await fetch(
  `${API_URL}/cash/days/start`,
  {
    method: 'POST',
    headers: headers(token, true),
    body: JSON.stringify({ business_date: businessDate }),
  },
))

export const cerrarCajaDelDia = async (registerId, datos, token) => procesarRespuesta(await fetch(
  `${API_URL}/cash/days/registers/${encodeURIComponent(registerId)}/close`,
  {
    method: 'POST',
    headers: headers(token, true),
    body: JSON.stringify(datos),
  },
))

export const cerrarSucursalDelDia = async (branchId, token) => procesarRespuesta(await fetch(
  `${API_URL}/cash/days/branches/${encodeURIComponent(branchId)}/close`,
  {
    method: 'POST',
    headers: headers(token),
  },
))

export const cerrarDia = async (closingNotes, token) => procesarRespuesta(await fetch(
  `${API_URL}/cash/days/close`,
  {
    method: 'POST',
    headers: headers(token, true),
    body: JSON.stringify({ closing_notes: closingNotes || null }),
  },
))

export const descargarReporteDia = async (dayId, format, token) => procesarArchivo(await fetch(
  `${API_URL}/cash/days/${encodeURIComponent(dayId)}/report/${encodeURIComponent(format)}`,
  { headers: headers(token) },
))

export const descargarReporteDiaActual = async (format, token) => procesarArchivo(await fetch(
  `${API_URL}/cash/days/current/report/${encodeURIComponent(format)}`,
  { headers: headers(token) },
))

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
