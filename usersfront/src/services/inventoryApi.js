const API_URL = import.meta.env.VITE_API_URL

const procesarRespuesta = async (response) => {
  const resultado = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(resultado?.detail || 'Ocurrió un error al consultar inventarios.')
    error.status = response.status
    throw error
  }
  return resultado
}

const headers = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  Authorization: `Bearer ${token}`,
})

const request = async (url, token, options = {}) => procesarRespuesta(
  await fetch(url, {
    ...options,
    headers: {
      ...headers(token, options.body !== undefined),
      ...(options.headers || {}),
    },
  }),
)

export const obtenerTiposInventario = (token, activeOnly = false) => {
  const query = activeOnly ? '?active_only=true' : ''
  return request(`${API_URL}/inventory/types${query}`, token)
}

export const crearTipoInventario = (datos, token) => request(
  `${API_URL}/inventory/types`, token, { method: 'POST', body: JSON.stringify(datos) },
)

export const actualizarTipoInventario = (id, datos, token) => request(
  `${API_URL}/inventory/types/${encodeURIComponent(id)}`, token,
  { method: 'PATCH', body: JSON.stringify(datos) },
)

export const obtenerProductosInventario = (token, activeOnly = false) => {
  const query = activeOnly ? '?active_only=true' : ''
  return request(`${API_URL}/inventory/products${query}`, token)
}

export const crearProductoInventario = (datos, token) => request(
  `${API_URL}/inventory/products`, token, { method: 'POST', body: JSON.stringify(datos) },
)

export const actualizarProductoInventario = (id, datos, token) => request(
  `${API_URL}/inventory/products/${encodeURIComponent(id)}`, token,
  { method: 'PATCH', body: JSON.stringify(datos) },
)

export const obtenerInventario = (token) => request(`${API_URL}/inventory`, token)

export const crearMovimientoInventario = (datos, token) => request(
  `${API_URL}/inventory/movements`, token, { method: 'POST', body: JSON.stringify(datos) },
)

export const obtenerMovimientosInventario = (productId, token, { limit = 100, offset = 0 } = {}) => {
  const params = new URLSearchParams({ product_id: String(productId), limit: String(limit), offset: String(offset) })
  return request(`${API_URL}/inventory/movements?${params.toString()}`, token)
}

export const devolverMovimientoInventario = (movementId, token, quantity = null) => {
  const query = quantity == null ? '' : `?quantity=${encodeURIComponent(quantity)}`
  return request(`${API_URL}/inventory/movements/${encodeURIComponent(movementId)}/reverse${query}`, token, { method: 'POST' })
}
