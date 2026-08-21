import { NavLink } from 'react-router-dom'


function Sidebar({
  contraido,
  onToggle,
}) {

  const obtenerClaseLink = ({
    isActive,
  }) => {

    return `
      nav-link
      d-flex
      align-items-center
      gap-3
      px-3
      py-2
      rounded
      mb-1
      ${isActive ? 'active bg-primary text-white' : 'text-light'}
    `
  }


  return (

    <aside
      className="
        bg-dark
        text-light
        d-flex
        flex-column
        shadow
      "
      style={{
        width: contraido
          ? '72px'
          : '250px',

        minWidth: contraido
          ? '72px'
          : '250px',

        minHeight: '100vh',

        transition:
          'width 0.25s ease, min-width 0.25s ease',

        overflow: 'hidden',
      }}
    >

      {/* ================================================== */}
      {/* ENCABEZADO */}
      {/* ================================================== */}

      <div
        className="
          d-flex
          align-items-center
          justify-content-center
          border-bottom
        "
        style={{
          height: '64px',
        }}
      >

        <span
          className="fs-4"
          title="Gestión de Usuarios"
        >
          👥
        </span>

        {!contraido && (

          <span className="fw-bold ms-2 text-nowrap">
            Gestión de Usuarios
          </span>

        )}

      </div>


      {/* ================================================== */}
      {/* MENÚ */}
      {/* ================================================== */}

      <nav className="p-2 flex-grow-1">

        {/* DASHBOARD */}

        <NavLink
          to="."
          end
          className={obtenerClaseLink}
          title={
            contraido
              ? 'Dashboard'
              : undefined
          }
        >

          <span className="fs-5">
            🏠
          </span>

          {!contraido && (
            <span>
              Dashboard
            </span>
          )}

        </NavLink>


        {/* USUARIOS */}

        <NavLink
          to="usuarios"
          className={obtenerClaseLink}
          title={
            contraido
              ? 'Usuarios'
              : undefined
          }
        >

          <span className="fs-5">
            👤
          </span>

          {!contraido && (
            <span>
              Usuarios
            </span>
          )}

        </NavLink>


        {/* ROLES */}

        <NavLink
          to="roles"
          className={obtenerClaseLink}
          title={
            contraido
              ? 'Roles'
              : undefined
          }
        >

          <span className="fs-5">
            🛡️
          </span>

          {!contraido && (
            <span>
              Roles
            </span>
          )}

        </NavLink>


        {/* PERMISOS */}

        <NavLink
          to="permisos"
          className={obtenerClaseLink}
          title={
            contraido
              ? 'Permisos'
              : undefined
          }
        >

          <span className="fs-5">
            🔑
          </span>

          {!contraido && (
            <span>
              Permisos
            </span>
          )}

        </NavLink>

      </nav>


      {/* ================================================== */}
      {/* BOTÓN CONTRAER */}
      {/* ================================================== */}

      <div className="p-2 border-top">

        <button
          type="button"
          className="
            btn
            btn-outline-light
            w-100
            d-flex
            align-items-center
            justify-content-center
            gap-2
          "
          onClick={onToggle}
          title={
            contraido
              ? 'Mostrar menú'
              : 'Ocultar menú'
          }
        >

          <span>
            {contraido ? '▶' : '◀'}
          </span>

          {!contraido && (
            <span>
              Ocultar menú
            </span>
          )}

        </button>

      </div>

    </aside>

  )

}


export default Sidebar