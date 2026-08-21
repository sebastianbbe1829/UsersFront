function Topbar({
  usuarioLogueado,
  modoOscuro,
  setModoOscuro,
  cerrarSesion,
}) {

  return (

    <nav
      className={
        modoOscuro
          ? 'navbar navbar-dark bg-black shadow'
          : 'navbar navbar-dark bg-dark shadow'
      }
    >

      <div className="container-fluid">

        {/* ============================================== */}
        {/* USUARIO */}
        {/* ============================================== */}

        <div className="ms-auto d-flex align-items-center gap-3">

          {usuarioLogueado && (

            <div className="text-end text-white">

              <div className="fw-bold">
                👤 {usuarioLogueado.name}
              </div>

              <small className="opacity-75">
                Número de identificación:{' '}
                {usuarioLogueado.dni}
              </small>

            </div>

          )}


          {/* ========================================== */}
          {/* MODO OSCURO */}
          {/* ========================================== */}

          <button
            type="button"
            className="btn btn-outline-light"
            onClick={() =>
              setModoOscuro(
                (valor) => !valor
              )
            }
            title={
              modoOscuro
                ? 'Cambiar a modo claro'
                : 'Cambiar a modo oscuro'
            }
          >

            {modoOscuro
              ? '☀️'
              : '🌙'}

          </button>


          {/* ========================================== */}
          {/* CERRAR SESIÓN */}
          {/* ========================================== */}

          <button
            type="button"
            className="btn btn-outline-light"
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </button>

        </div>

      </div>

    </nav>

  )

}


export default Topbar