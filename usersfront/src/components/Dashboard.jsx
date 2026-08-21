function Dashboard({
  usuarios,
  onExportarExcel,
  exportandoExcel,
}) {

  // ============================================================
  // ESTADÍSTICAS
  // ============================================================

  const totalUsuarios =
    usuarios.length

  const usuariosActivos =
    usuarios.filter(
      (usuario) =>
        usuario.status === 1
    ).length

  const usuariosInactivos =
    usuarios.filter(
      (usuario) =>
        usuario.status === 0
    ).length


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div
      className="
        container-fluid
        px-0
        mb-3
      "
    >

      <div
        className="
          row
          g-2
        "
      >

        {/* ================================================== */}
        {/* TOTAL */}
        {/* ================================================== */}

        <div className="col-12 col-md-4">

          <div
            className="
              card
              shadow-sm
              border-0
              h-100
            "
          >

            <div
              className="
                card-body
                py-2
                px-3
              "
            >

              <div
                className="
                  d-flex
                  align-items-center
                  justify-content-between
                "
              >

                <div>

                  <div
                    className="
                      text-muted
                      small
                    "
                  >
                    Total usuarios
                  </div>

                  <div
                    className="
                      fw-bold
                      fs-4
                      lh-1
                    "
                  >
                    {totalUsuarios}
                  </div>

                </div>


                <div
                  className="
                    rounded-circle
                    bg-primary
                    text-white
                    d-flex
                    align-items-center
                    justify-content-center
                  "
                  style={{
                    width: '42px',
                    height: '42px',
                    fontSize: '1.2rem',
                  }}
                >
                  👥
                </div>

              </div>

            </div>

          </div>

        </div>


        {/* ================================================== */}
        {/* ACTIVOS */}
        {/* ================================================== */}

        <div className="col-12 col-md-4">

          <div
            className="
              card
              shadow-sm
              border-0
              h-100
            "
          >

            <div
              className="
                card-body
                py-2
                px-3
              "
            >

              <div
                className="
                  d-flex
                  align-items-center
                  justify-content-between
                "
              >

                <div>

                  <div
                    className="
                      text-muted
                      small
                    "
                  >
                    Usuarios activos
                  </div>

                  <div
                    className="
                      fw-bold
                      fs-4
                      lh-1
                      text-success
                    "
                  >
                    {usuariosActivos}
                  </div>

                </div>


                <div
                  className="
                    rounded-circle
                    bg-success
                    text-white
                    d-flex
                    align-items-center
                    justify-content-center
                  "
                  style={{
                    width: '42px',
                    height: '42px',
                    fontSize: '1.2rem',
                  }}
                >
                  ✓
                </div>

              </div>

            </div>

          </div>

        </div>


        {/* ================================================== */}
        {/* INACTIVOS + EXPORTAR */}
        {/* ================================================== */}

        <div className="col-12 col-md-4">

          <div
            className="
              card
              shadow-sm
              border-0
              h-100
            "
          >

            <div
              className="
                card-body
                py-2
                px-3
              "
            >

              <div
                className="
                  d-flex
                  align-items-center
                  justify-content-between
                "
              >

                <div>

                  <div
                    className="
                      text-muted
                      small
                    "
                  >
                    Usuarios inactivos
                  </div>

                  <div
                    className="
                      fw-bold
                      fs-4
                      lh-1
                      text-secondary
                    "
                  >
                    {usuariosInactivos}
                  </div>

                </div>


                <div
                  className="
                    d-flex
                    align-items-center
                    gap-2
                  "
                >

                  <div
                    className="
                      rounded-circle
                      bg-secondary
                      text-white
                      d-flex
                      align-items-center
                      justify-content-center
                    "
                    style={{
                      width: '42px',
                      height: '42px',
                      fontSize: '1.2rem',
                    }}
                  >
                    ○
                  </div>


                  <button
                    type="button"
                    className="
                      btn
                      btn-success
                      btn-sm
                    "
                    onClick={
                      onExportarExcel
                    }
                    disabled={
                      exportandoExcel
                    }
                    title="Exportar usuarios a Excel"
                  >

                    {exportandoExcel ? (

                      <span
                        className="
                          spinner-border
                          spinner-border-sm
                        "
                        role="status"
                        aria-hidden="true"
                      />

                    ) : (

                      <>
                        📊
                        <span className="ms-1 d-none d-lg-inline">
                          Excel
                        </span>
                      </>

                    )}

                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  )

}


export default Dashboard