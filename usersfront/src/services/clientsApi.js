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

const catalogo = async (recurso, token, metodo = 'GET', datos = null, id = null) => {
  const url = `${API_URL}/clients/catalogs/${recurso}${id == null ? '' : `/${encodeURIComponent(id)}`}`
  return procesarRespuesta(await fetch(url, {
    method: metodo,
    headers: headers(token, datos !== null),
    ...(datos !== null ? { body: JSON.stringify(datos) } : {}),
  }))
}

export const obtenerClientes = async (token) => procesarRespuesta(await fetch(`${API_URL}/clients`, { headers: headers(token) }))

export const obtenerCliente = async (id, token) => procesarRespuesta(await fetch(`${API_URL}/clients/${encodeURIComponent(id)}`, { headers: headers(token) }))

export const crearCliente = async (datos, token) => procesarRespuesta(await fetch(`${API_URL}/clients`, { method: 'POST', headers: headers(token, true), body: JSON.stringify(datos) }))

export const actualizarCliente = async (id, datos, token) => procesarRespuesta(await fetch(`${API_URL}/clients/${encodeURIComponent(id)}`, { method: 'PATCH', headers: headers(token, true), body: JSON.stringify(datos) }))

export const eliminarCliente = async (id, token) => procesarRespuesta(await fetch(`${API_URL}/clients/${encodeURIComponent(id)}`, { method: 'DELETE', headers: headers(token) }))

export const obtenerTiposIdentificacionCliente = async (token) => catalogo('identification-types', token)
export const obtenerTipoIdentificacionCliente = async (id, token) => catalogo('identification-types', token, 'GET', null, id)
export const crearTipoIdentificacionCliente = async (datos, token) => catalogo('identification-types', token, 'POST', datos)
export const actualizarTipoIdentificacionCliente = async (id, datos, token) => catalogo('identification-types', token, 'PATCH', datos, id)
export const eliminarTipoIdentificacionCliente = async (id, token) => catalogo('identification-types', token, 'DELETE', null, id)

export const obtenerPaisesCliente = async (token) => catalogo('countries', token)
export const obtenerPaisCliente = async (id, token) => catalogo('countries', token, 'GET', null, id)
export const crearPaisCliente = async (datos, token) => catalogo('countries', token, 'POST', datos)
export const actualizarPaisCliente = async (id, datos, token) => catalogo('countries', token, 'PATCH', datos, id)
export const eliminarPaisCliente = async (id, token) => catalogo('countries', token, 'DELETE', null, id)

export const obtenerDepartamentosCliente = async (token, countryId = null) => {
  const query = countryId ? `?country_id=${encodeURIComponent(countryId)}` : ''
  return procesarRespuesta(await fetch(`${API_URL}/clients/catalogs/departments${query}`, { headers: headers(token) }))
}
export const obtenerDepartamentoCliente = async (id, token) => catalogo('departments', token, 'GET', null, id)
export const crearDepartamentoCliente = async (datos, token) => catalogo('departments', token, 'POST', datos)
export const actualizarDepartamentoCliente = async (id, datos, token) => catalogo('departments', token, 'PATCH', datos, id)
export const eliminarDepartamentoCliente = async (id, token) => catalogo('departments', token, 'DELETE', null, id)

export const obtenerCiudadesCliente = async (token, departmentId = null) => {
  const query = departmentId ? `?department_id=${encodeURIComponent(departmentId)}` : ''
  return procesarRespuesta(await fetch(`${API_URL}/clients/catalogs/cities${query}`, { headers: headers(token) }))
}
export const obtenerCiudadCliente = async (id, token) => catalogo('cities', token, 'GET', null, id)
export const crearCiudadCliente = async (datos, token) => catalogo('cities', token, 'POST', datos)
export const actualizarCiudadCliente = async (id, datos, token) => catalogo('cities', token, 'PATCH', datos, id)
export const eliminarCiudadCliente = async (id, token) => catalogo('cities', token, 'DELETE', null, id)
