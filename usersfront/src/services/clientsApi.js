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

const catalogoCache = new Map()
const catalogoEnCurso = new Map()
const clientesEnCurso = new Map()

const claveCatalogo = (recurso, token, query = '') => `${recurso}|${token}|${query}`

const invalidarCatalogo = (recurso, token) => {
  const prefijo = `${recurso}|${token}|`
  for (const clave of catalogoCache.keys()) {
    if (clave.startsWith(prefijo)) catalogoCache.delete(clave)
  }
}

const catalogo = async (recurso, token, metodo = 'GET', datos = null, id = null) => {
  const url = `${API_URL}/clients/catalogs/${recurso}${id == null ? '' : `/${encodeURIComponent(id)}`}`
  const resultado = await procesarRespuesta(await fetch(url, {
    method: metodo,
    headers: headers(token, datos !== null),
    ...(datos !== null ? { body: JSON.stringify(datos) } : {}),
  }))
  if (metodo !== 'GET') invalidarCatalogo(recurso, token)
  return resultado
}

const catalogoLista = async (recurso, token, query = '') => {
  const clave = claveCatalogo(recurso, token, query)
  if (catalogoCache.has(clave)) return catalogoCache.get(clave)
  if (catalogoEnCurso.has(clave)) return catalogoEnCurso.get(clave)

  const url = `${API_URL}/clients/catalogs/${recurso}${query}`
  const promesa = procesarRespuesta(await fetch(url, { headers: headers(token) }))
    .then((resultado) => {
      catalogoCache.set(clave, resultado)
      return resultado
    })
    .finally(() => catalogoEnCurso.delete(clave))

  catalogoEnCurso.set(clave, promesa)
  return promesa
}

const claveClientes = (token, page, pageSize, search) => `${token}|${page}|${pageSize}|${search.trim()}`

export const obtenerClientes = async (token, { page = 1, pageSize = 10, search = '' } = {}) => {
  const busca = search.trim()
  const clave = claveClientes(token, page, pageSize, busca)
  if (clientesEnCurso.has(clave)) return clientesEnCurso.get(clave)

  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  if (busca) params.set('search', busca)

  const promesa = procesarRespuesta(await fetch(`${API_URL}/clients?${params.toString()}`, { headers: headers(token) }))
    .finally(() => clientesEnCurso.delete(clave))

  clientesEnCurso.set(clave, promesa)
  return promesa
}
export const obtenerCliente = async (id, token) => procesarRespuesta(await fetch(`${API_URL}/clients/${encodeURIComponent(id)}`, { headers: headers(token) }))
export const crearCliente = async (datos, token) => procesarRespuesta(await fetch(`${API_URL}/clients`, { method: 'POST', headers: headers(token, true), body: JSON.stringify(datos) }))
export const actualizarCliente = async (id, datos, token) => procesarRespuesta(await fetch(`${API_URL}/clients/${encodeURIComponent(id)}`, { method: 'PATCH', headers: headers(token, true), body: JSON.stringify(datos) }))
export const eliminarCliente = async (id, token) => procesarRespuesta(await fetch(`${API_URL}/clients/${encodeURIComponent(id)}`, { method: 'DELETE', headers: headers(token) }))
export const levantarRestriccionCliente = async (id, datos, token) => procesarRespuesta(await fetch(`${API_URL}/clients/${encodeURIComponent(id)}/compliance/override`, { method: 'POST', headers: headers(token, true), body: JSON.stringify(datos) }))
export const revisarClienteListas = async (id, token) => procesarRespuesta(await fetch(`${API_URL}/clients/${encodeURIComponent(id)}/compliance/screen`, { method: 'POST', headers: headers(token) }))
export const obtenerInformeListasRestrictivas = async (token) => procesarRespuesta(await fetch(`${API_URL}/clients/restricted-report`, { headers: headers(token) }))
export const obtenerHistorialLevantamientos = async (token) => procesarRespuesta(await fetch(`${API_URL}/clients/compliance/override-history`, { headers: headers(token) }))

export const obtenerTiposIdentificacionCliente = async (token) => catalogoLista('identification-types', token)
export const obtenerTipoIdentificacionCliente = async (id, token) => catalogo('identification-types', token, 'GET', null, id)
export const crearTipoIdentificacionCliente = async (datos, token) => catalogo('identification-types', token, 'POST', datos)
export const actualizarTipoIdentificacionCliente = async (id, datos, token) => catalogo('identification-types', token, 'PATCH', datos, id)
export const eliminarTipoIdentificacionCliente = async (id, token) => catalogo('identification-types', token, 'DELETE', null, id)

export const obtenerPaisesCliente = async (token) => catalogoLista('countries', token)
export const obtenerPaisCliente = async (id, token) => catalogo('countries', token, 'GET', null, id)
export const crearPaisCliente = async (datos, token) => catalogo('countries', token, 'POST', datos)
export const actualizarPaisCliente = async (id, datos, token) => catalogo('countries', token, 'PATCH', datos, id)
export const eliminarPaisCliente = async (id, token) => catalogo('countries', token, 'DELETE', null, id)

export const obtenerDepartamentosCliente = async (token, countryId = null) => {
  const query = countryId ? `?country_id=${encodeURIComponent(countryId)}` : ''
  return catalogoLista('departments', token, query)
}
export const obtenerDepartamentoCliente = async (id, token) => catalogo('departments', token, 'GET', null, id)
export const crearDepartamentoCliente = async (datos, token) => catalogo('departments', token, 'POST', datos)
export const actualizarDepartamentoCliente = async (id, datos, token) => catalogo('departments', token, 'PATCH', datos, id)
export const eliminarDepartamentoCliente = async (id, token) => catalogo('departments', token, 'DELETE', null, id)

export const obtenerCiudadesCliente = async (token, departmentId = null) => {
  const query = departmentId ? `?department_id=${encodeURIComponent(departmentId)}` : ''
  return catalogoLista('cities', token, query)
}
export const obtenerCiudadCliente = async (id, token) => catalogo('cities', token, 'GET', null, id)
export const crearCiudadCliente = async (datos, token) => catalogo('cities', token, 'POST', datos)
export const actualizarCiudadCliente = async (id, datos, token) => catalogo('cities', token, 'PATCH', datos, id)
export const eliminarCiudadCliente = async (id, token) => catalogo('cities', token, 'DELETE', null, id)
