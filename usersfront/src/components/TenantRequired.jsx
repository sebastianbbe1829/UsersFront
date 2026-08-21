function TenantRequired() {

  return (

    <div
      className="
        min-vh-100
        d-flex
        align-items-center
        justify-content-center
      "
      style={{
        background:
          'linear-gradient(135deg, #0d6efd 0%, #6f42c1 100%)',
      }}
    >

      <div
        className="
          card
          shadow-lg
          border-0
          text-center
        "
        style={{
          width: '500px',
          maxWidth: '90%',
        }}
      >

        <div className="card-body p-5">

          {/* ICONO */}

          <div
            className="
              rounded-circle
              bg-warning
              d-inline-flex
              align-items-center
              justify-content-center
              mb-4
            "
            style={{
              width: '80px',
              height: '80px',
              fontSize: '38px',
            }}
          >
            ⚠️
          </div>


          {/* TÍTULO */}

          <h2 className="fw-bold mb-3">
            Empresa no seleccionada
          </h2>


          {/* MENSAJE */}

          <p className="text-muted mb-4">

            Debes indicar la URL completa
            de la empresa para poder ingresar
            al sistema.

          </p>


          {/* EJEMPLO */}

          <div className="alert alert-light border">

            <div className="fw-semibold mb-2">
              Ejemplo:
            </div>

            <div className="text-break">
              https://gestion-usuarios.sebastianbbe.workers.dev/empresa-demo
            </div>

          </div>


          {/* MENSAJE FINAL */}

          <small className="text-muted">

            La empresa se identifica automáticamente
            a partir de la URL.

          </small>

        </div>

      </div>

    </div>

  )

}


export default TenantRequired