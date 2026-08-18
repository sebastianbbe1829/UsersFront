const API_URL = `http://${window.location.hostname}:8000`


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

    // Si el servidor devuelve un mensaje detallado, úsalo
    // De lo contrario, usa el mensaje genérico
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

const procesarRespuestaArchivo = async (
  response
) => {

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

    const mensajeError =
      resultado?.detail ||
      obtenerMensajeError(response.status)

    const error =
      new Error(mensajeError)

    error.status =
      response.status

    throw error
  }

  return await response.blob()
}


// ==========================
// LOGIN
// ==========================

export const login = async (
  username,
  password
) => {

  const datos = new URLSearchParams()

  datos.append('username', username)
  datos.append('password', password)

  console.log(
    'Intentando login contra:',
    `${API_URL}/auth/login`
  )


  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded',
      },
      body: datos,
    }
  )

  return procesarRespuesta(response)
}


// ==========================
// OBTENER USUARIOS
// ==========================

export const obtenerUsuarios = async (
  token
) => {

  const response = await fetch(
    `${API_URL}/users`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  return procesarRespuesta(response)
}


// ==========================
// CREAR USUARIO
// ==========================

export const crearUsuario = async (
  usuario,
  token
) => {

  const response = await fetch(
    `${API_URL}/users`,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
        Authorization:
          `Bearer ${token}`,
      },
      body: JSON.stringify(usuario),
    }
  )

  return procesarRespuesta(response)
}


// ==========================
// ACTUALIZAR USUARIO
// ==========================

export const actualizarUsuario = async (
  dni,
  usuario,
  token
) => {

  const response = await fetch(
    `${API_URL}/users/${dni}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type':
          'application/json',
        Authorization:
          `Bearer ${token}`,
      },
      body: JSON.stringify(usuario),
    }
  )

  return procesarRespuesta(response)
}


// ==========================
// ELIMINAR USUARIO
// ==========================

export const eliminarUsuario = async (
  dni,
  token
) => {

  const response = await fetch(
    `${API_URL}/users/${dni}`,
    {
      method: 'DELETE',
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  )

  return procesarRespuesta(response)
}


// ==========================
// OBTENER PAYLOAD DEL JWT
// ==========================

export const obtenerPayloadToken = (
  token
) => {

  try {

    const partes = token.split('.')

    if (partes.length !== 3) {
      return null
    }

    const payloadBase64 = partes[1]

    const payloadJson = atob(
      payloadBase64
        .replace(/-/g, '+')
        .replace(/_/g, '/')
    )

    return JSON.parse(payloadJson)

  } catch (error) {

    console.error(
      'No fue posible leer el JWT:',
      error
    )

    return null
  }
}


// ==========================
// VALIDAR EXPIRACIÓN
// ==========================

export const tokenEstaExpirado = (
  token
) => {

  const payload =
    obtenerPayloadToken(token)

  if (!payload) {
    return true
  }

  if (!payload.exp) {
    return true
  }

  const ahora =
    Math.floor(Date.now() / 1000)

  return payload.exp <= ahora
}


// ==========================
// TIEMPO RESTANTE DEL TOKEN
// ==========================

export const obtenerTiempoToken = (
  token
) => {

  const payload =
    obtenerPayloadToken(token)

  if (!payload?.exp) {
    return 0
  }

  const ahora =
    Math.floor(Date.now() / 1000)

  const segundosRestantes =
    payload.exp - ahora

  return Math.max(
    segundosRestantes,
    0
  )
}

// ==========================
// ACTIVAR USUARIO
// ==========================

export const activarUsuario = async (
  dni,
  token
) => {

  const response = await fetch(
    `${API_URL}/users/activate/${dni}/${token}/`,
    {
      method: 'POST',
    }
  )

  return procesarRespuesta(response)
}

// ==========================
// EXPORTAR USUARIOS A EXCEL
// ==========================

export const exportarUsuariosExcel = async (
  token
) => {

  const response = await fetch(
    `${API_URL}/users/export`,
    {
      method: 'GET',
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  )

  return procesarRespuestaArchivo(
    response
  )
}