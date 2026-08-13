import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'

import {
  obtenerUsuarios,
  obtenerPayloadToken,
  login,
} from '../services/api'


// ==========================
// CREAR CONTEXT
// ==========================

const AuthContext = createContext(null)


// ==========================
// PROVEEDOR
// ==========================

export function AuthProvider({ children }) {

  // ==========================
  // SESIÓN
  // ==========================

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


  // ==========================
  // CERRAR SESIÓN
  // ==========================

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem('access_token')
    setLogueado(false)
    setUsuarios([])
    setToken('')
    setUsuarioLogueado(null)
    setMensajeSesion('')
  }, [])


  // ==========================
  // SESIÓN EXPIRADA
  // ==========================

  const manejarSesionExpirada =
    useCallback(() => {
      console.log('Sesión expirada.')
      cerrarSesion()
      setMensajeSesion(
        'Tu sesión ha expirado. Inicia sesión nuevamente.'
      )
    }, [cerrarSesion])


  // ==========================
  // LOGIN
  // ==========================

  const iniciarSesion = useCallback(
    async (username, password) => {
      try {
        const resultado = await login(username, password)
        localStorage.setItem(
          'access_token',
          resultado.access_token
        )
        await cargarDatos(resultado.access_token)
        return resultado
      } catch (error) {
        throw error
      }
    },
    []
  )


  // ==========================
  // CARGAR DATOS
  // ==========================

  const cargarDatos = useCallback(
    async (tokenGuardado) => {
      try {
        const resultado =
          await obtenerUsuarios(tokenGuardado)

        setToken(tokenGuardado)
        setUsuarios(resultado)

        const payload =
          obtenerPayloadToken(tokenGuardado)

        const usuarioActual = resultado.find(
          (usuario) =>
            usuario.dni === payload?.sub
        )

        setUsuarioLogueado(usuarioActual || null)
        setLogueado(true)
      } catch (error) {
        console.error(
          'Error validando sesión:',
          error
        )

        localStorage.removeItem('access_token')
        setLogueado(false)
        setUsuarioLogueado(null)

        if (error.status === 401) {
          manejarSesionExpirada()
        }
      } finally {
        setCargando(false)
      }
    },
    [manejarSesionExpirada]
  )


  // ==========================
  // VALIDAR SESIÓN AL ABRIR
  // ==========================

  useEffect(() => {
    const tokenGuardado =
      localStorage.getItem('access_token')

    if (!tokenGuardado) {
      setCargando(false)
      return
    }

    cargarDatos(tokenGuardado)
  }, [cargarDatos])


  // ==========================
  // VALOR DEL CONTEXT
  // ==========================

  const value = {
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
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}


// ==========================
// HOOK PERSONALIZADO
// ==========================

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider'
    )
  }

  return context
}
