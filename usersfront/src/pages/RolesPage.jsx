import {
  useEffect,
  useState,
} from 'react'


import {
  useAuth,
} from '../contexts/AuthContext'


import {
  obtenerRoles,
  crearRol,
  actualizarRol,
} from '../services/api'


import RoleTable from '../components/RoleTable'
import RoleForm from '../components/RoleForm'
import EditRoleForm from '../components/EditRoleForm'
import DeleteRoleModal from '../components/DeleteRoleModal'
import SessionManager from '../components/SessionManager'


function RolesPage() {

  // ============================================================
  // CONTEXT
  // ============================================================

  const {
    token,
    manejarSesionExpirada,
  } = useAuth()


  // ============================================================
  // ROLES
  // ============================================================

  const [
    roles,
    setRoles,
  ] = useState([])


  // ============================================================
  // CARGANDO
  // ============================================================

  const [
    cargando,
    setCargando,
  ] = useState(true)


  // ============================================================
  // FORMULARIO NUEVO ROL
  // ============================================================

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false)


  // ============================================================
  // ROL EDITANDO
  // ============================================================

  const [
    rolEditando,
    setRolEditando,
  ] = useState(null)


  // ============================================================
  // ROL ELIMINANDO
  // ============================================================

  const [
    rolEliminando,
    setRolEliminando,
  ] = useState(null)


  // ============================================================
  // GUARDANDO
  // ============================================================

  const [
    guardando,
    setGuardando,
  ] = useState(false)


  // ============================================================
  // MENSAJE GENERAL
  // ============================================================

  const [
    mensaje,
    setMensaje,
  ] = useState(null)


  // ============================================================
  // CARGAR ROLES
  // ============================================================

  const cargarRoles = async () => {

    try {

      setCargando(true)

      setMensaje(null)


      const resultado =
        await obtenerRoles(
          token
        )


      setRoles(
        Array.isArray(resultado)
          ? resultado
          : []
      )

    } catch (error) {

      console.error(
        'Error obteniendo roles:',
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

        setMensaje({
          tipo: 'danger',
          texto:
            'No tienes permisos para consultar los roles.',
        })

        return
      }


      // ========================================================
      // OTROS ERRORES
      // ========================================================

      setMensaje({
        tipo: 'danger',
        texto:
          error.message ||
          'No fue posible cargar los roles.',
      })

    } finally {

      setCargando(false)

    }

  }


  // ============================================================
  // CARGA INICIAL
  // ============================================================

  useEffect(() => {

    if (!token) {
      return
    }

    cargarRoles()

  }, [token])


  // ============================================================
  // NUEVO ROL
  // ============================================================

  const abrirFormulario = () => {

    setMensaje(null)

    setRolEditando(null)

    setMostrarFormulario(true)

  }


  // ============================================================
  // CERRAR FORMULARIO NUEVO
  // ============================================================

  const cerrarFormulario = () => {

    if (guardando) {
      return
    }


    setMostrarFormulario(false)

    setMensaje(null)

  }


  // ============================================================
  // CREAR ROL
  // ============================================================

  const guardarRol = async (
    datos
  ) => {

    try {

      setGuardando(true)

      setMensaje(null)


      // ======================================================
      // CREAR
      // ======================================================

      const nuevoRol =
        await crearRol(
          datos,
          token
        )


      // ======================================================
      // AGREGAR A LA TABLA
      // ======================================================

      setRoles(
        (rolesActuales) => [
          ...rolesActuales,
          nuevoRol,
        ]
      )


      // ======================================================
      // CERRAR MODAL
      // ======================================================

      setMostrarFormulario(false)


      // ======================================================
      // MENSAJE DE ÉXITO
      // ======================================================

      setMensaje({
        tipo: 'success',
        texto:
          'Rol creado correctamente.',
      })

    } catch (error) {

      console.error(
        'Error creando rol:',
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

        setMensaje({
          tipo: 'danger',
          texto:
            'No tienes permisos para crear roles.',
        })

        return
      }


      // ========================================================
      // OTROS ERRORES
      // ========================================================

      setMensaje({
        tipo: 'danger',
        texto:
          error.message ||
          'No fue posible crear el rol.',
      })

      // ========================================================
      // IMPORTANTE:
      //
      // NO cerramos el modal.
      //
      // El error se enviará a RoleForm para que aparezca
      // dentro del modal.
      // ========================================================

    } finally {

      setGuardando(false)

    }

  }


  // ============================================================
  // EDITAR ROL
  // ============================================================

  const editarRol = (
    rol
  ) => {

    setMensaje(null)

    setRolEditando(
      rol
    )

  }


  // ============================================================
  // ROL ACTUALIZADO
  // ============================================================

  const rolActualizado = (
    rolActualizado
  ) => {

    setRoles(
      (rolesActuales) =>
        rolesActuales.map(
          (rol) =>
            rol.id ===
            rolActualizado.id
              ? rolActualizado
              : rol
        )
    )


    setRolEditando(null)


    setMensaje({
      tipo: 'success',
      texto:
        'Rol actualizado correctamente.',
    })

  }


  // ============================================================
  // ELIMINAR ROL
  // ============================================================

  const eliminarRolDesdeTabla = (
    rol
  ) => {

    setMensaje(null)

    setRolEliminando(
      rol
    )

  }


  // ============================================================
  // CERRAR MODAL ELIMINACIÓN
  // ============================================================

  const cerrarEliminacion = () => {

    setRolEliminando(null)

  }


  // ============================================================
  // ROL ELIMINADO
  // ============================================================

  const rolEliminado = (
    roleId
  ) => {

    setRoles(
      (rolesActuales) =>
        rolesActuales.filter(
          (rolActual) =>
            rolActual.id !== roleId
        )
    )


    setRolEliminando(null)


    setMensaje({
      tipo: 'success',
      texto:
        'Rol eliminado correctamente.',
    })

  }


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <>

      {/* ====================================================== */}
      {/* VIGILAR SESIÓN                                        */}
      {/* ====================================================== */}

      <SessionManager
        token={
          token
        }
        onSesionExpirada={
          manejarSesionExpirada
        }
      />


      {/* ====================================================== */}
      {/* TÍTULO                                                */}
      {/* ====================================================== */}

      <div className="mb-4">

        <h2 className="fw-bold mb-1">
          Gestión de Roles
        </h2>

        <p className="text-muted mb-0">
          Administración de roles del tenant actual.
        </p>

      </div>


      {/* ====================================================== */}
      {/* MENSAJE GENERAL                                       */}
      {/* ====================================================== */}

      {mensaje && !mostrarFormulario && (

        <div
          className={`
            alert
            alert-${mensaje.tipo}
            alert-dismissible
            fade
            show
          `}
          role="alert"
        >

          {mensaje.texto}

          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar"
            onClick={() =>
              setMensaje(null)
            }
          />

        </div>

      )}


      {/* ====================================================== */}
      {/* CARGANDO                                              */}
      {/* ====================================================== */}

      {cargando ? (

        <div
          className="
            card
            shadow-sm
            border-0
          "
        >

          <div
            className="
              card-body
              text-center
              py-5
            "
          >

            <div
              className="
                spinner-border
                text-primary
                mb-3
              "
              role="status"
            />

            <div className="text-muted">
              Cargando roles...
            </div>

          </div>

        </div>

      ) : (

        <>

          {/* ================================================== */}
          {/* TABLA                                              */}
          {/* ================================================== */}

          {!mostrarFormulario && (

            <RoleTable
              roles={
                roles
              }
              onNuevoRol={
                abrirFormulario
              }
              onEditarRol={
                editarRol
              }
              onEliminarRol={
                eliminarRolDesdeTabla
              }
            />

          )}

        </>

      )}


      {/* ====================================================== */}
      {/* MODAL NUEVO ROL                                       */}
      {/* ====================================================== */}

      {mostrarFormulario && (

        <RoleForm
          rol={null}
          onGuardar={
            guardarRol
          }
          onCancelar={
            cerrarFormulario
          }
          guardando={
            guardando
          }
          error={
            mensaje?.tipo === 'danger'
              ? mensaje.texto
              : ''
          }
        />

      )}


      {/* ====================================================== */}
      {/* MODAL EDITAR ROL                                      */}
      {/* ====================================================== */}

      {rolEditando && (

        <EditRoleForm
          rol={
            rolEditando
          }
          token={
            token
          }
          onRolActualizado={
            rolActualizado
          }
          onCancelar={() =>
            setRolEditando(null)
          }
        />

      )}


      {/* ====================================================== */}
      {/* MODAL ELIMINAR ROL                                    */}
      {/* ====================================================== */}

      {rolEliminando && (

        <DeleteRoleModal
          rol={
            rolEliminando
          }
          token={
            token
          }
          onRolEliminado={
            rolEliminado
          }
          onCancelar={
            cerrarEliminacion
          }
        />

      )}

    </>

  )

}


export default RolesPage