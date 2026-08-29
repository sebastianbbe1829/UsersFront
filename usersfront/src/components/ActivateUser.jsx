import {
  useState,
  useEffect,
  useRef,
} from 'react'

import {
  useParams,
  Link,
} from 'react-router-dom'

import {
  activarUsuario,
} from '../services/api'


function ActivateUser() {

  // ==========================
  // PARÁMETROS DE LA URL
  // ==========================

  const {
    tenant,
    dni,
    token,
  } = useParams()


  // ==========================
  // ESTADOS
  // ==========================

  const [cargando, setCargando] =
    useState(true)

  const [resultado, setResultado] =
    useState(null)

  const [error, setError] =
    useState(null)

  const activacionEjecutada =
    useRef(false)

  // ==========================
  // ACTIVAR USUARIO
  // ==========================

useEffect(() => {

  // Evitar ejecutar la activación más de una vez
  if (activacionEjecutada.current) {
    return
  }

  activacionEjecutada.current = true


  const ejecutarActivacion = async () => {

    try {

      setCargando(true)
      setError(null)

      const respuesta =
        await activarUsuario(
          dni,
          token
        )

      console.log(
        'Respuesta activación:',
        respuesta
      )

      setResultado(
        respuesta
      )

    } catch (error) {

      console.error(
        'Error activando usuario:',
        error
      )

      setError(
        error.message
      )

    } finally {

      setCargando(false)

    }

  }


  ejecutarActivacion()

}, [dni, token])


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
          bg-light
        "
      >

        <div
          className="
            card
            shadow
            border-0
            p-5
            text-center
          "
          style={{
            maxWidth: '500px',
            width: '90%',
          }}
        >

          <div
            className="
              spinner-border
              text-primary
              mb-4
            "
            role="status"
          />

          <h4>
            Activando tu cuenta...
          </h4>

          <p className="text-muted mb-0">
            Estamos procesando tu solicitud.
          </p>

        </div>

      </div>

    )

  }


  // ==========================
  // ERROR
  // ==========================

  if (error) {

    return (

      <div
        className="
          vh-100
          d-flex
          justify-content-center
          align-items-center
          bg-light
        "
      >

        <div
          className="
            card
            shadow
            border-0
            p-5
            text-center
          "
          style={{
            maxWidth: '550px',
            width: '90%',
          }}
        >

          <div
            className="
              rounded-circle
              bg-danger-subtle
              text-danger
              d-flex
              justify-content-center
              align-items-center
              mx-auto
              mb-4
            "
            style={{
              width: '80px',
              height: '80px',
              fontSize: '40px',
            }}
          >
            ✕
          </div>


          <h3 className="mb-3">
            No fue posible activar la cuenta
          </h3>


          <p className="text-muted">
            {error}
          </p>


          <Link
            to={`/${tenant}/login`}
            className="btn btn-primary mt-3"
          >
            Ir al inicio de sesión
          </Link>

        </div>

      </div>

    )

  }


  // ==========================
  // ÉXITO
  // ==========================

  return (

    <div
      className="
        vh-100
        d-flex
        justify-content-center
        align-items-center
        bg-light
      "
    >

      <div
        className="
          card
          shadow
          border-0
          p-5
          text-center
        "
        style={{
          maxWidth: '550px',
          width: '90%',
        }}
      >

        {/* ========================== */}
        {/* ICONO */}
        {/* ========================== */}

        <div
          className="
            rounded-circle
            bg-success-subtle
            text-success
            d-flex
            justify-content-center
            align-items-center
            mx-auto
            mb-4
          "
          style={{
            width: '90px',
            height: '90px',
            fontSize: '48px',
          }}
        >
          ✓
        </div>


        {/* ========================== */}
        {/* MENSAJE */}
        {/* ========================== */}

        <h2 className="mb-3">
          ¡Cuenta activada!
        </h2>


        <p className="text-muted">
          {resultado?.message ||
            'Usuario activado correctamente'}
        </p>


        {/* ========================== */}
        {/* DATOS DEL USUARIO */}
        {/* ========================== */}

        {resultado && (

          <div
            className="
              bg-light
              rounded
              p-3
              mt-4
              text-start
            "
          >

            <div className="mb-2">

              <strong>
                Nombre:
              </strong>{' '}

              {resultado.name}

            </div>


            <div className="mb-2">

              <strong>
                Documento:
              </strong>{' '}

              {resultado.dni}

            </div>


            <div>

              <strong>
                Correo:
              </strong>{' '}

              {resultado.email}

            </div>

          </div>

        )}


        {/* ========================== */}
        {/* BOTÓN LOGIN */}
        {/* ========================== */}

        <Link
          to={`/${tenant}/login`}
          className="btn btn-primary mt-4"
        >
          Ir al inicio de sesión
        </Link>

      </div>

    </div>

  )

}


export default ActivateUser
