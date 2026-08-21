import {
  useEffect,
  useState,
} from 'react'

import {
  actualizarRol,
} from '../services/api'


function EditRoleForm({
  rol,
  token,
  onRolActualizado,
  onCancelar,
}) {

  // ============================================================
  // FORMULARIO
  // ============================================================

  const [
    formulario,
    setFormulario,
  ] = useState({
    code: '',
    name: '',
    description: '',
    status: 1,
  })


  // ============================================================
  // ESTADOS
  // ============================================================

  const [
    error,
    setError,
  ] = useState('')


  const [
    guardando,
    setGuardando,
  ] = useState(false)


  // ============================================================
  // CARGAR ROL
  // ============================================================

  useEffect(() => {

    if (!rol) {
      return
    }

    setFormulario({
      code: rol.code ?? '',
      name: rol.name ?? '',
      description: rol.description ?? '',
      status: rol.status ?? 1,
    })

    setError('')

  }, [rol])


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
  // GUARDAR CAMBIOS
  // ============================================================

  const guardarCambios = async (
    event
  ) => {

    event.preventDefault()

    setError('')
    setGuardando(true)


    const datos = {
      code:
        formulario.code.trim(),

      name:
        formulario.name.trim(),

      description:
        formulario.description.trim() ||
        null,

      status:
        Number(formulario.status),
    }


    try {

      const resultado =
        await actualizarRol(
          rol.id,
          datos,
          token
        )


      onRolActualizado(
        resultado
      )

    } catch (error) {

      console.error(
        'Error actualizando rol:',
        error
      )

      setError(
        error.message ||
        'No fue posible actualizar el rol.'
      )

    } finally {

      setGuardando(false)

    }

  }


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div
      className="modal d-block"
      style={{
        backgroundColor:
          'rgba(0, 0, 0, 0.5)',
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        overflow: 'hidden',
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

            <h5 className="modal-title mb-0">
              Editar rol
            </h5>

            <button
              type="button"
              className="btn-close"
              onClick={onCancelar}
              disabled={guardando}
            />

          </div>


          {/* ================================================== */}
          {/* FORMULARIO                                         */}
          {/* ================================================== */}

          <form
            onSubmit={guardarCambios}
          >

            {/* ================================================= */}
            {/* CUERPO                                            */}
            {/* ================================================= */}

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

              {/* ERROR */}

              {error && (

                <div
                  className="
                    alert
                    alert-danger
                    py-2
                    mb-3
                  "
                >
                  ❌ {error}
                </div>

              )}


              {/* ================================================= */}
              {/* CÓDIGO                                            */}
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
                  onChange={(event) =>
                    cambiarCampo(
                      'code',
                      event.target.value
                    )
                  }
                  maxLength={50}
                  required
                  disabled={guardando}
                />

                <div className="form-text">
                  Identificador único del rol.
                </div>

              </div>


              {/* ================================================= */}
              {/* NOMBRE                                            */}
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
                  onChange={(event) =>
                    cambiarCampo(
                      'name',
                      event.target.value
                    )
                  }
                  maxLength={100}
                  required
                  disabled={guardando}
                />

              </div>


              {/* ================================================= */}
              {/* ESTADO                                             */}
              {/* ================================================= */}

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
                  onChange={(event) =>
                    cambiarCampo(
                      'status',
                      Number(
                        event.target.value
                      )
                    )
                  }
                  disabled={guardando}
                >

                  <option value={1}>
                    Activo
                  </option>

                  <option value={0}>
                    Inactivo
                  </option>

                </select>

              </div>


              {/* ================================================= */}
              {/* DESCRIPCIÓN                                       */}
              {/* ================================================= */}

              <div className="mb-0">

                <label
                  className="
                    form-label
                    fw-semibold
                    mb-1
                  "
                >
                  Descripción
                </label>

                <textarea
                  className="form-control"
                  rows="4"
                  value={
                    formulario.description
                  }
                  onChange={(event) =>
                    cambiarCampo(
                      'description',
                      event.target.value
                    )
                  }
                  maxLength={500}
                  disabled={guardando}
                />

              </div>

            </div>


            {/* ================================================= */}
            {/* BOTONES                                            */}
            {/* ================================================= */}

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
                onClick={onCancelar}
                disabled={guardando}
              >
                Cancelar
              </button>


              <button
                type="submit"
                className="
                  btn
                  btn-primary
                "
                disabled={guardando}
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

                    Guardando...

                  </>

                ) : (

                  'Guardar cambios'

                )}

              </button>

            </div>

          </form>

        </div>

      </div>

    </div>

  )

}


export default EditRoleForm