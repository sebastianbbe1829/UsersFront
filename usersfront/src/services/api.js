const API_URL = import.meta.env.VITE_API_URL


// ==========================
// MENSAJES DE ERROR
// ==========================

const obtenerMensajeError = (status) => {
  switch (status) {
    case 400:
      return 'La solicitud no es válida.'
    case 401:
      return 'La sesión ha expirado. Inicia sesión nuevamente.'
    case 403:
      return 'No tienes permisos para realizar esta acción.'
    case 404:
      return 'No se encontró el recurso solicitado.'
    case 422:
      return 'Los datos enviados no son válidos.'
    case 500:
      return 'Ocurrió un error interno en el servidor.'
    default:
      return 'Ocurrió un error inesperado.'
  }
}


// ==========================
// PROCESAR RESPUESTA
// ==========================

const procesarRespuesta = async (response) => {
  let resultado = null

  try {
    resultado = await response.json()
  } catch {
    resultado = null
  }

  if (!response.ok) {
    console.error('Error API:', {
      status: response.status,
      statusText: response.statusText,
      detail: resultado?.detail,
    })

    const mensajeError = resultado?.detail || obtenerMensajeError(response.status)
    const error = new Error(mensajeError)
    error.status = response.status
    throw error
  }

  return resultado
}


// ==========================
// PROCESAR RESPUESTA DE ARCHIVO
// ==========================

const procesarRespuestaArchivo = async (response) => {
  if (!response.ok) {
    let resultado = null

    try {
      resultado = await response.json()
    } catch {
      resultado = null
    }

    console.error('Error API:', {
      status: response.status,
      statusText: response.statusText,
      detail: resultado?.detail,
    })

    const mensajeError = resultado?.detail || obtenerMensajeError(response.status)
    const error = new Error(mensajeError)
    error.status = response.status
    throw error
  }

  return await response.blob()
}


// ==========================
// LOGIN
// ==========================

export const login = async (
  username,
  password,
  tenant,
  superMode = false,
  otp = ''
) => {
  console.log('Intentando login contra:', `${API_URL}/auth/login`)
  console.log('Tenant seleccionado:', tenant)

  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
      tenant,
      super_mode: superMode,
      ...(superMode && otp ? { otp } : {}),
    }),
  })

  return procesarRespuesta(response)
}


// ==========================
// BOOTSTRAP TENANT
// ==========================

export const bootstrapTenant = async (
  tenantName,
  tenantSlug,
  adminDni,
  adminName,
  adminEmail,
  adminPassword,
  adminPhone,
  bootstrapKey
) => {
  const response = await fetch(`${API_URL}/bootstrap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Bootstrap-Key': bootstrapKey,
    },
    body: JSON.stringify({
      tenant_name: tenantName,
      tenant_slug: tenantSlug,
      admin_dni: adminDni,
      admin_name: adminName,
      admin_email: adminEmail,
      admin_password: adminPassword,
      admin_phone: adminPhone || null,
    }),
  })

  return procesarRespuesta(response)
}


// ==========================
// BOOTSTRAP SUPER
// ==========================

export const bootstrapSuperUser = async (email, password, bootstrapSecret) => {
  const response = await fetch(`${API_URL}/auth/super/bootstrap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Super-Bootstrap-Secret': bootstrapSecret,
    },
    body: JSON.stringify({ email, password }),
  })

  return procesarRespuesta(response)
}


// ==========================
// VERIFICAR MFA DEL BOOTSTRAP SUPER
// ==========================

export const verificarBootstrapMfa = async (userId, otp, bootstrapSecret) => {
  const response = await fetch(`${API_URL}/auth/super/bootstrap/verify-mfa`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Super-Bootstrap-Secret': bootstrapSecret,
    },
    body: JSON.stringify({ user_id: userId, otp }),
  })

  return procesarRespuesta(response)
}


// ==========================
// OBTENER TENANT ACTUAL
// ==========================

export const obtenerTenantActual = async (token) => {
  const response = await fetch(`${API_URL}/tenants`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const resultado = await procesarRespuesta(response)
  return Array.isArray(resultado) ? resultado[0] || null : resultado
}


// ==========================
// ACTUALIZAR TENANT
// ==========================

export const actualizarTenant = async (tenantId, tenant, token) => {
  const response = await fetch(`${API_URL}/tenants/${tenantId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(tenant),
  })

  return procesarRespuesta(response)
}


// ==========================
// OBTENER USUARIOS
// ==========================

export const obtenerUsuarios = async (token) => {
  const response = await fetch(`${API_URL}/users`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  return procesarRespuesta(response)
}

export const crearUsuario = async (usuario, token) => {
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(usuario),
  })
  return procesarRespuesta(response)
}

export const actualizarUsuario = async (dni, usuario, token) => {
  const response = await fetch(`${API_URL}/users/${dni}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(usuario),
  })
  return procesarRespuesta(response)
}

export const eliminarUsuario = async (dni, token) => {
  const response = await fetch(`${API_URL}/users/${dni}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  return procesarRespuesta(response)
}


// ==========================
// OBTENER PAYLOAD DEL JWT
// ==========================

export const obtenerPayloadToken = (token) => {
  try {
    const partes = token.split('.')
    if (partes.length !== 3) return null
    return JSON.parse(atob(partes[1].replace(/-/g, '+').replace(/_/g, '/')))
  } catch (error) {
    console.error('No fue posible leer el JWT:', error)
    return null
  }
}

export const tokenEstaExpirado = (token) => {
  const payload = obtenerPayloadToken(token)
  if (!payload?.exp) return true
  return payload.exp <= Math.floor(Date.now() / 1000)
}

export const obtenerTiempoToken = (token) => {
  const payload = obtenerPayloadToken(token)
  if (!payload?.exp) return 0
  return Math.max(payload.exp - Math.floor(Date.now() / 1000), 0)
}


// ==========================
// ACTIVAR USUARIO
// ==========================

export const activarUsuario = async (dni, token) => {
  const response = await fetch(`${API_URL}/users/activate/${dni}/${token}/`, {
    method: 'POST',
  })
  return procesarRespuesta(response)
}

export const exportarUsuariosExcel = async (token) => {
  const response = await fetch(`${API_URL}/users/export`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  return procesarRespuestaArchivo(response)
}

export const obtenerRoles = async (token, statusFilter = null) => {
  let url = `${API_URL}/roles`
  if (statusFilter !== null && statusFilter !== undefined) url += `?status_filter=${statusFilter}`
  const response = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  return procesarRespuesta(response)
}

export const obtenerRol = async (roleId, token) => {
  const response = await fetch(`${API_URL}/roles/${roleId}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  return procesarRespuesta(response)
}

export const crearRol = async (rol, token) => {
  const response = await fetch(`${API_URL}/roles`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(rol) })
  return procesarRespuesta(response)
}

export const actualizarRol = async (roleId, rol, token) => {
  const response = await fetch(`${API_URL}/roles/${roleId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(rol) })
  return procesarRespuesta(response)
}

export const eliminarRol = async (roleId, token) => {
  const response = await fetch(`${API_URL}/roles/${roleId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  return procesarRespuesta(response)
}

export const obtenerPermisosRol = async (roleId, token) => {
  const response = await fetch(`${API_URL}/role-permissions/role/${roleId}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  return procesarRespuesta(response)
}

export const asignarPermisoRol = async (roleId, permissionId, token) => {
  const response = await fetch(`${API_URL}/role-permissions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ role_id: roleId, permission_id: permissionId }) })
  return procesarRespuesta(response)
}

export const eliminarPermisoRol = async (rolePermissionId, token) => {
  const response = await fetch(`${API_URL}/role-permissions/${rolePermissionId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  return procesarRespuesta(response)
}

export const obtenerTenantsUsuario = async (userId, token) => {
  const response = await fetch(`${API_URL}/user-tenants/user/${userId}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  return procesarRespuesta(response)
}

export const obtenerRolesUsuario = async (userTenantId, token) => {
  const response = await fetch(`${API_URL}/user-tenant-roles/user/${userTenantId}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  return procesarRespuesta(response)
}

export const asignarRolUsuario = async (userTenantId, roleId, token) => {
  const response = await fetch(`${API_URL}/user-tenant-roles`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ user_tenant_id: userTenantId, role_id: roleId }) })
  return procesarRespuesta(response)
}

export const eliminarRolUsuario = async (userTenantRoleId, token) => {
  const response = await fetch(`${API_URL}/user-tenant-roles/${userTenantRoleId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  return procesarRespuesta(response)
}

export const crearPermiso = async (permiso, token) => {
  const response = await fetch(`${API_URL}/permission`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(permiso) })
  return procesarRespuesta(response)
}

export const obtenerPermisos = async (token) => {
  const response = await fetch(`${API_URL}/permission`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  return procesarRespuesta(response)
}
