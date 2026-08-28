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
        px-3
      "
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
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
          mb-3
        "
        style={{
          width: '100px',
          height: '100px',
          fontSize: '46px',
          flexShrink: 0,
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
          mb-2
        "
        style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
        }}
      >

        Bienvenido a su sistema

      </h1>


      <h4
        className="
          text-muted
          mb-3
        "
        style={{
          fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
        }}
      >

        Fénix SaS

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
            mb-3
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
        style={{
          fontSize: '15px',
        }}
      >

        📅 {fecha}

      </div>


      {/* ====================================================== */}
      {/* HORA */}
      {/* ====================================================== */}

      <div
        className="
          fw-semibold
        "
        style={{
          fontSize: 'clamp(1.6rem, 4vw, 2rem)',
        }}
      >

        🕐 {hora}

      </div>


      {/* ====================================================== */}
      {/* MENSAJE */}
      {/* ====================================================== */}

      <p
        className="
          text-muted
          mt-3
          mb-0
        "
        style={{
          fontSize: '15px',
        }}
      >

        Seleccione una opción del menú
        para comenzar.

      </p>

    </div>

  )

}


export default WelcomePage