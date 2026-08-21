import {
  useState,
} from 'react'

import {
  eliminarRol,
} from '../services/api'


function DeleteRoleModal({
  rol,
  token,
  onRolEliminado,
  onCancelar,
}) {

  // ============================================================
  // ESTADOS
  // ============================================================

  const [
    error,
    setError,
  ] = useState('')


  const [
    eliminando,
    setEliminando,
  ] = useState(false)


  // ============================================================
  // CONFIRMAR ELIMINACIÓN
  // ============================================================

  const confirmarEliminacion = async () => {

    setError('')
    setEliminando(true)


    try {

      const resultado =
        await eliminarRol(
          rol.id,
          token
        )


      console.log(
        'Rol eliminado:',
        resultado
      )


      onRolEliminado(
        rol.id
      )

    } catch (error) {

      console.error(
        'Error eliminando rol:',
        error
      )

      setError(
        error.message ||
        'No fue posible eliminar el rol.'
      )

    } finally {

      setEliminando(false)

    }

  }


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div
      className="modal d-block"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
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
      >

        <div className="modal-content">


          {/* ================================================== */}
          {/* CABECERA                                           */}
          {/* ================================================== */}

          <div className="modal-header">

            <h5 className="modal-title">
              Eliminar rol
            </h5>

            <button
              type="button"
              className="btn-close"
              onClick={onCancelar}
              disabled={eliminando}
            />

          </div>


          {/* ================================================== */}
          {/* CONTENIDO                                          */}
          {/* ================================================== */}

          <div className="modal-body">


            {/* ERROR */}

            {error && (

              <div className="alert alert-danger">
                {error}
              </div>

            )}


            {/* ICONO */}

            <div className="text-center mb-3">

              <div
                style={{
                  fontSize: '3.5rem',
                }}
              >
                ⚠️
              </div>

            </div>


            {/* MENSAJE */}

            <p className="text-center">

              ¿Estás seguro de que deseas
              eliminar este rol?

            </p>


            {/* INFORMACIÓN */}

            <div
              className="
                card
                bg-light
                border-0
              "
            >

              <div className="card-body">


                {/* CÓDIGO */}

                <div className="row">

                  <div className="col-4 fw-bold">
                    Código:
                  </div>

                  <div className="col-8">
                    {rol.code}
                  </div>

                </div>


                {/* NOMBRE */}

                <div className="row mt-2">

                  <div className="col-4 fw-bold">
                    Nombre:
                  </div>

                  <div className="col-8">
                    {rol.name}
                  </div>

                </div>


                {/* DESCRIPCIÓN */}

                {rol.description && (

                  <div className="row mt-2">

                    <div className="col-4 fw-bold">
                      Descripción:
                    </div>

                    <div className="col-8 text-break">
                      {rol.description}
                    </div>

                  </div>

                )}

              </div>

            </div>


            {/* ADVERTENCIA */}

            <div
              className="
                alert
                alert-warning
                mt-3
                mb-0
              "
            >

              <strong>
                Importante:
              </strong>{' '}

              el rol será marcado como eliminado
              y dejará de aparecer en el listado.

            </div>

          </div>


          {/* ================================================== */}
          {/* BOTONES                                            */}
          {/* ================================================== */}

          <div className="modal-footer">

            <button
              type="button"
              className="
                btn
                btn-secondary
              "
              onClick={onCancelar}
              disabled={eliminando}
            >
              Cancelar
            </button>


            <button
              type="button"
              className="
                btn
                btn-danger
              "
              onClick={
                confirmarEliminacion
              }
              disabled={eliminando}
            >

              {eliminando
                ? 'Eliminando...'
                : 'Sí, eliminar rol'}

            </button>

          </div>

        </div>

      </div>

    </div>

  )

}


export default DeleteRoleModal