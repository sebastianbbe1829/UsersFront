import {
  useEffect,
  useMemo,
  useState,
} from 'react'


import {
  obtenerPermisos,
  obtenerPermisosRol,
  asignarPermisoRol,
  eliminarPermisoRol,
} from '../services/api'


function RolePermissionsModal({
  rol,
  token,
  onCerrar,
  onGuardado,
  onSesionExpirada,
}) {

  // ============================================================
  // PERMISOS GLOBALES
  // ============================================================

  const [
    permisos,
    setPermisos,
  ] = useState([])


  // ============================================================
  // RELACIONES ACTUALES
  // ============================================================

  const [
    permisosRol,
    setPermisosRol,
  ] = useState([])


  // ============================================================
  // BUSQUEDA
  // ============================================================

  const [
    busqueda,
    setBusqueda,
  ] = useState('')


  // ============================================================
  // CARGANDO
  // ============================================================

  const [
    cargando,
    setCargando,
  ] = useState(true)


  // ============================================================
  // GUARDANDO
  // ============================================================

  const [
    guardando,
    setGuardando,
  ] = useState(false)


  // ============================================================
  // ERROR
  // ============================================================

  const [
    error,
    setError,
  ] = useState('')


  // ============================================================
  // CARGAR INFORMACIÓN
  // ============================================================

  useEffect(() => {

    const cargarDatos = async () => {

      try {

        setCargando(true)
        setError('')


        const [
          permisosGlobales,
          relaciones,
        ] = await Promise.all([

          obtenerPermisos(
            token
          ),

          obtenerPermisosRol(
            rol.id,
            token
          ),

        ])


        setPermisos(
          Array.isArray(permisosGlobales)
            ? permisosGlobales
            : []
        )


        setPermisosRol(
          Array.isArray(relaciones)
            ? relaciones
            : []
        )

      } catch (error) {

        console.error(
          'Error cargando permisos del rol:',
          error
        )


        if (
          error.status === 401 &&
          onSesionExpirada
        ) {

          onSesionExpirada()

          return
        }


        if (error.status === 403) {

          setError(
            'No tienes permisos para consultar los permisos del rol.'
          )

          return
        }


        setError(
          error.message ||
          'No fue posible cargar los permisos del rol.'
        )

      } finally {

        setCargando(false)

      }

    }


    cargarDatos()

  }, [
    rol.id,
    token,
  ])


  // ============================================================
  // IDS DE PERMISOS ASIGNADOS
  // ============================================================

  const permisosAsignados =
    useMemo(() => {

      return new Set(
        permisosRol.map(
          (relacion) =>
            relacion.permission_id
        )
      )

    }, [
      permisosRol,
    ])


  // ============================================================
  // FILTRAR PERMISOS
  // ============================================================

  const permisosFiltrados =
    useMemo(() => {

      const texto =
        busqueda
          .toLowerCase()
          .trim()


      return permisos.filter(
        (permiso) => {

          if (
            permiso.status !== 1
          ) {

            return false

          }


          if (!texto) {

            return true

          }


          return (

            String(
              permiso.code ?? ''
            )
              .toLowerCase()
              .includes(texto)

            ||

            String(
              permiso.name ?? ''
            )
              .toLowerCase()
              .includes(texto)

          )

        }
      )

    }, [
      permisos,
      busqueda,
    ])


  // ============================================================
  // CAMBIAR PERMISO
  // ============================================================

  const cambiarPermiso = async (
    permiso
  ) => {

    setError('')


    const relacionActual =
      permisosRol.find(
        (relacion) =>
          relacion.permission_id ===
          permiso.id
      )


    try {

      setGuardando(true)


      // ========================================================
      // QUITAR PERMISO
      // ========================================================

      if (relacionActual) {

        await eliminarPermisoRol(
          relacionActual.id,
          token
        )


        setPermisosRol(
          (actuales) =>
            actuales.filter(
              (relacion) =>
                relacion.id !==
                relacionActual.id
            )
        )

      }

      // ========================================================
      // AGREGAR PERMISO
      // ========================================================

      else {

        const nuevaRelacion =
          await asignarPermisoRol(
            rol.id,
            permiso.id,
            token
          )


        setPermisosRol(
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


      if (
        error.status === 401 &&
        onSesionExpirada
      ) {

        onSesionExpirada()

        return
      }


      if (error.status === 403) {

        setError(
          'No tienes permisos para modificar los permisos del rol.'
        )

        return
      }


      setError(
        error.message ||
        'No fue posible modificar el permiso.'
      )

    } finally {

      setGuardando(false)

    }

  }


  // ============================================================
  // GUARDAR / CERRAR
  // ============================================================

  const cerrar = () => {

    if (guardando) {
      return
    }

    onGuardado?.()
    onCerrar()

  }


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div
      className="modal d-block"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor:
          'rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
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

        <div
          className="modal-content"
        >

          {/* ================================================== */}
          {/* CABECERA                                           */}
          {/* ================================================== */}

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

              <small
                className="text-muted"
              >
                {rol.name} ({rol.code})
              </small>

            </div>


            <button
              type="button"
              className="btn-close"
              aria-label="Cerrar"
              onClick={onCerrar}
              disabled={guardando}
            />

          </div>


          {/* ================================================== */}
          {/* CUERPO                                             */}
          {/* ================================================== */}

          <div
            className="
              modal-body
              py-3
              px-3
            "
          >

            {/* ERROR */}

            {error && (

              <div
                className="
                  alert
                  alert-danger
                  py-2
                "
              >
                ⚠️ {error}
              </div>

            )}


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

                <div
                  className="text-muted"
                >
                  Cargando permisos...
                </div>

              </div>

            ) : (

              <>

                {/* ========================================== */}
                {/* BUSCADOR                                    */}
                {/* ========================================== */}

                <div className="mb-3">

                  <label
                    className="
                      form-label
                      fw-semibold
                      mb-1
                    "
                  >
                    Buscar permiso
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Código o nombre..."
                    value={busqueda}
                    onChange={(event) =>
                      setBusqueda(
                        event.target.value
                      )
                    }
                    disabled={guardando}
                  />

                </div>


                {/* ========================================== */}
                {/* RESUMEN                                    */}
                {/* ========================================== */}

                <div
                  className="
                    d-flex
                    justify-content-between
                    mb-2
                    small
                    text-muted
                  "
                >

                  <span>
                    Permisos disponibles:{' '}
                    <strong>
                      {permisosFiltrados.length}
                    </strong>
                  </span>

                  <span>
                    Asignados:{' '}
                    <strong>
                      {permisosAsignados.size}
                    </strong>
                  </span>

                </div>


                {/* ========================================== */}
                {/* LISTA                                     */}
                {/* ========================================== */}

                <div
                  className="
                    border
                    rounded
                  "
                  style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }}
                >

                  {permisosFiltrados.length === 0 ? (

                    <div
                      className="
                        text-center
                        text-muted
                        py-4
                      "
                    >
                      No se encontraron permisos.
                    </div>

                  ) : (

                    permisosFiltrados.map(
                      (permiso) => {

                        const asignado =
                          permisosAsignados.has(
                            permiso.id
                          )


                        return (

                          <div
                            key={permiso.id}
                            className="
                              d-flex
                              align-items-center
                              border-bottom
                              px-3
                              py-2
                            "
                          >

                            <div
                              className="form-check"
                            >

                              <input
                                className="
                                  form-check-input
                                "
                                type="checkbox"
                                id={
                                  `permiso-${permiso.id}`
                                }
                                checked={
                                  asignado
                                }
                                onChange={() =>
                                  cambiarPermiso(
                                    permiso
                                  )
                                }
                                disabled={
                                  guardando
                                }
                              />

                            </div>


                            <label
                              className="
                                ms-2
                                flex-grow-1
                                mb-0
                              "
                              htmlFor={
                                `permiso-${permiso.id}`
                              }
                              style={{
                                cursor:
                                  guardando
                                    ? 'default'
                                    : 'pointer',
                              }}
                            >

                              <div
                                className="fw-semibold"
                              >
                                {permiso.code}
                              </div>

                              <div
                                className="
                                  small
                                  text-muted
                                "
                              >
                                {permiso.name}
                              </div>

                            </label>

                          </div>

                        )

                      }
                    )

                  )}

                </div>

              </>

            )}

          </div>


          {/* ================================================== */}
          {/* FOOTER                                             */}
          {/* ================================================== */}

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
              onClick={cerrar}
              disabled={guardando}
            >
              Cerrar
            </button>

          </div>

        </div>

      </div>

    </div>

  )

}


export default RolePermissionsModal