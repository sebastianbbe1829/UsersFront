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


function MainPage() {

  // ========================================================
  // CONTEXT
  // ========================================================

  const {
    token,
    usuarios,
    setUsuarios,
    manejarSesionExpirada,
  } = useAuth()


  // ========================================================
  // FORMULARIOS
  // ========================================================

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false)

  const [usuarioEditando, setUsuarioEditando] =
    useState(null)

  const [usuarioEliminando, setUsuarioEliminando] =
    useState(null)


  // ========================================================
  // EXPORTAR EXCEL
  // ========================================================

  const [exportandoExcel, setExportandoExcel] =
    useState(false)

  const [mensajeExportacion, setMensajeExportacion] =
    useState(null)


  const descargarExcel = async () => {

    try {

      setExportandoExcel(true)

      setMensajeExportacion(null)


      const blob =
        await exportarUsuariosExcel(token)


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


      setMensajeExportacion({
        tipo: 'success',
        texto: 'Excel generado correctamente.',
      })

    } catch (error) {

      console.error(
        'Error exportando usuarios:',
        error
      )


      if (error.status === 401) {

        manejarSesionExpirada()

        return
      }


      if (error.status === 403) {

        setMensajeExportacion({
          tipo: 'danger',
          texto:
            'No tienes permisos para exportar usuarios.',
        })

        return
      }


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


  // ========================================================
  // CREAR
  // ========================================================

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


  // ========================================================
  // EDITAR
  // ========================================================

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


  // ========================================================
  // ELIMINAR
  // ========================================================

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


  // ========================================================
  // RENDER
  // ========================================================

  return (

    <div className="container-fluid px-3 py-3">

      {/* ================================================== */}
      {/* MENSAJE EXPORTACIÓN */}
      {/* ================================================== */}

      {mensajeExportacion && (

        <div
          className={`
            alert
            alert-${mensajeExportacion.tipo}
            alert-dismissible
            fade
            show
            py-2
            mb-3
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


      {/* ================================================== */}
      {/* DASHBOARD */}
      {/* ================================================== */}

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


      {/* ================================================== */}
      {/* TABLA */}
      {/* ================================================== */}

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


      {/* ================================================== */}
      {/* NUEVO USUARIO */}
      {/* ================================================== */}

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


      {/* ================================================== */}
      {/* EDITAR */}
      {/* ================================================== */}

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


      {/* ================================================== */}
      {/* ELIMINAR */}
      {/* ================================================== */}

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