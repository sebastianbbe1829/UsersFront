import {
  useEffect,
  useState,
} from 'react'


function PermissionForm({
  permiso,
  onGuardar,
  onCancelar,
  guardando = false,
  error = '',
}) {

  // ============================================================
  // ESTADO DEL FORMULARIO
  // ============================================================

  const [
    formulario,
    setFormulario,
  ] = useState({
    code: '',
    name: '',
    status: 1,
  })


  // ============================================================
  // CARGAR DATOS
  // ============================================================

  useEffect(() => {

    if (permiso) {

      setFormulario({
        code:
          permiso.code ?? '',

        name:
          permiso.name ?? '',

        status:
          permiso.status ?? 1,
      })

    } else {

      setFormulario({
        code: '',
        name: '',
        status: 1,
      })

    }

  }, [permiso])


  // ============================================================
  // CAMBIAR CAMPO
  // ============================================================

  const cambiarCampo = (
    campo,
    valor
  ) => {

    setFormulario(
      (actual) => ({
        ...actual,
        [campo]: valor,
      })
    )

  }


  // ============================================================
  // GUARDAR
  // ============================================================

  const guardar = (
    event
  ) => {

    event.preventDefault()


    const datos = {

      code:
        formulario.code.trim(),

      name:
        formulario.name.trim(),

    }


    // ==========================================================
    // EL ESTADO SOLO SE ENVÍA AL EDITAR
    // ==========================================================

    if (permiso) {

      datos.status =
        Number(
          formulario.status
        )

    }


    onGuardar(
      datos
    )

  }


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div
      className="modal d-block"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor:
          'rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
        overflowY: 'auto',
      }}
    >

      <div
        className="
          modal-dialog
          modal-dialog-centered
        "
        style={{
          maxWidth: '600px',
          width: 'calc(100% - 2rem)',
          margin: '1rem auto',
        }}
      >

        <div
          className="modal-content"
          style={{
            maxHeight:
              'calc(100vh - 2rem)',
          }}
        >


          {/* ================================================== */}
          {/* CABECERA                                           */}
          {/* ================================================== */}

          <div
            className="
              modal-header
              py-2
              px-3
            "
          >

            <div>

              <h5
                className="
                  modal-title
                  fw-bold
                  mb-0
                "
              >
                {permiso
                  ? 'Editar permiso'
                  : 'Nuevo permiso'}
              </h5>

              <small
                className="text-muted"
              >
                {permiso
                  ? 'Actualiza la información del permiso'
                  : 'Ingresa la información del nuevo permiso'}
              </small>

            </div>


            <button
              type="button"
              className="btn-close"
              aria-label="Cerrar"
              onClick={
                onCancelar
              }
              disabled={
                guardando
              }
            />

          </div>


          {/* ================================================== */}
          {/* FORMULARIO                                         */}
          {/* ================================================== */}

          <form
            onSubmit={
              guardar
            }
            autoComplete="off"
          >

            {/* ================================================== */}
            {/* CUERPO                                             */}
            {/* ================================================== */}

            <div
              className="
                modal-body
                py-3
                px-3
              "
              style={{
                overflowY: 'auto',
                maxHeight:
                  'calc(100vh - 150px)',
              }}
            >


              {/* ================================================= */}
              {/* ERROR                                             */}
              {/* ================================================= */}

              {error && (

                <div
                  className="
                    alert
                    alert-danger
                    py-2
                    mb-3
                  "
                  role="alert"
                >

                  <div
                    className="
                      d-flex
                      align-items-start
                    "
                  >

                    <div
                      className="me-2"
                      style={{
                        fontSize: '1.1rem',
                      }}
                    >
                      ⚠️
                    </div>

                    <div>
                      {error}
                    </div>

                  </div>

                </div>

              )}


              {/* ================================================= */}
              {/* CÓDIGO                                             */}
              {/* ================================================= */}

              <div className="mb-3">

                <label
                  className="
                    form-label
                    fw-semibold
                    mb-1
                  "
                >
                  Código
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={
                    formulario.code
                  }
                  onChange={(
                    event
                  ) =>
                    cambiarCampo(
                      'code',
                      event.target.value
                    )
                  }
                  placeholder="Ej. USERS_CREATE"
                  maxLength={100}
                  required
                  disabled={
                    guardando
                  }
                />

                <div
                  className="
                    form-text
                  "
                >
                  Identificador único del permiso.
                </div>

              </div>


              {/* ================================================= */}
              {/* NOMBRE                                             */}
              {/* ================================================= */}

              <div className="mb-3">

                <label
                  className="
                    form-label
                    fw-semibold
                    mb-1
                  "
                >
                  Nombre
                </label>

                <input
                  type="text"
                  className="form-control"
                  value={
                    formulario.name
                  }
                  onChange={(
                    event
                  ) =>
                    cambiarCampo(
                      'name',
                      event.target.value
                    )
                  }
                  placeholder="Ej. Crear usuarios"
                  maxLength={150}
                  required
                  disabled={
                    guardando
                  }
                />

              </div>


              {/* ================================================= */}
              {/* ESTADO                                             */}
              {/* ================================================= */}

              {permiso && (

                <div className="mb-3">

                  <label
                    className="
                      form-label
                      fw-semibold
                      mb-1
                    "
                  >
                    Estado
                  </label>

                  <select
                    className="form-select"
                    value={
                      formulario.status
                    }
                    onChange={(
                      event
                    ) =>
                      cambiarCampo(
                        'status',
                        event.target.value
                      )
                    }
                    disabled={
                      guardando
                    }
                  >

                    <option value="1">
                      Activo
                    </option>

                    <option value="0">
                      Inactivo
                    </option>

                  </select>

                </div>

              )}

            </div>


            {/* ================================================== */}
            {/* BOTONES                                             */}
            {/* ================================================== */}

            <div
              className="
                modal-footer
                py-2
                px-3
              "
            >

              <button
                type="button"
                className="
                  btn
                  btn-secondary
                "
                onClick={
                  onCancelar
                }
                disabled={
                  guardando
                }
              >
                Cancelar
              </button>


              <button
                type="submit"
                className="
                  btn
                  btn-primary
                "
                disabled={
                  guardando
                }
              >

                {guardando ? (

                  <>

                    <span
                      className="
                        spinner-border
                        spinner-border-sm
                        me-2
                      "
                      role="status"
                      aria-hidden="true"
                    />

                    {permiso
                      ? 'Guardando...'
                      : 'Creando...'}

                  </>

                ) : (

                  permiso
                    ? 'Guardar cambios'
                    : 'Crear permiso'

                )}

              </button>

            </div>

          </form>

        </div>

      </div>

    </div>

  )

}


export default PermissionForm