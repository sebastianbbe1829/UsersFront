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

const procesarRespuestaArchivo = async (response) => {
  if (!response.ok) {
    const resultado = await response.json().catch(() => null)
    const error = new Error(resultado?.detail || 'No fue posible generar el archivo.')
    error.status = response.status
    throw error
  }
  return response.blob()
}

const headers = (token, json = false) => ({ ...(json ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${token}` })
const request = async (url, token, options = {}) => procesarRespuesta(await fetch(url, { ...options, headers: { ...headers(token, options.body !== undefined), ...(options.headers || {}) } }))
const requestArchivo = async (url, token) => procesarRespuestaArchivo(await fetch(url, { headers: headers(token) }))

export const obtenerTiposInventario = (token, activeOnly = false) => request(`${API_URL}/inventory/types${activeOnly ? '?active_only=true' : ''}`, token)
export const crearTipoInventario = (datos, token) => request(`${API_URL}/inventory/types`, token, { method: 'POST', body: JSON.stringify(datos) })
export const actualizarTipoInventario = (id, datos, token) => request(`${API_URL}/inventory/types/${encodeURIComponent(id)}`, token, { method: 'PATCH', body: JSON.stringify(datos) })
export const obtenerProductosInventario = (token, activeOnly = false) => request(`${API_URL}/inventory/products${activeOnly ? '?active_only=true' : ''}`, token)
export const obtenerProductosTopVenta = (token, limit = 6) => request(`${API_URL}/inventory/products/top-selling?limit=${encodeURIComponent(limit)}`, token)
export const buscarImagenesProducto = (query, token) => request(`${API_URL}/inventory/products/images/search?query=${encodeURIComponent(query.trim())}`, token)
export const crearProductoInventario = (datos, token) => request(`${API_URL}/inventory/products`, token, { method: 'POST', body: JSON.stringify(datos) })
export const actualizarProductoInventario = (id, datos, token) => request(`${API_URL}/inventory/products/${encodeURIComponent(id)}`, token, { method: 'PATCH', body: JSON.stringify(datos) })
export const obtenerInventario = (token) => request(`${API_URL}/inventory`, token)

export const exportarInventarioExcel = (token, { search = '', inventoryTypeId = '' } = {}) => {
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  if (inventoryTypeId) params.set('inventory_type_id', String(inventoryTypeId))
  const query = params.toString()
  return requestArchivo(`${API_URL}/inventory/export${query ? `?${query}` : ''}`, token)
}

export const crearMovimientoInventario = (datos, token) => request(`${API_URL}/inventory/movements`, token, { method: 'POST', body: JSON.stringify(datos) })

export const obtenerMovimientosInventario = (productId, token, { limit = 100, offset = 0, fromDate = '', toDate = '' } = {}) => {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  if (productId) params.set('product_id', String(productId))
  if (fromDate) params.set('from_date', fromDate)
  if (toDate) params.set('to_date', toDate)
  return request(`${API_URL}/inventory/movements?${params.toString()}`, token)
}

export const exportarKardexExcel = (token, { productId = '', fromDate = '', toDate = '' } = {}) => {
  const params = new URLSearchParams()
  if (productId) params.set('product_id', String(productId))
  if (fromDate) params.set('from_date', fromDate)
  if (toDate) params.set('to_date', toDate)
  const query = params.toString()
  return requestArchivo(`${API_URL}/inventory/movements/export${query ? `?${query}` : ''}`, token)
}

export const devolverMovimientoInventario = (movementId, token, quantity = null) => {
  const query = quantity == null ? '' : `?quantity=${encodeURIComponent(quantity)}`
  return request(`${API_URL}/inventory/movements/${encodeURIComponent(movementId)}/reverse${query}`, token, { method: 'POST' })
}
