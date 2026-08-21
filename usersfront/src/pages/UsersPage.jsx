import {
  useState,
} from 'react'

import {
  useAuth,
} from '../contexts/AuthContext'

import {
  exportarUsuariosExcel,
} from '../services/api'

import UserTable from '../components/UserTable'
import UserForm from '../components/UserForm'
import EditUserForm from '../components/EditUserForm'
import DeleteUserModal from '../components/DeleteUserModal'
import Dashboard from '../components/Dashboard'
import SessionManager from '../components/SessionManager'


function UsersPage() {

  // ============================================================
  // CONTEXT
  // ============================================================

  const {
    token,
    usuarioLogueado,
    usuarios,
    setUsuarios,
    manejarSesionExpirada,
  } = useAuth()


  // ============================================================
  // FORMULARIOS
  // ============================================================

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false)


  const [
    usuarioEditando,
    setUsuarioEditando,
  ] = useState(null)


  const [
    usuarioEliminando,
    setUsuarioEliminando,
  ] = useState(null)


  // ============================================================
  // EXPORTAR EXCEL
  // ============================================================

  const [
    exportandoExcel,
    setExportandoExcel,
  ] = useState(false)


  const [
    mensajeExportacion,
    setMensajeExportacion,
  ] = useState(null)


  const descargarExcel = async () => {

    try {

      setExportandoExcel(true)

      setMensajeExportacion(null)


      // ========================================================
      // SOLICITAR ARCHIVO
      // ========================================================

      const blob =
        await exportarUsuariosExcel(
          token
        )


      // ========================================================
      // CREAR DESCARGA
      // ========================================================

      const url =
        window.URL.createObjectURL(
          blob
        )


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


      // ========================================================
      // ÉXITO
      // ========================================================

      setMensajeExportacion({
        tipo: 'success',
        texto: 'Excel generado correctamente.',
      })


    } catch (error) {

      console.error(
        'Error exportando usuarios:',
        error
      )


      // ========================================================
      // SESIÓN EXPIRADA
      // ========================================================

      if (error.status === 401) {

        manejarSesionExpirada()

        return
      }


      // ========================================================
      // SIN PERMISOS
      // ========================================================

      if (error.status === 403) {

        setMensajeExportacion({
          tipo: 'danger',
          texto:
            'No tienes permisos para exportar usuarios.',
        })

        return
      }


      // ========================================================
      // OTROS ERRORES
      // ========================================================

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


  // ============================================================
  // CREAR USUARIO
  // ============================================================

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


  // ============================================================
  // EDITAR USUARIO
  // ============================================================

  const editarUsuario = (
    usuario
  ) => {

    setUsuarioEditando(
      usuario
    )

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


  // ============================================================
  // ELIMINAR USUARIO
  // ============================================================

  const eliminarUsuario = (
    usuario
  ) => {

    setUsuarioEliminando(
      usuario
    )

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


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <>

      {/* ====================================================== */}
      {/* VIGILAR SESIÓN */}
      {/* ====================================================== */}

      <SessionManager
        token={token}
        onSesionExpirada={
          manejarSesionExpirada
        }
      />


      {/* ====================================================== */}
      {/* TÍTULO DE LA PÁGINA */}
      {/* ====================================================== */}

      <div className="mb-4">

        <h2 className="fw-bold mb-1">
          Gestión de Usuarios
        </h2>

        <p className="text-muted mb-0">
          Administración de usuarios del tenant actual.
        </p>

      </div>


      {/* ====================================================== */}
      {/* MENSAJE EXPORTACIÓN */}
      {/* ====================================================== */}

      {mensajeExportacion && (

        <div
          className={`
            alert
            alert-${mensajeExportacion.tipo}
            alert-dismissible
            fade
            show
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

      )}


      {/* ====================================================== */}
      {/* DASHBOARD */}
      {/* ====================================================== */}

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


      {/* ====================================================== */}
      {/* TABLA */}
      {/* ====================================================== */}

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


      {/* ====================================================== */}
      {/* NUEVO USUARIO */}
      {/* ====================================================== */}

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


      {/* ====================================================== */}
      {/* EDITAR USUARIO */}
      {/* ====================================================== */}

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


      {/* ====================================================== */}
      {/* ELIMINAR USUARIO */}
      {/* ====================================================== */}

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

    </>

  )

}


export default UsersPage