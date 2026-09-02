import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  obtenerPayloadToken,
  tokenEstaExpirado,
  login,
} from '../services/api'

import {
  obtenerTenantDesdeUrl,
} from '../utils/tenant'

import { AuthContext } from './AuthContextValue'

const TENANT_SESSIONS_KEY = 'tenant_sessions'
const SUPER_SESSIONS_KEY = 'super_sessions'

export function AuthProvider({ children }) {
  const tenant = obtenerTenantDesdeUrl()

  const [logueado, setLogueado] = useState(false)
  const [token, setToken] = useState('')
  const [usuarioLogueado, setUsuarioLogueado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mensajeSesion, setMensajeSesion] = useState('')
  const [usuarios, setUsuarios] = useState([])

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

  const cerrarSesion = useCallback(() => {
    const tenantActual = obtenerTenantDesdeUrl()
    eliminarSesionTenant(tenantActual)
    eliminarSesionSuper(tenantActual)
    limpiarEstadoSesion()
    setMensajeSesion('')
  }, [eliminarSesionTenant, eliminarSesionSuper, limpiarEstadoSesion])

  const manejarSesionExpirada = useCallback(() => {
    const tenantActual = obtenerTenantDesdeUrl()
    eliminarSesionTenant(tenantActual)
    eliminarSesionSuper(tenantActual)
    limpiarEstadoSesion()
    setMensajeSesion('Tu sesión ha expirado. Inicia sesión nuevamente.')
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
        manejarSesionExpirada()
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
    } catch (error) {
      console.error('Error validando sesión:', error)
      if (error?.status === 401) {
        manejarSesionExpirada()
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

      await cargarDatos(nuevoToken)
      return resultado
    } catch (error) {
      console.error('Error iniciando sesión:', error)
      throw error
    }
  }, [validarTenantToken, guardarSesionSuper, guardarSesionTenant, cargarDatos])

  useEffect(() => {
    const validarSesion = async () => {
      const tenantActual = obtenerTenantDesdeUrl()

      if (!tenantActual) {
        limpiarEstadoSesion()
        setCargando(false)
        return
      }

      const tokenSuper = obtenerSesionSuper(tenantActual)

      if (tokenSuper) {
        const payloadSuper = obtenerPayloadToken(tokenSuper)

        if (
          payloadSuper?.user_type === 'SUPER' &&
          !tokenEstaExpirado(tokenSuper) &&
          validarTenantToken(tokenSuper, tenantActual)
        ) {
          setCargando(true)
          await cargarDatos(tokenSuper)
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
        eliminarSesionTenant(tenantActual, tokenTenant)
        limpiarEstadoSesion()
        setMensajeSesion('')
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
