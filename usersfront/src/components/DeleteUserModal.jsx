import { useState } from 'react'
import { eliminarUsuario } from '../services/api'

function DeleteUserModal({
  usuario,
  token,
  onUsuarioEliminado,
  onCancelar,
}) {
  const [error, setError] =
    useState('')

  const [eliminando, setEliminando] =
    useState(false)


  // ==========================
  // CONFIRMAR ELIMINACION
  // ==========================

  const confirmarEliminacion = async () => {

    setError('')
    setEliminando(true)


    try {

      const resultado =
        await eliminarUsuario(
          usuario.dni,
          token
        )


      console.log(
        'Usuario eliminado:',
        resultado
      )


      onUsuarioEliminado(
        usuario.dni
      )

    } catch (error) {

      console.error(
        'Error eliminando usuario:',
        error
      )

      setError(
        error.message
      )

    } finally {

      setEliminando(false)

    }

  }


  return (

    <div
      className="modal d-block"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
        overflowY: 'auto',
      }}
    >

      <div className="modal-dialog modal-dialog-centered">

        <div className="modal-content">


          {/* CABECERA */}

          <div className="modal-header">

            <h5 className="modal-title">
              Eliminar usuario
            </h5>

            <button
              type="button"
              className="btn-close"
              onClick={onCancelar}
              disabled={eliminando}
            />

          </div>


          {/* CONTENIDO */}

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
              eliminar este usuario?

            </p>


            {/* INFORMACION */}

            <div className="card bg-light border-0">

              <div className="card-body">


                {/* DNI */}

                <div className="row">

                  <div className="col-4 fw-bold">
                    Número de identificación:
                  </div>

                  <div className="col-8">
                    {usuario.dni}
                  </div>

                </div>


                {/* NOMBRE */}

                <div className="row mt-2">

                  <div className="col-4 fw-bold">
                    Nombre:
                  </div>

                  <div className="col-8">
                    {usuario.name}
                  </div>

                </div>


                {/* EMAIL */}

                <div className="row mt-2">

                  <div className="col-4 fw-bold">
                    Email:
                  </div>

                  <div className="col-8 text-break">
                    {usuario.email}
                  </div>

                </div>

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

              esta acción no se puede deshacer.

            </div>

          </div>


          {/* BOTONES */}

          <div className="modal-footer">

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancelar}
              disabled={eliminando}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="btn btn-danger"
              onClick={confirmarEliminacion}
              disabled={eliminando}
            >

              {eliminando
                ? 'Eliminando...'
                : 'Sí, eliminar usuario'}

            </button>

          </div>

        </div>

      </div>

    </div>

  )
}

export default DeleteUserModal