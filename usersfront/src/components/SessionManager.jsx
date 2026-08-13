import { useEffect } from 'react'

import {
  tokenEstaExpirado,
  obtenerTiempoToken,
} from '../services/api'


function SessionManager({
  token,
  onSesionExpirada,
}) {

  useEffect(() => {

    if (!token) {
      return
    }


    // ==========================
    // VALIDACIÓN INICIAL
    // ==========================

    if (tokenEstaExpirado(token)) {

      onSesionExpirada()

      return
    }


    // ==========================
    // TIEMPO RESTANTE
    // ==========================

    const segundosRestantes =
      obtenerTiempoToken(token)


    console.log(
      `Token válido. Expira en ${segundosRestantes} segundos.`
    )


    // ==========================
    // PROGRAMAR LOGOUT
    // ==========================

    const tiempoMilisegundos =
      segundosRestantes * 1000


    const timer = setTimeout(() => {

      console.log(
        'El token ha expirado. Cerrando sesión.'
      )

      onSesionExpirada()

    }, tiempoMilisegundos)


    // ==========================
    // LIMPIAR TIMER
    // ==========================

    return () => {
      clearTimeout(timer)
    }

  }, [
    token,
    onSesionExpirada,
  ])


  return null
}


export default SessionManager