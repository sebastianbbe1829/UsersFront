import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  obtenerPayloadToken,
  tokenEstaExpirado,
  login,
  logout,
  renovarSesion,
} from '../services/api'

import {
  obtenerTenantDesdeUrl,
} from '../utils/tenant'

import { AuthContext } from './AuthContextValue'

const TENANT_SESSIONS_KEY = 'tenant_sessions'
const SUPER_SESSIONS_KEY = 'super_sessions'
const ACTIVITY_CHECK_INTERVAL_MS = 30 * 1000
const ACTIVITY_THROTTLE_MS = 10 * 1000
const RECENT_ACTIVITY_WINDOW_MS = 5 * 60 * 1000

export function AuthProvider({ children }) {
  const tenant = obtenerTenantDesdeUrl()

  const [logueado, setLogueado] = useState(false)
  const [token, setToken] = useState('')
  const [usuarioLogueado, setUsuarioLogueado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mensajeSesion, setMensajeSesion] = useState('')
  const [usuarios, setUsuarios] = useState([])
  const tokenRef = useRef('')
  const ultimaActividadRef = useRef(Date.now())
  const ultimoEventoActividadRef = useRef(0)
  const renovandoSesionRef = useRef(false)
  const cerrandoSesionExpiradaRef = useRef(false)

  useEffect(() => {
    tokenRef.current = token
  }, [token])

  const obtenerSesiones = useCallback((key) => {
    try {
      const sesiones = localStorage.getItem(key)
      if (!sesiones) return {}
      const resultado = JSON.parse(sesiones)
      if (!resultado || typeof resultado !== 'object') return {}
      return resultado
    } catch (error) {
      console.error('Error leyendo sesiones:', error)
      return {}
    }
  }, [])

  const guardarSesion = useCallback((key, tenantActual, tokenNuevo) => {
    if (!tenantActual || !tokenNuevo) return
    const sesiones = obtenerSesiones(key)
    sesiones[tenantActual] = tokenNuevo
    localStorage.setItem(key, JSON.stringify(sesiones))
  }, [obtenerSesiones])

  const obtenerSesion = useCallback((key, tenantActual) => {
    if (!tenantActual) return null
    const sesiones = obtenerSesiones(key)
    return sesiones[tenantActual] || null
  }, [obtenerSesiones])

  const eliminarSesion = useCallback((key, tenantActual, tokenEsperado = null) => {
    if (!tenantActual) return
    const sesiones = obtenerSesiones(key)
    if (tokenEsperado !== null && sesiones[tenantActual] !== tokenEsperado) return
    delete sesiones[tenantActual]
    localStorage.setItem(key, JSON.stringify(sesiones))
  }, [obtenerSesiones])

  const guardarSesionTenant = useCallback((tenantActual, tokenNuevo) => {
    guardarSesion(TENANT_SESSIONS_KEY, tenantActual, tokenNuevo)
  }, [guardarSesion])

  const obtenerSesionTenant = useCallback((tenantActual) => (
    obtenerSesion(TENANT_SESSIONS_KEY, tenantActual)
  ), [obtenerSesion])

  const eliminarSesionTenant = useCallback((tenantActual, tokenEsperado = null) => {
    eliminarSesion(TENANT_SESSIONS_KEY, tenantActual, tokenEsperado)
  }, [eliminarSesion])

  const guardarSesionSuper = useCallback((tenantActual, tokenNuevo) => {
    guardarSesion(SUPER_SESSIONS_KEY, tenantActual, tokenNuevo)
  }, [guardarSesion])

  const obtenerSesionSuper = useCallback((tenantActual) => (
    obtenerSesion(SUPER_SESSIONS_KEY, tenantActual)
  ), [obtenerSesion])

  const eliminarSesionSuper = useCallback((tenantActual, tokenEsperado = null) => {
    eliminarSesion(SUPER_SESSIONS_KEY, tenantActual, tokenEsperado)
  }, [eliminarSesion])

  const validarTenantToken = useCallback((tokenGuardado, tenantActual) => {
    if (!tenantActual) return false
    const payload = obtenerPayloadToken(tokenGuardado)
    if (!payload?.tenant_slug) return false
    return payload.tenant_slug === tenantActual
  }, [])

  const limpiarEstadoSesion = useCallback(() => {
    setLogueado(false)
    setUsuarios([])
    setToken('')
    setUsuarioLogueado(null)
  }, [])

  const cerrarSesion = useCallback(async () => {
    const tenantActual = obtenerTenantDesdeUrl()
    const tokenActual = token

    try {
      await logout(tokenActual)
    } catch (error) {
      console.error('Error cerrando sesión en el servidor:', error)
    } finally {
      eliminarSesionTenant(tenantActual, tokenActual)
      eliminarSesionSuper(tenantActual, tokenActual)
      limpiarEstadoSesion()
      setMensajeSesion('')
    }
  }, [token, eliminarSesionTenant, eliminarSesionSuper, limpiarEstadoSesion])

  const manejarSesionExpirada = useCallback(async (tokenParaCerrar = tokenRef.current) => {
    if (cerrandoSesionExpiradaRef.current) return
    cerrandoSesionExpiradaRef.current = true

    const tenantActual = obtenerTenantDesdeUrl()
    const tokenActual = tokenParaCerrar

    try {
      if (tokenActual) {
        await logout(tokenActual)
        console.info('[AUTH] Sesión expirada registrada y cerrada en el servidor.')
      }
    } catch (error) {
      console.error('[AUTH] Error registrando cierre por expiración:', error)
    } finally {
      eliminarSesionTenant(tenantActual, tokenActual)
      eliminarSesionSuper(tenantActual, tokenActual)
      limpiarEstadoSesion()
      setMensajeSesion('Tu sesión ha expirado. Inicia sesión nuevamente.')
      cerrandoSesionExpiradaRef.current = false
    }
  }, [eliminarSesionTenant, eliminarSesionSuper, limpiarEstadoSesion])

  const cargarDatos = useCallback(async (tokenGuardado) => {
    try {
      if (!tokenGuardado) {
        limpiarEstadoSesion()
        setCargando(false)
        return
      }

      const tenantActual = obtenerTenantDesdeUrl()
      const payload = obtenerPayloadToken(tokenGuardado)

      if (!payload) {
        limpiarEstadoSesion()
        setMensajeSesion('No fue posible validar la sesión.')
        return
      }

      if (tokenEstaExpirado(tokenGuardado)) {
        await manejarSesionExpirada(tokenGuardado)
        return
      }

      if (!validarTenantToken(tokenGuardado, tenantActual)) {
        limpiarEstadoSesion()
        setMensajeSesion('La sesión no corresponde a la empresa seleccionada.')
        return
      }

      const esSuper = payload?.user_type === 'SUPER'

      const usuarioActual = esSuper
        ? {
            dni: payload?.global_user_id ?? payload?.sub ?? null,
            name: payload?.name ?? null,
            email: payload?.email ?? null,
            tenant_id: payload?.tenant_id ?? null,
            tenant_slug: payload?.tenant_slug ?? null,
            user_tenant_id: payload?.user_tenant_id ?? null,
            user_type: 'SUPER',
            global_user_id: payload?.global_user_id ?? null,
            session_id: payload?.session_id ?? null,
          }
        : {
            dni: payload?.sub ?? null,
            name: payload?.name ?? null,
            tenant_id: payload?.tenant_id ?? null,
            tenant_slug: payload?.tenant_slug ?? null,
            user_tenant_id: payload?.user_tenant_id ?? null,
            user_type: 'TENANT',
          }

      setToken(tokenGuardado)
      setUsuarioLogueado(usuarioActual)
      setLogueado(true)
      setMensajeSesion('')
      ultimaActividadRef.current = Date.now()
    } catch (error) {
      console.error('Error validando sesión:', error)
      if (error?.status === 401) {
        await manejarSesionExpirada(tokenGuardado)
      } else {
        limpiarEstadoSesion()
        setMensajeSesion(error?.message || 'No fue posible validar la sesión.')
      }
    } finally {
      setCargando(false)
    }
  }, [validarTenantToken, limpiarEstadoSesion, manejarSesionExpirada])

  const iniciarSesion = useCallback(async (
    username,
    password,
    esSuper = false,
    otp = ''
  ) => {
    try {
      const tenantActual = obtenerTenantDesdeUrl()

      if (!tenantActual) {
        throw new Error('No se pudo determinar la empresa desde la URL.')
      }

      setMensajeSesion('')

      const resultado = await login(
        username,
        password,
        tenantActual,
        esSuper,
        otp
      )

      if (!resultado?.access_token) {
        throw new Error('El servidor no devolvió un token de acceso.')
      }

      const nuevoToken = resultado.access_token
      const payload = obtenerPayloadToken(nuevoToken)

      if (!payload) {
        throw new Error('El servidor devolvió un token inválido.')
      }

      if (tokenEstaExpirado(nuevoToken)) {
        throw new Error('El servidor devolvió una sesión expirada.')
      }

      if (!validarTenantToken(nuevoToken, tenantActual)) {
        throw new Error('La sesión recibida no corresponde a la empresa seleccionada.')
      }

      const tipoToken = payload?.user_type === 'SUPER' ? 'SUPER' : 'TENANT'

      if (tipoToken === 'SUPER') {
        guardarSesionSuper(tenantActual, nuevoToken)
      } else {
        guardarSesionTenant(tenantActual, nuevoToken)
      }

      ultimaActividadRef.current = Date.now()
      await cargarDatos(nuevoToken)
      return resultado
    } catch (error) {
      console.error('Error iniciando sesión:', error)
      throw error
    }
  }, [validarTenantToken, guardarSesionSuper, guardarSesionTenant, cargarDatos])

  const renovarTokenSiCorresponde = useCallback(async () => {
    if (!token || !logueado || document.hidden || renovandoSesionRef.current) return
    if (Date.now() - ultimaActividadRef.current > RECENT_ACTIVITY_WINDOW_MS) return

    const payload = obtenerPayloadToken(token)
    if (!payload?.exp || !payload?.refresh_at) return

    const ahora = Math.floor(Date.now() / 1000)
    if (ahora < payload.refresh_at) return

    renovandoSesionRef.current = true

    const segundosRestantes = Math.max(payload.exp - ahora, 0)
    console.info(
      `[AUTH] Renovación de sesión iniciada. Token actual: ${segundosRestantes} segundos restantes.`
    )

    try {
      const resultado = await renovarSesion(token)

      if (!resultado?.access_token) {
        throw new Error('El servidor no devolvió un token renovado.')
      }

      const nuevoToken = resultado.access_token
      const nuevoPayload = obtenerPayloadToken(nuevoToken)
      const tenantActual = obtenerTenantDesdeUrl()
      const esSuper = payload?.user_type === 'SUPER'

      if (esSuper) {
        guardarSesionSuper(tenantActual, nuevoToken)
      } else {
        guardarSesionTenant(tenantActual, nuevoToken)
      }

      setToken(nuevoToken)
      ultimaActividadRef.current = Date.now()

      const nuevosSegundosRestantes = nuevoPayload?.exp
        ? Math.max(nuevoPayload.exp - Math.floor(Date.now() / 1000), 0)
        : 0
      console.info(
        `[AUTH] Refresh exitoso. Nuevo token válido por ${nuevosSegundosRestantes} segundos.`
      )
    } catch (error) {
      console.error('[AUTH] Error renovando sesión:', error)
      if (error?.status === 401) {
        await manejarSesionExpirada()
      }
    } finally {
      renovandoSesionRef.current = false
    }
  }, [token, logueado, guardarSesionSuper, guardarSesionTenant, manejarSesionExpirada])

  useEffect(() => {
    const registrarActividad = () => {
      const ahora = Date.now()
      if (ahora - ultimoEventoActividadRef.current < ACTIVITY_THROTTLE_MS) return
      ultimoEventoActividadRef.current = ahora
      ultimaActividadRef.current = ahora
    }

    const eventos = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart', 'pointerdown']
    eventos.forEach((evento) => window.addEventListener(evento, registrarActividad, { passive: true }))

    return () => {
      eventos.forEach((evento) => window.removeEventListener(evento, registrarActividad))
    }
  }, [])

  useEffect(() => {
    if (!logueado || !token) return undefined

    const intervalo = window.setInterval(() => {
      void renovarTokenSiCorresponde()
    }, ACTIVITY_CHECK_INTERVAL_MS)

    return () => window.clearInterval(intervalo)
  }, [logueado, token, renovarTokenSiCorresponde])

  useEffect(() => {
    const validarSesion = async () => {
      const tenantActual = obtenerTenantDesdeUrl()

      if (!tenantActual) {
        limpiarEstadoSesion()
        setCargando(false)
        return
      }

      const tokenSuper = obtenerSesionSuper(tenantActual)

      if (
        tokenSuper &&
        obtenerPayloadToken(tokenSuper)?.user_type === 'SUPER' &&
        !tokenEstaExpirado(tokenSuper) &&
        validarTenantToken(tokenSuper, tenantActual)
      ) {
        setCargando(true)
        await cargarDatos(tokenSuper)
        return
      }

      if (tokenSuper) {
        if (tokenEstaExpirado(tokenSuper)) {
          await manejarSesionExpirada(tokenSuper)
          setCargando(false)
          return
        }
        eliminarSesionSuper(tenantActual, tokenSuper)
      }

      const tokenTenant = obtenerSesionTenant(tenantActual)

      if (!tokenTenant) {
        limpiarEstadoSesion()
        setMensajeSesion('')
        setCargando(false)
        return
      }

      if (tokenEstaExpirado(tokenTenant)) {
        await manejarSesionExpirada(tokenTenant)
        setCargando(false)
        return
      }

      setCargando(true)
      await cargarDatos(tokenTenant)
    }

    void validarSesion()
  }, [
    obtenerSesionSuper,
    obtenerSesionTenant,
    eliminarSesionSuper,
    eliminarSesionTenant,
    validarTenantToken,
    cargarDatos,
    manejarSesionExpirada,
    limpiarEstadoSesion,
  ])

  const permissions = useMemo(() => {
    const payloadActual = obtenerPayloadToken(token)
    return Array.isArray(payloadActual?.permissions)
      ? payloadActual.permissions
      : []
  }, [token])

  const hasPermission = useCallback((permission) => (
    typeof permission === 'string' && permissions.includes(permission)
  ), [permissions])

  const value = {
    tenant,
    logueado,
    token,
    usuarioLogueado,
    cargando,
    mensajeSesion,
    usuarios,
    setUsuarios,
    iniciarSesion,
    cerrarSesion,
    manejarSesionExpirada,
    cargarDatos,
    setMensajeSesion,
    permissions,
    hasPermission,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
