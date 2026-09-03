import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import {
  tokenEstaExpirado,
  obtenerTiempoToken,
} from '../services/api'

let ultimaFirmaRegistrada = ''

function SessionManager({
  token,
  onSesionExpirada,
}) {
  const location = useLocation()

  useEffect(() => {
    if (!token) {
      return
    }

    if (tokenEstaExpirado(token)) {
      onSesionExpirada()
      return
    }

    const segundosRestantes = obtenerTiempoToken(token)
    const firmaActual = `${location.pathname}|${token}`

    if (firmaActual !== ultimaFirmaRegistrada) {
      ultimaFirmaRegistrada = firmaActual
      console.log(
        `[AUTH] Ruta ${location.pathname}. Token válido. Expira en ${segundosRestantes} segundos.`
      )
    }

    const tiempoMilisegundos = segundosRestantes * 1000
    const timer = setTimeout(() => {
      console.log('[AUTH] El token ha expirado. Cerrando sesión.')
      onSesionExpirada()
    }, tiempoMilisegundos)

    return () => {
      clearTimeout(timer)
    }
  }, [
    token,
    location.pathname,
    onSesionExpirada,
  ])

  return null
}

export default SessionManager
