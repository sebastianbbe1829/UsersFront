import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import {
  tokenEstaExpirado,
  obtenerTiempoToken,
} from '../services/api'

let ultimaFirmaRegistrada = ''

function SessionManager({ token }) {
  const location = useLocation()

  useEffect(() => {
    if (!token) {
      return
    }

    const segundosRestantes = obtenerTiempoToken(token)
    const expirado = tokenEstaExpirado(token)
    const firmaActual = `${location.pathname}|${token}|${expirado}`

    if (firmaActual !== ultimaFirmaRegistrada) {
      ultimaFirmaRegistrada = firmaActual

      if (expirado) {
        console.info(
          '[AUTH] El access token expiró. La sesión lógica permanece disponible para intentar renovación.'
        )
      } else {
        console.log(
          `[AUTH] Ruta ${location.pathname}. Token válido. Expira en ${segundosRestantes} segundos.`
        )
      }
    }
  }, [token, location.pathname])

  return null
}

export default SessionManager
