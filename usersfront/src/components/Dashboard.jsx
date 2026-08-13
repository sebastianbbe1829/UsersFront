function Dashboard({ usuarios }) {

  const totalUsuarios = usuarios.length

  const usuariosActivos = usuarios.filter(
    (usuario) => usuario.status === true
  ).length

  const usuariosInactivos = usuarios.filter(
    (usuario) => usuario.status === false
  ).length


  return (
    <div className="container mb-4">

      <div className="row g-3">

        {/* TOTAL */}

        <div className="col-12 col-md-4">

          <div className="card shadow-sm border-0 h-100">

            <div className="card-body">

              <div className="d-flex justify-content-between align-items-center">

                <div>

                  <div className="text-muted">
                    Total usuarios
                  </div>

                  <h2 className="fw-bold mb-0">
                    {totalUsuarios}
                  </h2>

                </div>

                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                  style={{
                    width: '55px',
                    height: '55px',
                    fontSize: '1.5rem',
                  }}
                >
                  👥
                </div>

              </div>

            </div>

          </div>

        </div>


        {/* ACTIVOS */}

        <div className="col-12 col-md-4">

          <div className="card shadow-sm border-0 h-100">

            <div className="card-body">

              <div className="d-flex justify-content-between align-items-center">

                <div>

                  <div className="text-muted">
                    Usuarios activos
                  </div>

                  <h2 className="fw-bold text-success mb-0">
                    {usuariosActivos}
                  </h2>

                </div>

                <div
                  className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center"
                  style={{
                    width: '55px',
                    height: '55px',
                    fontSize: '1.5rem',
                  }}
                >
                  ✓
                </div>

              </div>

            </div>

          </div>

        </div>


        {/* INACTIVOS */}

        <div className="col-12 col-md-4">

          <div className="card shadow-sm border-0 h-100">

            <div className="card-body">

              <div className="d-flex justify-content-between align-items-center">

                <div>

                  <div className="text-muted">
                    Usuarios inactivos
                  </div>

                  <h2 className="fw-bold text-secondary mb-0">
                    {usuariosInactivos}
                  </h2>

                </div>

                <div
                  className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                  style={{
                    width: '55px',
                    height: '55px',
                    fontSize: '1.5rem',
                  }}
                >
                  ○
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