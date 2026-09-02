const API_URL = import.meta.env.VITE_API_URL

const request = async (url, options = {}) => {
  const response = await fetch(url, options)
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(data?.detail || 'No fue posible completar la operación.')
    error.status = response.status
    throw error
  }
  return data
}

const headers = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  Authorization: `Bearer ${token}`,
})

export const obtenerItemsRevisionExtintorAdmin = (token) =>
  request(`${API_URL}/extinguisher-inspection-items`, {
    method: 'GET',
    headers: headers(token),
  })

export const crearItemRevisionExtintor = (datos, token) =>
  request(`${API_URL}/extinguisher-inspection-items`, {
    method: 'POST',
    headers: headers(token, true),
    body: JSON.stringify(datos),
  })

export const actualizarItemRevisionExtintor = (id, datos, token) =>
  request(`${API_URL}/extinguisher-inspection-items/${id}`, {
    method: 'PUT',
    headers: headers(token, true),
    body: JSON.stringify(datos),
  })

export const eliminarItemRevisionExtintor = (id, token) =>
  request(`${API_URL}/extinguisher-inspection-items/${id}`, {
    method: 'DELETE',
    headers: headers(token),
  })
