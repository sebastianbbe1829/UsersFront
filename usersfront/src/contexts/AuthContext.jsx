import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'

import {
  obtenerPayloadToken,
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
// CONSTANTE LOCAL STORAGE
// ============================================================

const TENANT_SESSIONS_KEY =
  'tenant_sessions'


// ============================================================
// PROVEEDOR
// ============================================================

export function AuthProvider({ children }) {

  // ==========================================================
  // TENANT
  // ==========================================================

  const [tenant, setTenant] =
    useState(() =>
      obtenerTenantDesdeUrl()
    )


  // ==========================================================
  // SESIÓN
  // ==========================================================

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
  // OBTENER SESIONES DE TENANTS
  // ==========================================================

  const obtenerSesionesTenants =
    useCallback(() => {

      try {

        const sesiones =
          localStorage.getItem(
            TENANT_SESSIONS_KEY
          )

        if (!sesiones) {
          return {}
        }

        const resultado =
          JSON.parse(sesiones)

        if (
          !resultado ||
          typeof resultado !== 'object'
        ) {
          return {}
        }

        return resultado

      } catch (error) {

        console.error(
          'Error leyendo sesiones de tenants:',
          error
        )

        return {}

      }

    }, [])


  // ==========================================================
  // GUARDAR TOKEN DEL TENANT
  // ==========================================================

  const guardarSesionTenant =
    useCallback(
      (
        tenantActual,
        tokenNuevo
      ) => {

        if (
          !tenantActual ||
          !tokenNuevo
        ) {
          return
        }

        const sesiones =
          obtenerSesionesTenants()

        sesiones[tenantActual] =
          tokenNuevo

        localStorage.setItem(
          TENANT_SESSIONS_KEY,
          JSON.stringify(sesiones)
        )

      },
      [
        obtenerSesionesTenants,
      ]
    )


  // ==========================================================
  // OBTENER TOKEN DEL TENANT
  // ==========================================================

  const obtenerSesionTenant =
    useCallback(
      (
        tenantActual
      ) => {

        if (!tenantActual) {
          return null
        }

        const sesiones =
          obtenerSesionesTenants()

        return (
          sesiones[tenantActual] ||
          null
        )

      },
      [
        obtenerSesionesTenants,
      ]
    )


  // ==========================================================
  // ELIMINAR SESIÓN DEL TENANT
  // ==========================================================

  const eliminarSesionTenant =
    useCallback(
      (
        tenantActual
      ) => {

        if (!tenantActual) {
          return
        }

        const sesiones =
          obtenerSesionesTenants()

        delete sesiones[tenantActual]

        localStorage.setItem(
          TENANT_SESSIONS_KEY,
          JSON.stringify(sesiones)
        )

      },
      [
        obtenerSesionesTenants,
      ]
    )


  // ==========================================================
  // VALIDAR TENANT DEL TOKEN
  // ==========================================================

  const validarTenantToken =
    useCallback(
      (
        tokenGuardado,
        tenantActual
      ) => {

        // ----------------------------------------------------
        // Tenant obligatorio
        // ----------------------------------------------------

        if (!tenantActual) {

          console.warn(
            'No existe tenant en la URL.'
          )

          return false

        }


        // ----------------------------------------------------
        // Obtener payload
        // ----------------------------------------------------

        const payload =
          obtenerPayloadToken(
            tokenGuardado
          )

        if (!payload) {

          console.warn(
            'No fue posible obtener el payload del JWT.'
          )

          return false

        }


        // ----------------------------------------------------
        // Tenant del JWT
        // ----------------------------------------------------

        const tenantToken =
          payload?.tenant_slug

        if (!tenantToken) {

          console.warn(
            'El JWT no contiene tenant_slug.'
          )

          return false

        }


        // ----------------------------------------------------
        // Comparación
        // ----------------------------------------------------

        const coincide =
          tenantToken === tenantActual

        console.log(
          'Validación tenant:',
          {
            tenantUrl:
              tenantActual,

            tenantToken:
              tenantToken,

            coincide,
          }
        )

        return coincide

      },
      []
    )


  // ==========================================================
  // LIMPIAR ESTADO DE SESIÓN
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

      const tenantActual =
        obtenerTenantDesdeUrl()

      console.log(
        'Cerrando sesión del tenant:',
        tenantActual
      )


      // ------------------------------------------------------
      // Eliminar solamente la sesión actual
      // ------------------------------------------------------

      eliminarSesionTenant(
        tenantActual
      )


      // ------------------------------------------------------
      // Limpiar estado React
      // ------------------------------------------------------

      limpiarEstadoSesion()


      // ------------------------------------------------------
      // Limpiar mensaje
      // ------------------------------------------------------

      setMensajeSesion('')

    }, [
      eliminarSesionTenant,
      limpiarEstadoSesion,
    ])


  // ==========================================================
  // SESIÓN EXPIRADA
  // ==========================================================

  const manejarSesionExpirada =
    useCallback(() => {

      const tenantActual =
        obtenerTenantDesdeUrl()

      console.log(
        'Sesión expirada para tenant:',
        tenantActual
      )


      // ------------------------------------------------------
      // Eliminar solamente la sesión de este tenant
      // ------------------------------------------------------

      eliminarSesionTenant(
        tenantActual
      )


      // ------------------------------------------------------
      // Limpiar estado
      // ------------------------------------------------------

      limpiarEstadoSesion()


      // ------------------------------------------------------
      // Mensaje
      // ------------------------------------------------------

      setMensajeSesion(
        'Tu sesión ha expirado. Inicia sesión nuevamente.'
      )

    }, [
      eliminarSesionTenant,
      limpiarEstadoSesion,
    ])


  // ==========================================================
  // CARGAR DATOS DE SESIÓN
  // ==========================================================
  //
  // IMPORTANTE:
  //
  // Esta función NO consulta /users.
  //
  // El JWT ya contiene:
  //
  //   sub
  //   name
  //   tenant_id
  //   tenant_slug
  //   user_tenant_id
  //   exp
  //
  // Por lo tanto podemos identificar al usuario directamente
  // desde el token.
  //
  // La consulta GET /users solamente debe realizarse cuando
  // alguna funcionalidad realmente necesite listar usuarios
  // y tenga el permiso correspondiente.
  //
  // ==========================================================

  const cargarDatos =
    useCallback(
      async (
        tokenGuardado
      ) => {

        try {

          // ==================================================
          // VALIDAR TOKEN
          // ==================================================

          if (!tokenGuardado) {

            limpiarEstadoSesion()

            setCargando(false)

            return

          }


          // ==================================================
          // TENANT ACTUAL
          // ==================================================

          const tenantActual =
            obtenerTenantDesdeUrl()

          setTenant(
            tenantActual
          )


          // ==================================================
          // VALIDAR TENANT
          // ==========================================================

          const tenantValido =
            validarTenantToken(
              tokenGuardado,
              tenantActual
            )

          if (!tenantValido) {

            console.warn(
              'El token no pertenece al tenant de la URL.'
            )


            // ------------------------------------------------
            // Solamente eliminar la sesión del tenant actual
            // si corresponde exactamente al token utilizado.
            // ------------------------------------------------

            const sesiones =
              obtenerSesionesTenants()

            if (
              tenantActual &&
              sesiones[tenantActual] === tokenGuardado
            ) {

              eliminarSesionTenant(
                tenantActual
              )

            }


            limpiarEstadoSesion()

            setMensajeSesion(
              'La sesión no corresponde a la empresa seleccionada.'
            )

            return

          }


          // ==================================================
          // OBTENER PAYLOAD DEL JWT
          // ==================================================

          const payload =
            obtenerPayloadToken(
              tokenGuardado
            )

          if (!payload) {

            console.warn(
              'No fue posible obtener el payload del JWT.'
            )

            limpiarEstadoSesion()

            setMensajeSesion(
              'No fue posible validar la sesión.'
            )

            return

          }


          // ==================================================
          // GUARDAR TOKEN EN ESTADO
          // ==================================================

          setToken(
            tokenGuardado
          )


          // ==================================================
          // IDENTIFICAR USUARIO DESDE EL JWT
          // ==================================================
          //
          // Ya NO hacemos:
          //
          // GET /users
          //
          // El JWT ya contiene la información necesaria.
          // ==================================================

          const usuarioActual = {
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
          }


          // ==================================================
          // GUARDAR USUARIO LOGUEADO
          // ==================================================

          setUsuarioLogueado(
            usuarioActual
          )


          // ==================================================
          // SESIÓN VÁLIDA
          // ==================================================

          setLogueado(
            true
          )


          // ==================================================
          // LIMPIAR MENSAJE
          // ==================================================

          setMensajeSesion('')


        } catch (error) {

          console.error(
            'Error validando sesión:',
            error
          )

          const tenantActual =
            obtenerTenantDesdeUrl()


          // ==================================================
          // ERROR 401
          // ==================================================

          if (
            error.status === 401
          ) {

            manejarSesionExpirada()

          } else {

            // ----------------------------------------------
            // Si el token almacenado pertenece al tenant
            // actual, lo eliminamos.
            // ----------------------------------------------

            const sesiones =
              obtenerSesionesTenants()

            if (
              tenantActual &&
              sesiones[tenantActual] === tokenGuardado
            ) {

              eliminarSesionTenant(
                tenantActual
              )

            }

            limpiarEstadoSesion()

            setMensajeSesion(
              error.message ||
              'No fue posible validar la sesión.'
            )

          }

        } finally {

          setCargando(
            false
          )

        }

      },
      [
        validarTenantToken,
        obtenerSesionesTenants,
        eliminarSesionTenant,
        limpiarEstadoSesion,
        manejarSesionExpirada,
      ]
    )


  // ==========================================================
  // LOGIN
  // ==========================================================

  const iniciarSesion =
    useCallback(
      async (
        username,
        password
      ) => {

        try {

          // ==================================================
          // TENANT DESDE URL
          // ==================================================

          const tenantActual =
            obtenerTenantDesdeUrl()


          // ==================================================
          // VALIDAR TENANT
          // ==================================================

          if (!tenantActual) {

            throw new Error(
              'No se pudo determinar la empresa desde la URL.'
            )

          }


          // ==================================================
          // ACTUALIZAR TENANT
          // ==========================================================

          setTenant(
            tenantActual
          )

          console.log(
            'Tenant para login:',
            tenantActual
          )


          // ==================================================
          // LIMPIAR MENSAJE
          // ==========================================================

          setMensajeSesion('')


          // ==================================================
          // LOGIN MULTITENANT
          // ==========================================================

          const resultado =
            await login(
              username,
              password,
              tenantActual
            )


          // ==================================================
          // VALIDAR TOKEN
          // ==========================================================

          if (
            !resultado?.access_token
          ) {

            throw new Error(
              'El servidor no devolvió un token de acceso.'
            )

          }


          const nuevoToken =
            resultado.access_token


          // ==================================================
          // VALIDAR TENANT DEL JWT
          // ==================================================

          const tenantTokenValido =
            validarTenantToken(
              nuevoToken,
              tenantActual
            )

          if (!tenantTokenValido) {

            console.error(
              'El token recibido no corresponde al tenant solicitado.'
            )

            setLogueado(false)

            setUsuarios([])

            setToken('')

            setUsuarioLogueado(null)

            setMensajeSesion(
              'La sesión recibida no corresponde a la empresa seleccionada.'
            )

            throw new Error(
              'La sesión recibida no corresponde a la empresa seleccionada.'
            )

          }


          // ==================================================
          // GUARDAR SESIÓN POR TENANT
          // ==================================================

          guardarSesionTenant(
            tenantActual,
            nuevoToken
          )


          // ==================================================
          // CARGAR DATOS DE SESIÓN
          // ==================================================
          //
          // IMPORTANTE:
          //
          // cargarDatos() ya NO ejecuta GET /users.
          //
          // ==================================================

          await cargarDatos(
            nuevoToken
          )


          return resultado

        } catch (error) {

          console.error(
            'Error iniciando sesión:',
            error
          )

          throw error

        }

      },
      [
        validarTenantToken,
        guardarSesionTenant,
        cargarDatos,
      ]
    )


  // ==========================================================
  // VALIDAR SESIÓN AL ABRIR / CAMBIAR TENANT
  // ==========================================================

  useEffect(() => {

    // ========================================================
    // TENANT ACTUAL
    // ========================================================

    const tenantActual =
      obtenerTenantDesdeUrl()

    setTenant(
      tenantActual
    )


    // ========================================================
    // SIN TENANT
    // ========================================================

    if (!tenantActual) {

      limpiarEstadoSesion()

      setCargando(false)

      return

    }


    // ========================================================
    // BUSCAR SESIÓN DEL TENANT ACTUAL
    // ========================================================

    const tokenTenant =
      obtenerSesionTenant(
        tenantActual
      )


    // ========================================================
    // NO EXISTE SESIÓN PARA ESTE TENANT
    // ========================================================

    if (!tokenTenant) {

      limpiarEstadoSesion()

      setMensajeSesion('')

      setCargando(false)

      return

    }


    // ========================================================
    // EXISTE SESIÓN
    // ========================================================

    setCargando(true)

    cargarDatos(
      tokenTenant
    )

  }, [
    obtenerSesionTenant,
    limpiarEstadoSesion,
    cargarDatos,
  ])


  // ==========================================================
  // VALOR DEL CONTEXT
  // ==========================================================

  const value = {

    // --------------------------------------------------------
    // TENANT
    // --------------------------------------------------------

    tenant,


    // --------------------------------------------------------
    // SESIÓN
    // --------------------------------------------------------

    logueado,

    token,

    usuarioLogueado,

    cargando,

    mensajeSesion,


    // --------------------------------------------------------
    // DATOS
    // --------------------------------------------------------

    usuarios,

    setUsuarios,


    // --------------------------------------------------------
    // ACCIONES
    // --------------------------------------------------------

    iniciarSesion,

    cerrarSesion,

    manejarSesionExpirada,

    cargarDatos,


    // --------------------------------------------------------
    // MENSAJES
    // --------------------------------------------------------

    setMensajeSesion,

  }


  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (

    <AuthContext.Provider
      value={value}
    >

      {children}

    </AuthContext.Provider>

  )

}


// ============================================================
// HOOK PERSONALIZADO
// ============================================================

export function useAuth() {

  const context =
    useContext(
      AuthContext
    )

  if (!context) {

    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider'
    )

  }

  return context

}