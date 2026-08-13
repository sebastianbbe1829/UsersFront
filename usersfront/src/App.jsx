import {
  useEffect,
  useState,
  useCallback,
} from 'react'

import Login from './components/Login'
import UserTable from './components/UserTable'
import UserForm from './components/UserForm'
import EditUserForm from './components/EditUserForm'
import DeleteUserModal from './components/DeleteUserModal'
import Dashboard from './components/Dashboard'
import SessionManager from './components/SessionManager'

import {
  obtenerUsuarios,
  obtenerPayloadToken,
} from './services/api'


function App() {

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


  // ==========================
  // USUARIOS
  // ==========================

  const [usuarios, setUsuarios] =
    useState([])


  // ==========================
  // FORMULARIOS
  // ==========================

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false)

  const [usuarioEditando, setUsuarioEditando] =
    useState(null)

  const [usuarioEliminando, setUsuarioEliminando] =
    useState(null)


  // ==========================
  // MODO OSCURO
  // ==========================

  const [modoOscuro, setModoOscuro] =
    useState(() => {

      return (
        localStorage.getItem(
          'modo_oscuro'
        ) === 'true'
      )

    })


  // ==========================
  // APLICAR MODO OSCURO
  // ==========================

  useEffect(() => {

    localStorage.setItem(
      'modo_oscuro',
      modoOscuro
    )

  }, [
    modoOscuro,
  ])


  // ==========================
  // CERRAR SESIÓN
  // ==========================

  const cerrarSesion = useCallback(() => {

    localStorage.removeItem(
      'access_token'
    )

    setLogueado(false)

    setUsuarios([])

    setToken('')

    setUsuarioLogueado(null)

    setMostrarFormulario(false)

    setUsuarioEditando(null)

    setUsuarioEliminando(null)

  }, [])


  // ==========================
  // SESIÓN EXPIRADA
  // ==========================

  const manejarSesionExpirada =
    useCallback(() => {

      console.log(
        'Sesión expirada.'
      )

      localStorage.removeItem(
        'access_token'
      )

      setLogueado(false)

      setUsuarios([])

      setToken('')

      setUsuarioLogueado(null)

      setMostrarFormulario(false)

      setUsuarioEditando(null)

      setUsuarioEliminando(null)

      setMensajeSesion(
        'Tu sesión ha expirado. Inicia sesión nuevamente.'
      )

    }, [])


  // ==========================
  // VALIDAR SESIÓN AL ABRIR
  // ==========================

  useEffect(() => {

    const tokenGuardado =
      localStorage.getItem(
        'access_token'
      )


    if (!tokenGuardado) {

      setCargando(false)

      return
    }


    const cargarSesion = async () => {

      try {

        const resultado =
          await obtenerUsuarios(
            tokenGuardado
          )

        setToken(tokenGuardado)

        setUsuarios(resultado)


        // ==========================
        // OBTENER USUARIO LOGUEADO
        // ==========================

        const payload =
          obtenerPayloadToken(
            tokenGuardado
          )

        const usuarioActual =
          resultado.find(
            (usuario) =>
              usuario.dni === payload?.sub
          )

        setUsuarioLogueado(
          usuarioActual || null
        )


        setLogueado(true)

      } catch (error) {

        console.error(
          'Error validando sesión:',
          error
        )


        localStorage.removeItem(
          'access_token'
        )

        setLogueado(false)

        setUsuarioLogueado(null)

        if (error.status === 401) {

          setMensajeSesion(
            'Tu sesión ha expirado. Inicia sesión nuevamente.'
          )

        }

      } finally {

        setCargando(false)

      }

    }


    cargarSesion()

  }, [])


  // ==========================
  // LOGIN
  // ==========================

  const iniciarAplicacion = async (
    accessToken
  ) => {

    try {

      const resultado =
        await obtenerUsuarios(
          accessToken
        )


      setToken(accessToken)

      setUsuarios(resultado)


      // ==========================
      // OBTENER USUARIO LOGUEADO
      // ==========================

      const payload =
        obtenerPayloadToken(
          accessToken
        )

      const usuarioActual =
        resultado.find(
          (usuario) =>
            usuario.dni === payload?.sub
        )

      setUsuarioLogueado(
        usuarioActual || null
      )


      setLogueado(true)

      setMensajeSesion('')

    } catch (error) {

      console.error(
        'Error obteniendo usuarios:',
        error
      )


      if (error.status === 401) {

        localStorage.removeItem(
          'access_token'
        )

        setMensajeSesion(
          'La sesión no pudo ser validada.'
        )

      }

      throw error

    }

  }


  // ==========================
  // CREAR
  // ==========================

  const abrirFormulario = () => {

    setMostrarFormulario(true)

  }


  const cerrarFormulario = () => {

    setMostrarFormulario(false)

  }


  const usuarioCreado = (
    nuevoUsuario
  ) => {

    setUsuarios(
      (usuariosActuales) => [
        ...usuariosActuales,
        nuevoUsuario,
      ]
    )

    setMostrarFormulario(false)

  }


  // ==========================
  // EDITAR
  // ==========================

  const editarUsuario = (
    usuario
  ) => {

    setUsuarioEditando(usuario)

  }


  const cerrarEdicion = () => {

    setUsuarioEditando(null)

  }


  const usuarioActualizado = (
    usuarioActualizado
  ) => {

    setUsuarios(
      (usuariosActuales) =>
        usuariosActuales.map(
          (usuario) =>
            usuario.dni ===
            usuarioActualizado.dni
              ? usuarioActualizado
              : usuario
        )
    )

    // Si el usuario editado es
    // el usuario actualmente logueado,
    // actualizar también la información
    // mostrada arriba.

    if (
      usuarioLogueado?.dni ===
      usuarioActualizado.dni
    ) {

      setUsuarioLogueado(
        usuarioActualizado
      )

    }

    setUsuarioEditando(null)

  }


  // ==========================
  // ELIMINAR
  // ==========================

  const eliminarUsuario = (
    usuario
  ) => {

    setUsuarioEliminando(usuario)

  }


  const cerrarEliminacion = () => {

    setUsuarioEliminando(null)

  }


  const usuarioEliminado = (
    dni
  ) => {

    setUsuarios(
      (usuariosActuales) =>
        usuariosActuales.filter(
          (usuario) =>
            usuario.dni !== dni
        )
    )

    setUsuarioEliminando(null)

  }


  // ==========================
  // CARGANDO
  // ==========================

  if (cargando) {

    return (

      <div
        className="vh-100 d-flex justify-content-center align-items-center"
      >

        <div className="text-center">

          <div
            className="spinner-border text-primary mb-3"
            role="status"
          />

          <div>
            Validando sesión...
          </div>

        </div>

      </div>

    )

  }


  // ==========================
  // LOGIN
  // ==========================

  if (!logueado) {

    return (

      <Login
        onLogin={
          iniciarAplicacion
        }
        mensajeSesion={
          mensajeSesion
        }
      />

    )

  }


  // ==========================
  // APLICACIÓN
  // ==========================

  return (

    <div
      className={
        modoOscuro
          ? 'bg-dark text-light min-vh-100'
          : 'bg-light min-vh-100'
      }
    >

      {/* ========================== */}
      {/* VIGILAR SESIÓN */}
      {/* ========================== */}

      <SessionManager
        token={token}
        onSesionExpirada={
          manejarSesionExpirada
        }
      />


      {/* ========================== */}
      {/* NAVBAR */}
      {/* ========================== */}

      <nav
        className={
          modoOscuro
            ? 'navbar navbar-dark bg-black shadow'
            : 'navbar navbar-dark bg-dark shadow'
        }
      >

        <div className="container">

          {/* ========================== */}
          {/* TÍTULO */}
          {/* ========================== */}

          <span className="navbar-brand mb-0 h1">
            👥 Gestión de Usuarios
          </span>


          {/* ========================== */}
          {/* USUARIO + BOTONES */}
          {/* ========================== */}

          <div className="d-flex align-items-center gap-3">

            {/* ========================== */}
            {/* USUARIO LOGUEADO */}
            {/* ========================== */}

            {usuarioLogueado && (

              <div className="text-end text-white">

                <div className="fw-bold">
                  👤 {usuarioLogueado.name}
                </div>

                <small className="opacity-75">
                  DNI: {usuarioLogueado.dni}
                </small>

              </div>

            )}


            {/* ========================== */}
            {/* MODO OSCURO */}
            {/* ========================== */}

            <button
              className="btn btn-outline-light"
              onClick={() =>
                setModoOscuro(
                  (valor) => !valor
                )
              }
              title={
                modoOscuro
                  ? 'Cambiar a modo claro'
                  : 'Cambiar a modo oscuro'
              }
            >

              {modoOscuro
                ? '☀️'
                : '🌙'}

            </button>


            {/* ========================== */}
            {/* CERRAR SESIÓN */}
            {/* ========================== */}

            <button
              className="btn btn-outline-light"
              onClick={
                cerrarSesion
              }
            >
              Cerrar sesión
            </button>

          </div>

        </div>

      </nav>


      {/* ========================== */}
      {/* DASHBOARD */}
      {/* ========================== */}

      <div className="pt-4">

        <Dashboard
          usuarios={
            usuarios
          }
        />

      </div>


      {/* ========================== */}
      {/* TABLA */}
      {/* ========================== */}

      <UserTable
        usuarios={
          usuarios
        }
        onNuevoUsuario={
          abrirFormulario
        }
        onEditarUsuario={
          editarUsuario
        }
        onEliminarUsuario={
          eliminarUsuario
        }
      />


      {/* ========================== */}
      {/* NUEVO USUARIO */}
      {/* ========================== */}

      {mostrarFormulario && (

        <UserForm
          token={token}
          onUsuarioCreado={
            usuarioCreado
          }
          onCancelar={
            cerrarFormulario
          }
        />

      )}


      {/* ========================== */}
      {/* EDITAR */}
      {/* ========================== */}

      {usuarioEditando && (

        <EditUserForm
          usuario={
            usuarioEditando
          }
          token={token}
          onUsuarioActualizado={
            usuarioActualizado
          }
          onCancelar={
            cerrarEdicion
          }
        />

      )}


      {/* ========================== */}
      {/* ELIMINAR */}
      {/* ========================== */}

      {usuarioEliminando && (

        <DeleteUserModal
          usuario={
            usuarioEliminando
          }
          token={token}
          onUsuarioEliminado={
            usuarioEliminado
          }
          onCancelar={
            cerrarEliminacion
          }
        />

      )}

    </div>

  )
}


export default App