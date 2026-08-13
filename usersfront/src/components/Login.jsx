import { useState } from 'react'
import { login } from '../services/api'

function Login({
  onLogin,
  mensajeSesion,
}) {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const iniciarSesion = async (event) => {
    event.preventDefault()

    setError('')

    try {
      const resultado = await login(usuario, password)

      localStorage.setItem('access_token', resultado.access_token)

      onLogin(resultado.access_token)

    } catch (error) {
      console.error(error)
      setError(error.message)
    }
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: 'linear-gradient(135deg, #0d6efd 0%, #6f42c1 100%)',
      }}
    >
      <div className="card shadow-lg border-0" style={{ width: '400px' }}>
        <div className="card-body p-5">

          <div className="text-center mb-4">

            <div
              className="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center mb-3"
              style={{
                width: '70px',
                height: '70px',
              }}
            >
              <span style={{ fontSize: '32px' }}>
                👥
              </span>
            </div>

            <h2 className="fw-bold">
              Usuarios API
            </h2>

            <p className="text-muted mb-0">
              Inicia sesión para continuar
            </p>

          </div>

          <form onSubmit={iniciarSesion}>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                Usuario
              </label>

              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Ingresa tu usuario"
                value={usuario}
                onChange={(event) => setUsuario(event.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">
                Contraseña
              </label>

              <input
                type="password"
                className="form-control form-control-lg"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {mensajeSesion && (
              <div className="alert alert-warning">
                ⏰ {mensajeSesion}
              </div>
            )}

            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg w-100"
            >
              Ingresar
            </button>

          </form>

        </div>
      </div>
    </div>
  )
}

export default Login