import {
  useEffect,
  useState,
} from 'react'

import {
  useAuth,
} from '../contexts/AuthContext'


function WelcomePage() {

  const {
    tenant,
    usuarioLogueado,
  } = useAuth()


  const [ahora, setAhora] =
    useState(new Date())


  // ============================================================
  // RELOJ
  // ============================================================

  useEffect(() => {

    const intervalo =
      setInterval(() => {

        setAhora(
          new Date()
        )

      }, 1000)


    return () => {

      clearInterval(
        intervalo
      )

    }

  }, [])


  // ============================================================
  // FECHA
  // ============================================================

  const fecha =
    ahora.toLocaleDateString(
      'es-CO',
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    )


  // ============================================================
  // HORA
  // ============================================================

  const hora =
    ahora.toLocaleTimeString(
      'es-CO',
      {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }
    )


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div
      className="
        d-flex
        flex-column
        align-items-center
        justify-content-center
        text-center
      "
      style={{
        minHeight: 'calc(100vh - 70px)',
      }}
    >

      {/* ====================================================== */}
      {/* ICONO */}
      {/* ====================================================== */}

      <div
        className="
          rounded-circle
          bg-primary
          text-white
          d-flex
          align-items-center
          justify-content-center
          shadow
          mb-4
        "
        style={{
          width: '90px',
          height: '90px',
          fontSize: '42px',
        }}
      >
        👋
      </div>


      {/* ====================================================== */}
      {/* BIENVENIDA */}
      {/* ====================================================== */}

      <h1
        className="
          fw-bold
          mb-3
        "
      >
        Bienvenido a su sistema
      </h1>


      <h4
        className="
          text-muted
          mb-4
        "
      >
        Gestión de Usuarios
      </h4>


      {/* ====================================================== */}
      {/* USUARIO */}
      {/* ====================================================== */}

      {usuarioLogueado && (

        <p
          className="
            fs-5
            mb-2
          "
        >

          Hola,

          <strong className="ms-1">
            {usuarioLogueado.name}
          </strong>

        </p>

      )}


      {/* ====================================================== */}
      {/* TENANT */}
      {/* ====================================================== */}

      {tenant && (

        <div
          className="
            badge
            bg-light
            text-dark
            border
            px-3
            py-2
            mb-4
          "
          style={{
            fontSize: '14px',
          }}
        >

          Empresa: {tenant}

        </div>

      )}


      {/* ====================================================== */}
      {/* FECHA */}
      {/* ====================================================== */}

      <div
        className="
          text-muted
          text-capitalize
          mb-2
        "
      >

        📅 {fecha}

      </div>


      {/* ====================================================== */}
      {/* HORA */}
      {/* ====================================================== */}

      <div
        className="
          fw-semibold
          fs-3
        "
      >

        🕐 {hora}

      </div>


      {/* ====================================================== */}
      {/* MENSAJE */}
      {/* ====================================================== */}

      <p
        className="
          text-muted
          mt-4
          mb-0
        "
      >

        Seleccione una opción del menú
        para comenzar.

      </p>

    </div>

  )

}


export default WelcomePage