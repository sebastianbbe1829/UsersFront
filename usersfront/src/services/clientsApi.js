const API_URL = import.meta.env.VITE_API_URL

const procesarRespuesta = async (response) => {
  const resultado = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(resultado?.detail || 'Ocurrió un error al consultar clientes.')
    error.status = response.status
    throw error
  }
  return resultado
}

const headers = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  Authorization: `Bearer ${token}`,
})

export const obtenerClientes = async (token) => procesarRespuesta(await fetch(`${API_URL}/clients`, { headers: headers(token) }))

export const obtenerCliente = async (id, token) => procesarRespuesta(await fetch(`${API_URL}/clients/${encodeURIComponent(id)}`, { headers: headers(token) }))

export const crearCliente = async (datos, token) => procesarRespuesta(await fetch(`${API_URL}/clients`, { method: 'POST', headers: headers(token, true), body: JSON.stringify(datos) }))

export const actualizarCliente = async (id, datos, token) => procesarRespuesta(await fetch(`${API_URL}/clients/${encodeURIComponent(id)}`, { method: 'PATCH', headers: headers(token, true), body: JSON.stringify(datos) }))

export const eliminarCliente = async (id, token) => procesarRespuesta(await fetch(`${API_URL}/clients/${encodeURIComponent(id)}`, { method: 'DELETE', headers: headers(token) }))

export const obtenerTiposIdentificacionCliente = async (token) => procesarRespuesta(await fetch(`${API_URL}/clients/catalogs/identification-types`, { headers: headers(token) }))

export const obtenerPaisesCliente = async (token) => procesarRespuesta(await fetch(`${API_URL}/clients/catalogs/countries`, { headers: headers(token) }))

export const obtenerDepartamentosCliente = async (token, countryId = null) => {
  const query = countryId ? `?country_id=${encodeURIComponent(countryId)}` : ''
  return procesarRespuesta(await fetch(`${API_URL}/clients/catalogs/departments${query}`, { headers: headers(token) }))
}

export const obtenerCiudadesCliente = async (token, departmentId = null) => {
  const query = departmentId ? `?department_id=${encodeURIComponent(departmentId)}` : ''
  return procesarRespuesta(await fetch(`${API_URL}/clients/catalogs/cities${query}`, { headers: headers(token) }))
}
