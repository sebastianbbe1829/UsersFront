import {
  useEffect,
  useState,
} from 'react'


import {
  useAuth,
} from '../contexts/AuthContext'


import {
  obtenerPermisos,
} from '../services/api'


import SessionManager from '../components/SessionManager'


function PermisosPage() {

  // ============================================================
  // CONTEXT
  // ============================================================

  const {
    token,
    manejarSesionExpirada,
  } = useAuth()


  // ============================================================
  // PERMISOS
  // ============================================================

  const [
    permisos,
    setPermisos,
  ] = useState([])


  // ============================================================
  // CARGANDO
  // ============================================================

  const [
    cargando,
    setCargando,
  ] = useState(true)


  // ============================================================
  // MENSAJE
  // ============================================================

  const [
    mensaje,
    setMensaje,
  ] = useState(null)


  // ============================================================
  // CARGAR PERMISOS
  // ============================================================

  const cargarPermisos = async () => {

    try {

      setCargando(true)
      setMensaje(null)


      const resultado =
        await obtenerPermisos(
          token
        )


      setPermisos(
        Array.isArray(resultado)
          ? resultado
          : []
      )

    } catch (error) {

      console.error(
        'Error obteniendo permisos:',
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
            'No tienes permisos para consultar los permisos.',
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
          'No fue posible cargar los permisos.',
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

    cargarPermisos()

  }, [token])


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <>

      {/* ====================================================== */}
      {/* VIGILAR SESIÓN                                        */}
      {/* ====================================================== */}

      <SessionManager
        token={token}
        onSesionExpirada={
          manejarSesionExpirada
        }
      />


      {/* ====================================================== */}
      {/* TÍTULO                                                 */}
      {/* ====================================================== */}

      <div className="mb-4">

        <h2 className="fw-bold mb-1">
          Gestión de Permisos
        </h2>

        <p className="text-muted mb-0">
          Permisos globales disponibles para asignar a los roles.
        </p>

      </div>


      {/* ====================================================== */}
      {/* MENSAJE                                                */}
      {/* ====================================================== */}

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


      {/* ====================================================== */}
      {/* CARGANDO                                               */}
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
              Cargando permisos...
            </div>

          </div>

        </div>

      ) : (

        <>

          {/* ================================================== */}
          {/* RESUMEN                                             */}
          {/* ================================================== */}

          <div className="mb-3">

            <span className="text-muted">
              Total de permisos:{' '}
            </span>

            <strong>
              {permisos.length}
            </strong>

          </div>


          {/* ================================================== */}
          {/* TABLA                                              */}
          {/* ================================================== */}

          <div
            className="
              card
              shadow-sm
              border-0
            "
          >

            <div className="table-responsive">

              <table
                className="
                  table
                  table-hover
                  align-middle
                  mb-0
                "
              >

                <thead className="table-dark">

                  <tr>

                    <th>
                      Código
                    </th>

                    <th>
                      Nombre
                    </th>

                    <th>
                      Estado
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {permisos.length === 0 ? (

                    <tr>

                      <td
                        colSpan="3"
                        className="
                          text-center
                          py-4
                          text-muted
                        "
                      >
                        No hay permisos disponibles.
                      </td>

                    </tr>

                  ) : (

                    permisos.map(
                      (permiso) => (

                        <tr
                          key={permiso.id}
                        >

                          <td>
                            <strong>
                              {permiso.code}
                            </strong>
                          </td>


                          <td>
                            {permiso.name}
                          </td>


                          <td>

                            {permiso.status === 1 ? (

                              <span
                                className="
                                  badge
                                  bg-success
                                "
                              >
                                Activo
                              </span>

                            ) : (

                              <span
                                className="
                                  badge
                                  bg-secondary
                                "
                              >
                                Inactivo
                              </span>

                            )}

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </>

      )}

    </>

  )

}


export default PermisosPage