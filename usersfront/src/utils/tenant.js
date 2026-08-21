// ==========================
// OBTENER TENANT DESDE LA URL
// ==========================

export const obtenerTenantDesdeUrl = () => {

  const path =
    window.location.pathname

  const partes =
    path
      .split('/')
      .filter(Boolean)

  // ==========================
  // URL RAÍZ
  // ==========================

  if (partes.length === 0) {
    return null
  }

  // ==========================
  // POR AHORA SOLO ACEPTAMOS
  // UN SEGMENTO COMO TENANT
  //
  // /empresa-demo
  // ==========================

  if (partes.length !== 1) {
    return null
  }

  return partes[0]

}