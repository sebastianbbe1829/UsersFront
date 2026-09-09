// ============================================================
// OBTENER TENANT DESDE LA URL
// ============================================================

export const obtenerTenantDesdeUrl = () => {
  const path = window.location.pathname

  const partes = path
    .split('/')
    .filter(Boolean)

  if (partes.length === 0) {
    return null
  }

  // /welcome fue una ruta legacy sin tenant.
  // "welcome" NO es un slug válido de empresa.
  if (partes[0].toLowerCase() === 'welcome') {
    return null
  }

  return partes[0]
}
