import {
  useEffect,
  useState,
} from 'react'


import {
  useAuth,
} from '../contexts/AuthContext'


import {
  obtenerPermisos,
  crearPermiso,
} from '../services/api'


import SessionManager from '../components/SessionManager'


import PermissionTable from '../components/PermissionTable'


import PermissionForm from '../components/PermissionForm'


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
  // GUARDANDO
  // ============================================================

  const [
    guardando,
    setGuardando,
  ] = useState(false)


  // ============================================================
  // MOSTRAR FORMULARIO
  // ============================================================

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false)


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
  // CREAR PERMISO
  // ============================================================

  const guardarPermiso = async (
    datos
  ) => {

    try {

      setGuardando(true)
      setMensaje(null)


      const nuevoPermiso =
        await crearPermiso(
          datos,
          token
        )


      // ========================================================
      // AGREGAR EL NUEVO PERMISO A LA LISTA
      // ========================================================

      setPermisos(
        (actuales) => [
          ...actuales,
          nuevoPermiso,
        ]
      )


      // ========================================================
      // CERRAR FORMULARIO
      // ========================================================

      setMostrarFormulario(false)


      // ========================================================
      // MENSAJE DE ÉXITO
      // ========================================================

      setMensaje({
        tipo: 'success',
        texto:
          'El permiso fue creado correctamente.',
      })

    } catch (error) {

      console.error(
        'Error creando permiso:',
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
            'No tienes permisos para crear permisos.',
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
          'No fue posible crear el permiso.',
      })

    } finally {

      setGuardando(false)

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

        <PermissionTable
          permisos={permisos}
          onNuevoPermiso={() => {
            setMensaje(null)
            setMostrarFormulario(true)
          }}
        />

      )}


      {/* ====================================================== */}
      {/* FORMULARIO NUEVO PERMISO                              */}
      {/* ====================================================== */}

      {mostrarFormulario && (

        <PermissionForm
          onGuardar={
            guardarPermiso
          }

          onCancelar={() => {

            if (guardando) {
              return
            }

            setMostrarFormulario(false)

          }}

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

    </>

  )

}


export default PermisosPage