const API_URL = import.meta.env.VITE_API_URL

const procesarRespuesta = async (response) => {
  const resultado = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = resultado?.detail
    const message = typeof detail === 'object' ? detail.message : detail
    const error = new Error(message || 'No fue posible completar la operación de Caja.')
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

const request = async (path, token, options = {}) => procesarRespuesta(await fetch(`${API_URL}${path}`, {
  ...options,
  headers: { ...headers(token, Boolean(options.body)), ...(options.headers || {}) },
}))

export const obtenerSucursalesCaja = (token) => request('/cash/config/branches', token)

export const crearSucursalCaja = (datos, token) => request('/cash/config/branches', token, {
  method: 'POST',
  body: JSON.stringify(datos),
})

export const actualizarSucursalCaja = (id, datos, token) => request(`/cash/config/branches/${encodeURIComponent(id)}`, token, {
  method: 'PATCH',
  body: JSON.stringify(datos),
})

export const obtenerCajasFisicas = (token, branchId = null) => {
  const query = branchId ? `?branch_id=${encodeURIComponent(branchId)}` : ''
  return request(`/cash/config/boxes${query}`, token)
}

export const crearCajaFisica = (datos, token) => request('/cash/config/boxes', token, {
  method: 'POST',
  body: JSON.stringify(datos),
})

export const actualizarCajaFisica = (id, datos, token) => request(`/cash/config/boxes/${encodeURIComponent(id)}`, token, {
  method: 'PATCH',
  body: JSON.stringify(datos),
})

export const obtenerAsignacionesCaja = (token) => request('/cash/config/assignments', token)

export const crearAsignacionCaja = (datos, token) => request('/cash/config/assignments', token, {
  method: 'POST',
  body: JSON.stringify(datos),
})

export const desasignarCajaUsuario = (id, token) => request(`/cash/config/assignments/${encodeURIComponent(id)}`, token, {
  method: 'DELETE',
})
