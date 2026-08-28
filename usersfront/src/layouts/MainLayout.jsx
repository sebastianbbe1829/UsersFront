import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import {
  useState,
} from 'react'

import {
  useAuth,
} from '../contexts/AuthContext'

import {
  useTenantConfig,
} from '../contexts/TenantConfigContext'

import {
  obtenerPayloadToken,
} from '../services/api'


function MainLayout() {

  // ============================================================
  // CONTEXT
  // ============================================================

  const {
    usuarioLogueado,
    cerrarSesion,
    tenant,
    token,
  } = useAuth()

  const {
    config,
  } = useTenantConfig()


  // ============================================================
  // IDENTIDAD SUPER
  // ============================================================

  const payload =
    obtenerPayloadToken(token)

  const esSuper =
    payload?.user_type === 'SUPER'


  // ============================================================
  // NAVEGACIÓN
  // ============================================================

  const navigate =
    useNavigate()

  const location =
    useLocation()


  // ============================================================
  // ESTADO DEL MENÚ
  // ============================================================

  const [
    menuColapsado,
    setMenuColapsado,
  ] = useState(false)


  // ============================================================
  // MODO OSCURO
  // ============================================================

  const [
    modoOscuro,
    setModoOscuro,
  ] = useState(() => {

    return (
      localStorage.getItem(
        'modo_oscuro'
      ) === 'true'
    )

  })


  // ============================================================
  // CAMBIAR MODO OSCURO
  // ============================================================

  const cambiarModoOscuro = () => {

    setModoOscuro(
      (valor) => {

        const nuevoValor =
          !valor

        localStorage.setItem(
          'modo_oscuro',
          nuevoValor
        )

        return nuevoValor

      }
    )

  }


  // ============================================================
  // CERRAR SESIÓN
  // ============================================================

  const manejarCerrarSesion = () => {

    cerrarSesion()


    if (tenant) {

      navigate(
        `/${tenant}/login`,
        {
          replace: true,
        }
      )

      return

    }


    navigate(
      '/login',
      {
        replace: true,
      }
    )

  }


  // ============================================================
  // ANCHO DEL MENÚ
  // ============================================================

  const anchoMenu =
    menuColapsado
      ? '72px'
      : '250px'


  // ============================================================
  // TÍTULO DEL ENCABEZADO
  // ============================================================

  const obtenerTituloPagina = () => {

    const ruta =
      location.pathname


    if (
      ruta.includes('/usuarios')
    ) {

      return {
        icono: '👥',
        titulo: 'Gestión de usuarios',
      }

    }


    if (
      ruta.includes('/roles')
    ) {

      return {
        icono: '🛡️',
        titulo: 'Gestión de roles',
      }

    }


    if (
      ruta.includes('/permisos')
    ) {

      return {
        icono: '🔐',
        titulo: 'Gestión de permisos',
      }

    }


    if (
      ruta.includes('/configuracion-ui')
    ) {

      return {
        icono: '🎨',
        titulo: 'Configuración de la interfaz',
      }

    }


    if (
      ruta.includes('/administracion-tenant')
    ) {

      return {
        icono: '🏢',
        titulo: 'Administración del tenant',
      }

    }


    return {
      icono: '🏠',
      titulo: 'Panel de administración',
    }

  }


  const pagina =
    obtenerTituloPagina()


  // ============================================================
  // CLASE PARA OPCIONES DEL MENÚ
  // ============================================================

  const obtenerClaseMenu = ({
    isActive,
  }) => {

    return `
      d-flex
      align-items-center
      text-decoration-none
      py-3
      px-3
      border-0
      rounded-0
      w-100
      ${
        isActive
          ? 'text-white'
          : 'bg-dark text-white'
      }
    `

  }


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div
      className={
        modoOscuro
          ? 'bg-dark text-light min-vh-100'
          : 'bg-light min-vh-100'
      }
      style={{
        display: 'flex',
      }}
    >

      <aside
        className={
          modoOscuro
            ? 'bg-black text-light shadow'
            : 'bg-dark text-white shadow'
        }
        style={{
          width: anchoMenu,
          minHeight: '100vh',
          transition: 'width 0.25s ease',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          overflow: 'hidden',
        }}
      >

        {/* ==================================================== */}
        {/* CABECERA */}
        {/* ==================================================== */}

        <div
          className="
            d-flex
            align-items-center
            justify-content-between
            px-3
            py-3
            border-bottom
            border-secondary
          "
          style={{
            height: '70px',
          }}
        >

          {!menuColapsado && (

            <div
              className="
                d-flex
                align-items-center
                gap-2
                fw-bold
                text-nowrap
              "
            >
              {config.logo_url ? (
                <img
                  src={config.logo_url}
                  alt="Logo"
                  style={{
                    maxHeight: '36px',
                    maxWidth: '48px',
                    objectFit: 'contain',
                  }}
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <span>👥</span>
              )}
              <span>{config.app_title || 'Gestión de Usuarios'}</span>
            </div>

          )}

          <button
            type="button"
            className="
              btn
              btn-outline-light
              border-0
              ms-auto
            "
            onClick={() =>
              setMenuColapsado(
                (valor) => !valor
              )
            }
            title={
              menuColapsado
                ? 'Mostrar menú'
                : 'Ocultar menú'
            }
          >
            {menuColapsado ? '☰' : '✕'}
          </button>

        </div>


        {/* ==================================================== */}
        {/* OPCIONES DEL MENÚ */}
        {/* ==================================================== */}

        <nav
          className="
            d-flex
            flex-column
          "
        >

          {/* USUARIOS */}

          <NavLink
            to="usuarios"
            className={obtenerClaseMenu}
            title="Usuarios"
            style={({ isActive }) => isActive ? { backgroundColor: config.primary_color } : undefined}
          >
            <span
              style={{
                fontSize: '21px',
                minWidth: '24px',
                textAlign: 'center',
              }}
            >
              👥
            </span>

            {!menuColapsado && (
              <span className="ms-3">Usuarios</span>
            )}
          </NavLink>


          {/* ROLES */}

          <NavLink
            to="roles"
            className={obtenerClaseMenu}
            title="Roles"
            style={({ isActive }) => isActive ? { backgroundColor: config.primary_color } : undefined}
          >
            <span
              style={{
                fontSize: '21px',
                minWidth: '24px',
                textAlign: 'center',
              }}
            >
              🛡️
            </span>

            {!menuColapsado && (
              <span className="ms-3">Roles</span>
            )}
          </NavLink>


          {/* PERMISOS */}

          <NavLink
            to="permisos"
            className={obtenerClaseMenu}
            title="Permisos"
            style={({ isActive }) => isActive ? { backgroundColor: config.primary_color } : undefined}
          >
            <span
              style={{
                fontSize: '21px',
                minWidth: '24px',
                textAlign: 'center',
              }}
            >
              🔐
            </span>

            {!menuColapsado && (
              <span className="ms-3">Permisos</span>
            )}
          </NavLink>


          {/* CONFIGURACIÓN DE LA INTERFAZ */}

          <NavLink
            to="configuracion-ui"
            className={obtenerClaseMenu}
            title="Configuración de la interfaz"
            style={({ isActive }) => isActive ? { backgroundColor: config.primary_color } : undefined}
          >
            <span
              style={{
                fontSize: '21px',
                minWidth: '24px',
                textAlign: 'center',
              }}
            >
              🎨
            </span>

            {!menuColapsado && (
              <span className="ms-3">Configuración UI</span>
            )}
          </NavLink>


          {/* ================================================== */}
          {/* ADMINISTRACIÓN DEL TENANT - SOLO SUPER */}
          {/* ================================================== */}

          {esSuper && (

            <NavLink
              to="administracion-tenant"
              className={obtenerClaseMenu}
              title="Administración del tenant"
              style={({ isActive }) => isActive ? { backgroundColor: config.primary_color } : undefined}
            >
              <span
                style={{
                  fontSize: '21px',
                  minWidth: '24px',
                  textAlign: 'center',
                }}
              >
                🏢
              </span>

              {!menuColapsado && (
                <span className="ms-3">
                  Administración del tenant
                </span>
              )}
            </NavLink>

          )}

        </nav>


        {/* ==================================================== */}
        {/* PARTE INFERIOR */}
        {/* ==================================================== */}

        <div
          className="
            position-absolute
            bottom-0
            start-0
            end-0
          "
        >

          {/* MODO OSCURO */}

          <button
            type="button"
            className="
              btn
              btn-dark
              text-white
              border-0
              rounded-0
              w-100
              text-start
              py-3
              px-3
            "
            onClick={cambiarModoOscuro}
            title={
              modoOscuro
                ? 'Cambiar a modo claro'
                : 'Cambiar a modo oscuro'
            }
          >
            <span
              style={{
                fontSize: '21px',
                minWidth: '24px',
                display: 'inline-block',
                textAlign: 'center',
              }}
            >
              {modoOscuro ? '☀️' : '🌙'}
            </span>

            {!menuColapsado && (
              <span className="ms-3">
                {modoOscuro ? 'Modo claro' : 'Modo oscuro'}
              </span>
            )}
          </button>


          {/* CERRAR SESIÓN */}

          <button
            type="button"
            className="
              btn
              btn-danger
              rounded-0
              w-100
              text-start
              py-3
              px-3
            "
            onClick={manejarCerrarSesion}
            title="Cerrar sesión"
          >
            <span
              style={{
                fontSize: '21px',
                minWidth: '24px',
                display: 'inline-block',
                textAlign: 'center',
              }}
            >
              🚪
            </span>

            {!menuColapsado && (
              <span className="ms-3">Cerrar sesión</span>
            )}
          </button>

        </div>

      </aside>


      {/* ====================================================== */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ====================================================== */}

      <main
        style={{
          marginLeft: anchoMenu,
          width: `calc(100% - ${anchoMenu})`,
          minHeight: '100vh',
          transition:
            'margin-left 0.25s ease, width 0.25s ease',
        }}
      >

        {/* ==================================================== */}
        {/* BARRA SUPERIOR */}
        {/* ==================================================== */}

        <header
          className={
            modoOscuro
              ? 'bg-black text-light shadow-sm'
              : 'bg-white text-dark shadow-sm'
          }
          style={{
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 30px',
            borderBottom: `3px solid ${config.primary_color}`,
          }}
        >

          <div
            className="
              d-flex
              align-items-center
              gap-2
            "
          >
            <span style={{ fontSize: '21px' }}>
              {pagina.icono}
            </span>

            <h5 className="mb-0 fw-bold">
              {pagina.titulo}
            </h5>
          </div>


          <div
            className="
              d-flex
              align-items-center
              gap-3
            "
          >

            {tenant && (
              <div
                className="
                  d-none
                  d-md-flex
                  align-items-center
                  gap-2
                "
              >
                <span>🏢</span>
                <span className="fw-semibold">{tenant}</span>
              </div>
            )}

            {tenant && usuarioLogueado && (
              <span className="text-muted d-none d-md-inline">
                |
              </span>
            )}

            {usuarioLogueado && (
              <div
                className="
                  d-flex
                  align-items-center
                  gap-2
                "
              >
                <span style={{ fontSize: '21px' }}>👤</span>

                <div
                  className="
                    d-none
                    d-sm-block
                    text-end
                  "
                >
                  <div
                    className="fw-semibold text-truncate"
                    style={{ maxWidth: '180px' }}
                  >
                    {usuarioLogueado.name}
                  </div>

                  {esSuper && (
                    <small className="fw-semibold" style={{ color: config.primary_color }}>
                      SUPER
                    </small>
                  )}
                </div>
              </div>
            )}

            <div
              className="
                d-flex
                align-items-center
                gap-1
              "
              title="Sesión activa"
            >
              <span style={{ fontSize: '12px' }}>🟢</span>
              <small className="text-muted">Activa</small>
            </div>

          </div>

        </header>


        {/* ==================================================== */}
        {/* CONTENIDO DE LA PÁGINA */}
        {/* ==================================================== */

        <section className="p-4">
          <Outlet />
        </section>

      </main>

    </div>

  )

}


export default MainLayout
