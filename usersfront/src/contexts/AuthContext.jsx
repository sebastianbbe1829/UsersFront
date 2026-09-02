import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'

import {
  obtenerPayloadToken,
  tokenEstaExpirado,
  login,
} from '../services/api'

import {
  obtenerTenantDesdeUrl,
} from '../utils/tenant'


// ============================================================
// CREAR CONTEXT
// ============================================================

const AuthContext = createContext(null)


// ============================================================
// CONSTANTES LOCAL STORAGE
// ============================================================

const TENANT_SESSIONS_KEY =
  'tenant_sessions'

const SUPER_SESSIONS_KEY =
  'super_sessions'


// ============================================================
// PROVEEDOR
// ============================================================

export function AuthProvider({ children }) {

  const [tenant, setTenant] =
    useState(() => obtenerTenantDesdeUrl())

  const [logueado, setLogueado] =
    useState(false)

  const [token, setToken] =
    useState('')

  const [usuarioLogueado, setUsuarioLogueado] =
    useState(null)

  const [cargando, setCargando] =
    useState(true)

  const [mensajeSesion, setMensajeSesion] =
    useState('')

  const [usuarios, setUsuarios] =
    useState([])


  // ==========================================================
  // STORAGE GENÉRICO
  // ==========================================================

  const obtenerSesiones =
    useCallback((key) => {
      try {
        const sesiones = localStorage.getItem(key)

        if (!sesiones) {
          return {}
        }

        const resultado = JSON.parse(sesiones)

        if (!resultado || typeof resultado !== 'object') {
          return {}
        }

        return resultado
      } catch (error) {
        console.error('Error leyendo sesiones:', error)
        return {}
      }
    }, [])


  const guardarSesion =
    useCallback((key, tenantActual, tokenNuevo) => {
      if (!tenantActual || !tokenNuevo) {
        return
      }

      const sesiones = obtenerSesiones(key)
      sesiones[tenantActual] = tokenNuevo

      localStorage.setItem(
        key,
        JSON.stringify(sesiones)
      )
    }, [obtenerSesiones])


  const obtenerSesion =
    useCallback((key, tenantActual) => {
      if (!tenantActual) {
        return null
      }

      const sesiones = obtenerSesiones(key)
      return sesiones[tenantActual] || null
    }, [obtenerSesiones])


  const eliminarSesion =
    useCallback((key, tenantActual, tokenEsperado = null) => {
      if (!tenantActual) {
        return
      }

      const sesiones = obtenerSesiones(key)

      if (
        tokenEsperado !== null &&
        sesiones[tenantActual] !== tokenEsperado
      ) {
        return
      }

      delete sesiones[tenantActual]

      localStorage.setItem(
        key,
        JSON.stringify(sesiones)
      )
    }, [obtenerSesiones])


  // ==========================================================
  // SESIONES TENANT
  // ==========================================================

  const obtenerSesionesTenants =
    useCallback(() => (
      obtenerSesiones(TENANT_SESSIONS_KEY)
    ), [obtenerSesiones])

  const guardarSesionTenant =
    useCallback((tenantActual, tokenNuevo) => {
      guardarSesion(
        TENANT_SESSIONS_KEY,
        tenantActual,
        tokenNuevo
      )
    }, [guardarSesion])

  const obtenerSesionTenant =
    useCallback((tenantActual) => (
      obtenerSesion(
        TENANT_SESSIONS_KEY,
        tenantActual
      )
    ), [obtenerSesion])

  const eliminarSesionTenant =
    useCallback((tenantActual, tokenEsperado = null) => {
      eliminarSesion(
        TENANT_SESSIONS_KEY,
        tenantActual,
        tokenEsperado
      )
    }, [eliminarSesion])


  // ==========================================================
  // SESIONES SUPER
  // ==========================================================

  const guardarSesionSuper =
    useCallback((tenantActual, tokenNuevo) => {
      guardarSesion(
        SUPER_SESSIONS_KEY,
        tenantActual,
        tokenNuevo
      )
    }, [guardarSesion])

  const obtenerSesionSuper =
    useCallback((tenantActual) => (
      obtenerSesion(
        SUPER_SESSIONS_KEY,
        tenantActual
      )
    ), [obtenerSesion])

  const eliminarSesionSuper =
    useCallback((tenantActual, tokenEsperado = null) => {
      eliminarSesion(
        SUPER_SESSIONS_KEY,
        tenantActual,
        tokenEsperado
      )
    }, [eliminarSesion])


  // ==========================================================
  // VALIDAR TENANT DEL TOKEN
  // ==========================================================

  const validarTenantToken =
    useCallback((tokenGuardado, tenantActual) => {
      if (!tenantActual) {
        return false
      }

      const payload = obtenerPayloadToken(tokenGuardado)

      if (!payload?.tenant_slug) {
        return false
      }

      return payload.tenant_slug === tenantActual
    }, [])


  // ==========================================================
  // LIMPIAR ESTADO
  // ==========================================================

  const limpiarEstadoSesion =
    useCallback(() => {
      setLogueado(false)
      setUsuarios([])
      setToken('')
      setUsuarioLogueado(null)
    }, [])


  // ==========================================================
  // CERRAR SESIÓN
  // ==========================================================

  const cerrarSesion =
    useCallback(() => {
      const tenantActual = obtenerTenantDesdeUrl()

      eliminarSesionTenant(tenantActual)
      eliminarSesionSuper(tenantActual)

      limpiarEstadoSesion()
      setMensajeSesion('')
    }, [
      eliminarSesionTenant,
      eliminarSesionSuper,
      limpiarEstadoSesion,
    ])


  // ==========================================================
  // SESIÓN EXPIRADA
  // ==========================================================

  const manejarSesionExpirada =
    useCallback(() => {
      const tenantActual = obtenerTenantDesdeUrl()

      eliminarSesionTenant(tenantActual)
      eliminarSesionSuper(tenantActual)

      limpiarEstadoSesion()

      setMensajeSesion(
        'Tu sesión ha expirado. Inicia sesión nuevamente.'
      )
    }, [
      eliminarSesionTenant,
      eliminarSesionSuper,
      limpiarEstadoSesion,
    ])


  // ==========================================================
  // CARGAR DATOS DE SESIÓN DESDE JWT
  // ==========================================================

  const cargarDatos =
    useCallback(async (tokenGuardado) => {
      try {
        if (!tokenGuardado) {
          limpiarEstadoSesion()
          setCargando(false)
          return
        }

        const tenantActual = obtenerTenantDesdeUrl()
        setTenant(tenantActual)

        const payload = obtenerPayloadToken(tokenGuardado)

        if (!payload) {
          limpiarEstadoSesion()
          setMensajeSesion('No fue posible validar la sesión.')
          return
        }

        // Nunca permitimos reconstruir una sesión con un JWT vencido.
        if (tokenEstaExpirado(tokenGuardado)) {
          manejarSesionExpirada()
          return
        }

        if (!validarTenantToken(tokenGuardado, tenantActual)) {
          limpiarEstadoSesion()
          setMensajeSesion(
            'La sesión no corresponde a la empresa seleccionada.'
          )
          return
        }

        const esSuper =
          payload?.user_type === 'SUPER'

        const usuarioActual = esSuper
          ? {
              dni:
                payload?.global_user_id ?? payload?.sub ?? null,
              name:
                payload?.name ?? null,
              email:
                payload?.email ?? null,
              tenant_id:
                payload?.tenant_id ?? null,
              tenant_slug:
                payload?.tenant_slug ?? null,
              user_tenant_id:
                payload?.user_tenant_id ?? null,
              user_type: 'SUPER',
              global_user_id:
                payload?.global_user_id ?? null,
              session_id:
                payload?.session_id ?? null,
            }
          : {
              dni:
                payload?.sub ?? null,
              name:
                payload?.name ?? null,
              tenant_id:
                payload?.tenant_id ?? null,
              tenant_slug:
                payload?.tenant_slug ?? null,
              user_tenant_id:
                payload?.user_tenant_id ?? null,
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
          setMensajeSesion(
            error?.message ||
            'No fue posible validar la sesión.'
          )
        }
      } finally {
        setCargando(false)
      }
    }, [
      validarTenantToken,
      limpiarEstadoSesion,
      manejarSesionExpirada,
    ])


  // ==========================================================
  // LOGIN UNIFICADO
  // ==========================================================

  const iniciarSesion =
    useCallback(async (
      username,
      password,
      esSuper = false,
      otp = ''
    ) => {
      try {
        const tenantActual = obtenerTenantDesdeUrl()

        if (!tenantActual) {
          throw new Error(
            'No se pudo determinar la empresa desde la URL.'
          )
        }

        setTenant(tenantActual)
        setMensajeSesion('')

        const resultado = await login(
          username,
          password,
          tenantActual,
          esSuper,
          otp
        )

        if (!resultado?.access_token) {
          throw new Error(
            'El servidor no devolvió un token de acceso.'
          )
        }

        const nuevoToken = resultado.access_token
        const payload = obtenerPayloadToken(nuevoToken)

        if (!payload) {
          throw new Error(
            'El servidor devolvió un token inválido.'
          )
        }

        if (tokenEstaExpirado(nuevoToken)) {
          throw new Error(
            'El servidor devolvió una sesión expirada.'
          )
        }

        if (!validarTenantToken(nuevoToken, tenantActual)) {
          throw new Error(
            'La sesión recibida no corresponde a la empresa seleccionada.'
          )
        }

        const tipoToken =
          payload?.user_type === 'SUPER'
            ? 'SUPER'
            : 'TENANT'

        // El almacenamiento se separa por tipo de sesión.
        // Un SUPER nunca se guarda como sesión TENANT.
        if (tipoToken === 'SUPER') {
          guardarSesionSuper(
            tenantActual,
            nuevoToken
          )

          // Si existía una sesión TENANT anterior para este tenant,
          // no la eliminamos: puede seguir siendo válida al volver
          // a entrar sin modo SUPER.
        } else {
          guardarSesionTenant(
            tenantActual,
            nuevoToken
          )
        }

        await cargarDatos(nuevoToken)

        return resultado

      } catch (error) {
        console.error(
          'Error iniciando sesión:',
          error
        )
        throw error
      }
    }, [
      validarTenantToken,
      guardarSesionSuper,
      guardarSesionTenant,
      cargarDatos,
    ])


  // ==========================================================
  // VALIDAR SESIÓN AL ABRIR / CAMBIAR TENANT
  // ==========================================================

  useEffect(() => {
    const tenantActual = obtenerTenantDesdeUrl()

    setTenant(tenantActual)

    if (!tenantActual) {
      limpiarEstadoSesion()
      setCargando(false)
      return
    }

    // SUPER tiene prioridad cuando existe una sesión SUPER válida.
    // Esto permite conservar la sesión elevada al navegar por el tenant.
    const tokenSuper = obtenerSesionSuper(tenantActual)

    if (tokenSuper) {
      const payloadSuper = obtenerPayloadToken(tokenSuper)

      if (
        payloadSuper?.user_type === 'SUPER' &&
        !tokenEstaExpirado(tokenSuper) &&
        validarTenantToken(tokenSuper, tenantActual)
      ) {
        setCargando(true)
        cargarDatos(tokenSuper)
        return
      }

      eliminarSesionSuper(
        tenantActual,
        tokenSuper
      )
    }

    // Si no hay SUPER válido, se intenta la sesión normal del tenant.
    const tokenTenant = obtenerSesionTenant(tenantActual)

    if (!tokenTenant) {
      limpiarEstadoSesion()
      setMensajeSesion('')
      setCargando(false)
      return
    }

    if (tokenEstaExpirado(tokenTenant)) {
      eliminarSesionTenant(
        tenantActual,
        tokenTenant
      )
      limpiarEstadoSesion()
      setMensajeSesion('')
      setCargando(false)
      return
    }

    setCargando(true)
    cargarDatos(tokenTenant)

  }, [
    obtenerSesionSuper,
    obtenerSesionTenant,
    eliminarSesionSuper,
    eliminarSesionTenant,
    validarTenantToken,
    cargarDatos,
    limpiarEstadoSesion,
  ])


  // ==========================================================
  // PERMISOS DEL JWT
  // ==========================================================

  const payloadActual = obtenerPayloadToken(token)

  const permissions = Array.isArray(payloadActual?.permissions)
    ? payloadActual.permissions
    : []

  const hasPermission = useCallback((permission) => (
    typeof permission === 'string' &&
    permissions.includes(permission)
  ), [permissions])


  // ==========================================================
  // VALOR DEL CONTEXT
  // ==========================================================

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


// ============================================================
// HOOK PERSONALIZADO
// ============================================================

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider'
    )
  }

  return context
}
