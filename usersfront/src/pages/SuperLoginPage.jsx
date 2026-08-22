import { useState } from 'react'
import { loginSuper } from '../services/superAuth'

function SuperLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [mensaje, setMensaje] = useState('')

  const ingresar = async (event) => {
    event.preventDefault()

    try {
      const resultado = await loginSuper(email, password, otp)

      localStorage.setItem(
        'super_access_token',
        resultado.access_token,
      )

      setMensaje('Login SUPER exitoso')
    } catch (error) {
      setMensaje(error.message)
    }
  }

  return (
    <div className="container mt-5">
      <div className="card p-4 mx-auto" style={{ maxWidth: 450 }}>
        <h3 className="mb-3">Acceso SUPER</h3>

        <form onSubmit={ingresar}>
          <input
            className="form-control mb-3"
            placeholder="Correo SUPER"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="form-control mb-3"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            className="form-control mb-3"
            placeholder="Código MFA"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          <button className="btn btn-primary w-100">
            Ingresar
          </button>
        </form>

        {mensaje && (
          <div className="alert alert-info mt-3">
            {mensaje}
          </div>
        )}
      </div>
    </div>
  )
}

export default SuperLoginPage
