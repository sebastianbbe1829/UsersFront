import {
  useState,
  useEffect,
} from 'react'

import { useAuth } from '../contexts/AuthContext'

import {
  exportarUsuariosExcel,
} from '../services/api'

import Login from '../components/Login'
import UserTable from '../components/UserTable'
import UserForm from '../components/UserForm'
import EditUserForm from '../components/EditUserForm'
import DeleteUserModal from '../components/DeleteUserModal'
import Dashboard from '../components/Dashboard'
import SessionManager from '../components/SessionManager'


function MainPage() {

  // ==========================
  // CONTEXT
  // ==========================

  const {
    logueado,
    token,
    usuarioLogueado,
    cargando,
    mensajeSesion,
    usuarios,
    setUsuarios,
    cerrarSesion,
    manejarSesionExpirada,
  } = useAuth()


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
  // EXPORTAR EXCEL
  // ==========================

  const [exportandoExcel, setExportandoExcel] =
    useState(false)

  const [mensajeExportacion, setMensajeExportacion] =
    useState(null)


  const descargarExcel = async () => {

    try {

      setExportandoExcel(true)

      // ==========================
      // LIMPIAR MENSAJE ANTERIOR
      // ==========================

      setMensajeExportacion(null)


      // ==========================
      // SOLICITAR ARCHIVO AL API
      // ==========================

      const blob =
        await exportarUsuariosExcel(token)


      // ==========================
      // CREAR DESCARGA
      // ==========================

      const url =
        window.URL.createObjectURL(blob)

      const enlace =
        document.createElement('a')

      enlace.href = url

      enlace.download =
        'reporte_usuarios.xlsx'

      document.body.appendChild(
        enlace
      )

      enlace.click()

      enlace.remove()

      window.URL.revokeObjectURL(
        url
      )


      // ==========================
      // ÉXITO
      // ==========================

      setMensajeExportacion({
        tipo: 'success',
        texto: 'Excel generado correctamente.',
      })

    } catch (error) {

      console.error(
        'Error exportando usuarios:',
        error
      )


      // ==========================
      // SESIÓN EXPIRADA
      // ==========================

      if (error.status === 401) {

        manejarSesionExpirada()

        return
      }


      // ==========================
      // SIN PERMISOS
      // ==========================

      if (error.status === 403) {

        setMensajeExportacion({
          tipo: 'danger',
          texto:
            'No tienes permisos para exportar usuarios.',
        })

        return
      }


      // ==========================
      // OTROS ERRORES
      // ==========================

      setMensajeExportacion({
        tipo: 'danger',
        texto:
          error.message ||
          'No fue posible generar el archivo Excel.',
      })

    } finally {

      setExportandoExcel(false)

    }

  }


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

  }, [modoOscuro])


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
        className="
          vh-100
          d-flex
          justify-content-center
          align-items-center
        "
      >

        <div className="text-center">

          <div
            className="
              spinner-border
              text-primary
              mb-3
            "
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
        mensajeSesion={
          mensajeSesion
        }
      />

    )

  }


  // ==========================
  // APLICACIÓN PRINCIPAL
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

            {/* USUARIO LOGUEADO */}

            {usuarioLogueado && (

              <div className="text-end text-white">

                <div className="fw-bold">
                  👤 {usuarioLogueado.name}
                </div>

                <small className="opacity-75">
                  Número de identificación:{' '}
                  {usuarioLogueado.dni}
                </small>

              </div>

            )}


            {/* MODO OSCURO */}

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


            {/* CERRAR SESIÓN */}

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
      {/* MENSAJE EXPORTACIÓN */}
      {/* ========================== */}

      {mensajeExportacion && (

        <div className="container pt-3">

          <div
            className={`
              alert
              alert-${mensajeExportacion.tipo}
              alert-dismissible
              fade
              show
              mb-0
            `}
            role="alert"
          >

            {mensajeExportacion.texto}

            <button
              type="button"
              className="btn-close"
              aria-label="Cerrar"
              onClick={() =>
                setMensajeExportacion(null)
              }
            />

          </div>

        </div>

      )}


      {/* ========================== */}
      {/* DASHBOARD */}
      {/* ========================== */}

      <div className="pt-4">

        <Dashboard
          usuarios={
            usuarios
          }
          onExportarExcel={
            descargarExcel
          }
          exportandoExcel={
            exportandoExcel
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


export default MainPage