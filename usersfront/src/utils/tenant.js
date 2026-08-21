// ============================================================
// OBTENER TENANT DESDE LA URL
// ============================================================

export const obtenerTenantDesdeUrl = () => {

  const path =
    window.location.pathname


  // ==========================================================
  // SEPARAR SEGMENTOS
  // ==========================================================

  const partes =
    path
      .split('/')
      .filter(Boolean)


  // ==========================================================
  // URL SIN SEGMENTOS
  // ==========================================================

  if (partes.length === 0) {

    return null

  }


  // ==========================================================
  // EL PRIMER SEGMENTO SIEMPRE ES EL TENANT
  //
  // Ejemplos:
  //
  // /empresa-demo
  // /empresa-demo/login
  // /empresa-demo/usuarios
  // /empresa-demo/roles
  // /empresa-demo/permisos
  //
  // En todos los casos:
  //
  // tenant = empresa-demo
  // ==========================================================

  return partes[0]

}