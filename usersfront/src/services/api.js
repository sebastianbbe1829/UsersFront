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
// CONFIGURACIÓN UI PÚBLICA
// ==========================

export const obtenerConfigTenantPublica = async (tenantSlug) => {
  if (!tenantSlug) {
    throw new Error('No se pudo determinar la empresa desde la URL.')
  }

  const response = await fetch(
    `${API_URL}/tenant-config/public/${encodeURIComponent(tenantSlug)}`,
    {
      method: 'GET',
    }
  )

  return procesarRespuesta(response)
}


// ==========================
// CONFIGURACIÓN UI DEL TENANT
// ==========================

export const obtenerConfigTenant = async (token) => {
  const response = await fetch(`${API_URL}/tenant-config`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return procesarRespuesta(response)
}

export const actualizarConfigTenant = async (configuracion, token) => {
  const response = await fetch(`${API_URL}/tenant-config`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(configuracion),
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
  bootstrapTenantKey
) => {
  const response = await fetch(`${API_URL}/bootstrap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Bootstrap-Tenant-Key': bootstrapTenantKey,
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
// EXTINTORES
// ==========================

export const obtenerExtintores = async (token) => {
  const response = await fetch(`${API_URL}/extinguishers`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return procesarRespuesta(response)
}

export const crearExtintor = async (datos, token) => {
  const response = await fetch(`${API_URL}/extinguishers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  })

  return procesarRespuesta(response)
}

export const obtenerExtintor = async (id, token) => {
  const response = await fetch(`${API_URL}/extinguishers/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return procesarRespuesta(response)
}

export const actualizarExtintor = async (id, datos, token) => {
  const response = await fetch(`${API_URL}/extinguishers/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  })

  return procesarRespuesta(response)
}

export const eliminarExtintor = async (id, token) => {
  const response = await fetch(`${API_URL}/extinguishers/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return procesarRespuesta(response)
}
