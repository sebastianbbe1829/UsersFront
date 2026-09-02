import {
  useCallback,
  useEffect,
  useState,
} from 'react'


import {
  useAuth,
} from '../contexts/AuthContext'


import {
  obtenerRoles,
  crearRol,
  obtenerPermisos,
  obtenerPermisosRol,
  asignarPermisoRol,
  eliminarPermisoRol,
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
  // ROL - PERMISOS
  // ============================================================

  const [
    rolPermisos,
    setRolPermisos,
  ] = useState(null)


  const [
    permisos,
    setPermisos,
  ] = useState([])


  const [
    permisosAsignados,
    setPermisosAsignados,
  ] = useState([])


  const [
    cargandoPermisos,
    setCargandoPermisos,
  ] = useState(false)


  const [
    permisoProcesando,
    setPermisoProcesando,
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
  // ERROR PERMISOS
  // ============================================================

  const [
    errorPermisos,
    setErrorPermisos,
  ] = useState('')


  // ============================================================
  // CARGAR ROLES
  // ============================================================

  const cargarRoles = useCallback(async () => {

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


      if (error.status === 401) {

        manejarSesionExpirada()

        return
      }


      if (error.status === 403) {

        setMensaje({
          tipo: 'danger',
          texto:
            'No tienes permisos para consultar los roles.',
        })

        return
      }


      setMensaje({
        tipo: 'danger',
        texto:
          error.message ||
          'No fue posible cargar los roles.',
      })

    } finally {

      setCargando(false)

    }

  }, [token, manejarSesionExpirada])


  // ============================================================
  // CARGA INICIAL
  // ============================================================

  useEffect(() => {

    if (!token) {
      return
    }

    const cargar = async () => {
      await cargarRoles()
    }

    void cargar()

  }, [token, cargarRoles])


  // ============================================================
  // NUEVO ROL
  // ============================================================

  const abrirFormulario = () => {

    setMensaje(null)

    setRolEditando(null)

    setMostrarFormulario(true)

  }


  // ============================================================
  // CERRAR FORMULARIO
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


      const nuevoRol =
        await crearRol(
          datos,
          token
        )


      setRoles(
        (rolesActuales) => [
          ...rolesActuales,
          nuevoRol,
        ]
      )


      setMostrarFormulario(false)


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


      if (error.status === 401) {

        manejarSesionExpirada()

        return
      }


      if (error.status === 403) {

        setMensaje({
          tipo: 'danger',
          texto:
            'No tienes permisos para crear roles.',
        })

        return
      }


      setMensaje({
        tipo: 'danger',
        texto:
          error.message ||
          'No fue posible crear el rol.',
      })

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
  // CERRAR ELIMINACIÓN
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
  // ABRIR GESTIÓN DE PERMISOS
  // ============================================================

  const abrirGestionPermisos = async (
    rol
  ) => {

    setRolPermisos(rol)

    setPermisos([])

    setPermisosAsignados([])

    setErrorPermisos('')

    setCargandoPermisos(true)


    try {

      // ========================================================
      // CARGAMOS:
      //
      // 1. Todos los permisos globales
      // 2. Permisos actualmente asignados al rol
      // ========================================================

      const [
        permisosResultado,
        permisosRolResultado,
      ] = await Promise.all([
        obtenerPermisos(token),
        obtenerPermisosRol(
          rol.id,
          token
        ),
      ])


      setPermisos(
        Array.isArray(
          permisosResultado
        )
          ? permisosResultado
          : []
      )


      setPermisosAsignados(
        Array.isArray(
          permisosRolResultado
        )
          ? permisosRolResultado
          : []
      )

    } catch (error) {

      console.error(
        'Error cargando permisos del rol:',
        error
      )


      if (error.status === 401) {

        manejarSesionExpirada()

        return
      }


      if (error.status === 403) {

        setErrorPermisos(
          'No tienes permisos para consultar los permisos del rol.'
        )

        return
      }


      setErrorPermisos(
        error.message ||
        'No fue posible cargar los permisos.'
      )

    } finally {

      setCargandoPermisos(false)

    }

  }


  // ============================================================
  // CERRAR GESTIÓN DE PERMISOS
  // ============================================================

  const cerrarGestionPermisos = () => {

    if (permisoProcesando !== null) {
      return
    }


    setRolPermisos(null)

    setPermisos([])

    setPermisosAsignados([])

    setErrorPermisos('')

  }


  // ============================================================
  // VERIFICAR SI UN PERMISO ESTÁ ASIGNADO
  // ============================================================

  const obtenerRelacionPermiso = (
    permissionId
  ) => {

    return permisosAsignados.find(
      (relacion) =>
        relacion.permission_id ===
        permissionId
    )

  }


  // ============================================================
  // CAMBIAR PERMISO
  // ============================================================

  const cambiarPermiso = async (
    permiso
  ) => {

    if (!rolPermisos) {
      return
    }


    const relacion =
      obtenerRelacionPermiso(
        permiso.id
      )


    try {

      setPermisoProcesando(
        permiso.id
      )

      setErrorPermisos('')


      // ========================================================
      // SI YA EXISTE:
      //
      // ELIMINAR RELACIÓN
      // ========================================================

      if (relacion) {

        await eliminarPermisoRol(
          relacion.id,
          token
        )


        setPermisosAsignados(
          (actuales) =>
            actuales.filter(
              (item) =>
                item.id !==
                relacion.id
            )
        )

      } else {

        // ======================================================
        // SI NO EXISTE:
        //
        // CREAR RELACIÓN
        // ======================================================

        const nuevaRelacion =
          await asignarPermisoRol(
            rolPermisos.id,
            permiso.id,
            token
          )


        setPermisosAsignados(
          (actuales) => [
            ...actuales,
            nuevaRelacion,
          ]
        )

      }

    } catch (error) {

      console.error(
        'Error modificando permiso:',
        error
      )


      if (error.status === 401) {

        manejarSesionExpirada()

        return
      }


      if (error.status === 403) {

        setErrorPermisos(
          'No tienes permisos para modificar los permisos del rol.'
        )

        return
      }


      setErrorPermisos(
        error.message ||
        'No fue posible modificar el permiso.'
      )

    } finally {

      setPermisoProcesando(null)

    }

  }


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <>

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
      {/* CARGANDO ROLES                                         */}
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

        !mostrarFormulario && (

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
            onGestionarPermisos={
              abrirGestionPermisos
            }
          />

        )

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


      {/* ====================================================== */}
      {/* MODAL GESTIÓN DE PERMISOS                             */}
      {/* ====================================================== */}

      {rolPermisos && (

        <div
          className="modal d-block"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor:
              'rgba(0, 0, 0, 0.5)',
            zIndex: 2100,
            overflowY: 'auto',
          }}
        >

          <div
            className="
              modal-dialog
              modal-dialog-centered
              modal-lg
            "
            style={{
              width:
                'calc(100% - 2rem)',
              margin:
                '1rem auto',
            }}
          >

            <div className="modal-content">

              {/* CABECERA */}

              <div
                className="
                  modal-header
                  py-2
                  px-3
                "
              >

                <div>

                  <h5
                    className="
                      modal-title
                      fw-bold
                      mb-0
                    "
                  >
                    Permisos del rol
                  </h5>

                  <small className="text-muted">

                    {rolPermisos.name}
                    {' · '}
                    {rolPermisos.code}

                  </small>

                </div>


                <button
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={
                    cerrarGestionPermisos
                  }
                  disabled={
                    permisoProcesando !== null
                  }
                />

              </div>


              {/* CUERPO */}

              <div
                className="
                  modal-body
                  py-3
                  px-3
                "
              >

                {errorPermisos && (

                  <div
                    className="
                      alert
                      alert-danger
                      py-2
                    "
                  >
                    ⚠️ {errorPermisos}
                  </div>

                )}


                {cargandoPermisos ? (

                  <div
                    className="
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
                    />

                    <div className="text-muted">
                      Cargando permisos...
                    </div>

                  </div>

                ) : (

                  <>

                    <div
                      className="
                        d-flex
                        justify-content-between
                        align-items-center
                        mb-3
                      "
                    >

                      <div>

                        <strong>
                          Permisos disponibles
                        </strong>

                        <div className="small text-muted">
                          Selecciona los permisos que tendrá este rol.
                        </div>

                      </div>


                      <span
                        className="
                          badge
                          bg-primary
                        "
                      >
                        {
                          permisosAsignados.length
                        }
                        {' '}
                        asignados
                      </span>

                    </div>


                    {permisos.length === 0 ? (

                      <div
                        className="
                          alert
                          alert-secondary
                          text-center
                        "
                      >
                        No existen permisos disponibles.
                      </div>

                    ) : (

                      <div className="row g-2">

                        {permisos.map(
                          (permiso) => {

                            const relacion =
                              obtenerRelacionPermiso(
                                permiso.id
                              )

                            const asignado =
                              Boolean(
                                relacion
                              )

                            const procesando =
                              permisoProcesando ===
                              permiso.id


                            return (

                              <div
                                className="
                                  col-12
                                  col-md-6
                                "
                                key={
                                  permiso.id
                                }
                              >

                                <button
                                  type="button"
                                  className={`
                                    w-100
                                    text-start
                                    btn
                                    ${
                                      asignado
                                        ? 'btn-primary'
                                        : 'btn-outline-secondary'
                                    }
                                  `}
                                  onClick={() =>
                                    cambiarPermiso(
                                      permiso
                                    )
                                  }
                                  disabled={
                                    permisoProcesando !== null
                                  }
                                >

                                  <div
                                    className="
                                      d-flex
                                      align-items-center
                                      gap-2
                                    "
                                  >

                                    <div
                                      style={{
                                        width:
                                          '24px',
                                        textAlign:
                                          'center',
                                      }}
                                    >

                                      {procesando ? (

                                        <span
                                          className="
                                            spinner-border
                                            spinner-border-sm
                                          "
                                        />

                                      ) : (

                                        asignado
                                          ? '✓'
                                          : '○'

                                      )}

                                    </div>


                                    <div>

                                      <div
                                        className="fw-semibold"
                                      >
                                        {permiso.name}
                                      </div>

                                      <div
                                        className="
                                          small
                                          opacity-75
                                        "
                                      >
                                        {permiso.code}
                                      </div>

                                    </div>

                                  </div>

                                </button>

                              </div>

                            )

                          }
                        )}

                      </div>

                    )}

                  </>

                )}

              </div>


              {/* PIE */}

              <div
                className="
                  modal-footer
                  py-2
                  px-3
                "
              >

                <button
                  type="button"
                  className="
                    btn
                    btn-secondary
                  "
                  onClick={
                    cerrarGestionPermisos
                  }
                  disabled={
                    permisoProcesando !== null
                  }
                >
                  Cerrar
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </>

  )

}


export default RolesPage