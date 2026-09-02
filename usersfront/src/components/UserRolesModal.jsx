import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  obtenerPayloadToken,
  obtenerTenantsUsuario,
  obtenerRolesUsuario,
  obtenerRoles,
  asignarRolUsuario,
  eliminarRolUsuario,
} from '../services/api'


function UserRolesModal({
  usuario,
  token,
  onCerrar,
  onSesionExpirada,
}) {

  // ============================================================
  // ESTADOS
  // ============================================================

  const [
    cargando,
    setCargando,
  ] = useState(true)


  const [
    procesandoRol,
    setProcesandoRol,
  ] = useState(null)


  const [
    mensaje,
    setMensaje,
  ] = useState(null)


  const [
    userTenantId,
    setUserTenantId,
  ] = useState(null)


  const [
    rolesUsuario,
    setRolesUsuario,
  ] = useState([])


  const [
    rolesTenant,
    setRolesTenant,
  ] = useState([])


  // ============================================================
  // CONFIRMACIÓN PARA QUITAR ROL
  // ============================================================

  const [
    rolPendienteEliminar,
    setRolPendienteEliminar,
  ] = useState(null)


  // ============================================================
  // OBTENER TENANT ACTUAL DEL TOKEN
  // ============================================================

  const obtenerTenantActual = () => {

    const payload =
      obtenerPayloadToken(token)


    if (!payload?.tenant_id) {

      throw new Error(
        'No fue posible determinar el tenant actual.'
      )

    }


    return Number(
      payload.tenant_id
    )

  }


  // ============================================================
  // CARGAR INFORMACIÓN
  // ============================================================

  const cargarDatos = useCallback(async () => {

    try {

      setCargando(true)

      setMensaje(null)


      // ========================================================
      // TENANT ACTUAL
      // ========================================================

      const tenantActual =
        obtenerTenantActual()


      // ========================================================
      // OBTENER RELACIONES DEL USUARIO
      // ========================================================

      const relaciones =
        await obtenerTenantsUsuario(
          usuario.id,
          token
        )


      // ========================================================
      // BUSCAR RELACIÓN DEL USUARIO
      // EN EL TENANT ACTUAL
      // ========================================================

      const relacion =
        relaciones.find(
          (item) =>
            Number(item.tenant_id) ===
            tenantActual
        )


      if (!relacion) {

        throw new Error(
          'El usuario no está asociado al tenant actual.'
        )

      }


      setUserTenantId(
        relacion.id
      )


      // ========================================================
      // CARGAR EN PARALELO
      // ========================================================

      const [
        rolesAsignados,
        todosLosRoles,
      ] = await Promise.all([

        obtenerRolesUsuario(
          relacion.id,
          token
        ),

        obtenerRoles(
          token
        ),

      ])


      setRolesUsuario(
        rolesAsignados || []
      )


      setRolesTenant(
        todosLosRoles || []
      )


    } catch (error) {

      console.error(
        'Error cargando roles del usuario:',
        error
      )


      // ========================================================
      // SESIÓN EXPIRADA
      // ========================================================

      if (error.status === 401) {

        onSesionExpirada()

        return
      }


      // ========================================================
      // SIN PERMISOS
      // ========================================================

      if (error.status === 403) {

        setMensaje({
          tipo: 'danger',
          texto:
            'No tienes permisos para consultar los roles del usuario.',
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
          'No fue posible cargar los roles del usuario.',
      })


    } finally {

      setCargando(false)

    }

  }, [usuario.id, token, onSesionExpirada])


  // ============================================================
  // CARGAR AL ABRIR
  // ============================================================

  useEffect(() => {
    const cargar = async () => {
      await cargarDatos()
    }

    void cargar()
  }, [cargarDatos])


  // ============================================================
  // ROLES ASIGNADOS
  // ============================================================

  const idsRolesAsignados =
    useMemo(() => {

      return new Set(
        rolesUsuario.map(
          (asignacion) =>
            Number(
              asignacion.role_id
            )
        )
      )

    }, [
      rolesUsuario,
    ])


  // ============================================================
  // ROLES DISPONIBLES
  // ============================================================

  const rolesDisponibles =
    useMemo(() => {

      return rolesTenant.filter(
        (rol) =>
          !idsRolesAsignados.has(
            Number(rol.id)
          )
      )

    }, [
      rolesTenant,
      idsRolesAsignados,
    ])


  // ============================================================
  // BUSCAR INFORMACIÓN DEL ROL
  // ============================================================

  const obtenerInformacionRol = (
    roleId
  ) => {

    return rolesTenant.find(
      (rol) =>
        Number(rol.id) ===
        Number(roleId)
    )

  }


  // ============================================================
  // ASIGNAR ROL
  // ============================================================

  const manejarAsignarRol = async (
    rol
  ) => {

    if (!userTenantId) {
      return
    }


    try {

      setProcesandoRol(
        `asignar-${rol.id}`
      )

      setMensaje(null)


      const nuevaAsignacion =
        await asignarRolUsuario(
          userTenantId,
          rol.id,
          token
        )


      setRolesUsuario(
        (actuales) => [
          ...actuales,
          nuevaAsignacion,
        ]
      )


      setMensaje({
        tipo: 'success',
        texto:
          `El rol "${rol.name}" fue asignado correctamente.`,
      })


    } catch (error) {

      console.error(
        'Error asignando rol:',
        error
      )


      if (error.status === 401) {

        onSesionExpirada()

        return
      }


      if (error.status === 403) {

        setMensaje({
          tipo: 'danger',
          texto:
            'No tienes permisos para asignar roles.',
        })

        return
      }


      setMensaje({
        tipo: 'danger',
        texto:
          error.message ||
          'No fue posible asignar el rol.',
      })


    } finally {

      setProcesandoRol(null)

    }

  }


  // ============================================================
  // SOLICITAR ELIMINACIÓN DE ROL
  // ============================================================

  const solicitarEliminarRol = (
    asignacion
  ) => {

    const rol =
      obtenerInformacionRol(
        asignacion.role_id
      )


    setRolPendienteEliminar({
      asignacion,
      rol,
    })

    setMensaje(null)

  }


  // ============================================================
  // CANCELAR ELIMINACIÓN
  // ============================================================

  const cancelarEliminarRol = () => {

    if (procesandoRol) {
      return
    }

    setRolPendienteEliminar(null)

  }


  // ============================================================
  // ELIMINAR ROL
  // ============================================================

  const confirmarEliminarRol = async () => {

    if (!rolPendienteEliminar) {
      return
    }


    const {
      asignacion,
      rol,
    } = rolPendienteEliminar


    const nombreRol =
      rol?.name ||
      `Rol ${asignacion.role_id}`


    try {

      setProcesandoRol(
        `eliminar-${asignacion.id}`
      )

      setMensaje(null)


      await eliminarRolUsuario(
        asignacion.id,
        token
      )


      setRolesUsuario(
        (actuales) =>
          actuales.filter(
            (item) =>
              item.id !==
              asignacion.id
          )
      )


      setRolPendienteEliminar(null)


      setMensaje({
        tipo: 'success',
        texto:
          `El rol "${nombreRol}" fue retirado correctamente.`,
      })


    } catch (error) {

      console.error(
        'Error eliminando rol:',
        error
      )


      if (error.status === 401) {

        onSesionExpirada()

        return
      }


      if (error.status === 403) {

        setMensaje({
          tipo: 'danger',
          texto:
            'No tienes permisos para retirar roles.',
        })

        return
      }


      setMensaje({
        tipo: 'danger',
        texto:
          error.message ||
          'No fue posible retirar el rol.',
      })


    } finally {

      setProcesandoRol(null)

    }

  }


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div
      className="
        modal
        d-block
      "
      tabIndex="-1"
      role="dialog"
      style={{
        backgroundColor:
          'rgba(0, 0, 0, 0.5)',
      }}
    >

      <div
        className="
          modal-dialog
          modal-dialog-centered
          modal-lg
          modal-dialog-scrollable
        "
      >

        <div className="modal-content">


          {/* ================================================== */}
          {/* HEADER                                             */}
          {/* ================================================== */}

          <div className="modal-header">

            <div>

              <h5 className="modal-title fw-bold mb-1">
                Administrar roles
              </h5>

              <div className="text-muted small">

                {usuario.name}

                {' · '}

                DNI: {usuario.dni}

              </div>

            </div>


            <button
              type="button"
              className="btn-close"
              aria-label="Cerrar"
              onClick={onCerrar}
              disabled={!!procesandoRol}
            />

          </div>


          {/* ================================================== */}
          {/* BODY                                               */}
          {/* ================================================== */}

          <div className="modal-body">


            {/* ================================================ */}
            {/* MENSAJE                                           */}
            {/* ================================================ */}

            {mensaje && (

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


            {/* ================================================ */}
            {/* CARGANDO                                          */}
            {/* ================================================ */}

            {cargando ? (

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
                  role="status"
                />

                <div className="text-muted">
                  Cargando roles...
                </div>

              </div>

            ) : (

              <div className="row g-3">


                {/* ============================================ */}
                {/* ROLES ASIGNADOS                               */}
                {/* ============================================ */}

                <div className="col-12 col-md-6">

                  <div
                    className="
                      card
                      h-100
                      border-success
                    "
                  >

                    <div
                      className="
                        card-header
                        bg-success
                        text-white
                        fw-bold
                      "
                    >

                      Roles asignados

                      <span className="badge bg-light text-success ms-2">
                        {rolesUsuario.length}
                      </span>

                    </div>


                    <div className="card-body p-2">

                      {rolesUsuario.length === 0 ? (

                        <div
                          className="
                            text-center
                            text-muted
                            py-4
                          "
                        >
                          Este usuario no tiene roles asignados.
                        </div>

                      ) : (

                        <div className="list-group">

                          {rolesUsuario.map(
                            (asignacion) => {

                              const rol =
                                obtenerInformacionRol(
                                  asignacion.role_id
                                )


                              return (

                                <div
                                  key={
                                    asignacion.id
                                  }
                                  className="
                                    list-group-item
                                    d-flex
                                    justify-content-between
                                    align-items-center
                                    gap-2
                                  "
                                >

                                  <div
                                    className="
                                      flex-grow-1
                                      min-w-0
                                    "
                                  >

                                    <div className="fw-semibold">

                                      {rol?.name ||
                                        `Rol ${asignacion.role_id}`}

                                    </div>


                                    {rol?.code && (

                                      <small
                                        className="
                                          text-muted
                                        "
                                      >
                                        {rol.code}
                                      </small>

                                    )}

                                  </div>


                                  <button
                                    type="button"
                                    className="
                                      btn
                                      btn-outline-danger
                                      btn-sm
                                    "
                                    onClick={() =>
                                      solicitarEliminarRol(
                                        asignacion
                                      )
                                    }
                                    disabled={
                                      !!procesandoRol
                                    }
                                  >

                                    Quitar

                                  </button>

                                </div>

                              )

                            }
                          )}

                        </div>

                      )}

                    </div>

                  </div>

                </div>


                {/* ============================================ */}
                {/* ROLES DISPONIBLES                             */}
                {/* ============================================ */}

                <div className="col-12 col-md-6">

                  <div
                    className="
                      card
                      h-100
                      border-primary
                    "
                  >

                    <div
                      className="
                        card-header
                        bg-primary
                        text-white
                        fw-bold
                      "
                    >

                      Roles disponibles

                      <span className="badge bg-light text-primary ms-2">
                        {rolesDisponibles.length}
                      </span>

                    </div>


                    <div className="card-body p-2">

                      {rolesDisponibles.length === 0 ? (

                        <div
                          className="
                            text-center
                            text-muted
                            py-4
                          "
                        >
                          El usuario ya tiene todos los roles disponibles.
                        </div>

                      ) : (

                        <div className="list-group">

                          {rolesDisponibles.map(
                            (rol) => (

                              <div
                                key={
                                  rol.id
                                }
                                className="
                                  list-group-item
                                  d-flex
                                  justify-content-between
                                  align-items-center
                                  gap-2
                                "
                              >

                                <div
                                  className="
                                    flex-grow-1
                                    min-w-0
                                  "
                                >

                                  <div className="fw-semibold">

                                    {rol.name}

                                  </div>


                                  <small
                                    className="
                                      text-muted
                                    "
                                  >
                                    {rol.code}
                                  </small>

                                </div>


                                <button
                                  type="button"
                                  className="
                                    btn
                                    btn-outline-primary
                                    btn-sm
                                  "
                                  onClick={() =>
                                    manejarAsignarRol(
                                      rol
                                    )
                                  }
                                  disabled={
                                    !!procesandoRol
                                  }
                                >

                                  {procesandoRol ===
                                  `asignar-${rol.id}` ? (

                                    <span
                                      className="
                                        spinner-border
                                        spinner-border-sm
                                      "
                                      role="status"
                                    />

                                  ) : (

                                    '+ Asignar'

                                  )}

                                </button>

                              </div>

                            )
                          )}

                        </div>

                      )}

                    </div>

                  </div>

                </div>

              </div>

            )}

          </div>


          {/* ================================================== */}
          {/* FOOTER                                             */}
          {/* ================================================== */}

          <div className="modal-footer">

            <button
              type="button"
              className="
                btn
                btn-secondary
              "
              onClick={onCerrar}
              disabled={!!procesandoRol}
            >
              Cerrar
            </button>

          </div>


          {/* ================================================== */}
          {/* CONFIRMACIÓN DE ELIMINACIÓN                       */}
          {/* ================================================== */}

          {rolPendienteEliminar && (

            <div
              className="
                position-absolute
                top-0
                start-0
                w-100
                h-100
                d-flex
                align-items-center
                justify-content-center
                p-3
              "
              style={{
                backgroundColor:
                  'rgba(0, 0, 0, 0.45)',
                zIndex: 1050,
              }}
            >

              <div
                className="
                  card
                  shadow-lg
                  border-0
                  w-100
                "
                style={{
                  maxWidth: '480px',
                }}
              >

                <div
                  className="
                    card-header
                    bg-warning
                    fw-bold
                  "
                >

                  ⚠️ Confirmar retiro de rol

                </div>


                <div className="card-body">

                  <p className="mb-2">

                    ¿Deseas quitar el rol

                    {' '}

                    <strong>
                      "
                      {rolPendienteEliminar.rol?.name ||
                        `Rol ${rolPendienteEliminar.asignacion.role_id}`}
                      "
                    </strong>

                    {' '}de este usuario?

                  </p>


                  <p className="text-muted small mb-0">

                    El usuario dejará de tener los permisos
                    asociados a este rol dentro del tenant actual.

                  </p>

                </div>


                <div
                  className="
                    card-footer
                    bg-white
                    d-flex
                    justify-content-end
                    gap-2
                  "
                >

                  <button
                    type="button"
                    className="
                      btn
                      btn-secondary
                    "
                    onClick={
                      cancelarEliminarRol
                    }
                    disabled={
                      !!procesandoRol
                    }
                  >
                    Cancelar
                  </button>


                  <button
                    type="button"
                    className="
                      btn
                      btn-danger
                    "
                    onClick={
                      confirmarEliminarRol
                    }
                    disabled={
                      !!procesandoRol
                    }
                  >

                    {procesandoRol ===
                    `eliminar-${rolPendienteEliminar.asignacion.id}` ? (

                      <>
                        <span
                          className="
                            spinner-border
                            spinner-border-sm
                            me-2
                          "
                          role="status"
                        />

                        Retirando...

                      </>

                    ) : (

                      'Sí, quitar rol'

                    )}

                  </button>

                </div>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  )

}


export default UserRolesModal