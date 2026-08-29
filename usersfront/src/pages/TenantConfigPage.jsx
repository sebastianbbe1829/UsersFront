import { useEffect, useState } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { obtenerPayloadToken } from '../services/api'
import {
  actualizarConfigTenantComoSuper,
  obtenerConfigTenantComoSuper,
} from '../services/tenantConfigAdminApi'
import SuperMfaModal from '../components/SuperMfaModal'

function TenantConfigPage() {
  const { token } = useAuth()

  const [config, setConfig] = useState(null)
  const [cargandoConfig, setCargandoConfig] = useState(true)
  const [formulario, setFormulario] = useState({
    app_title: '',
    logo_url: '',
    primary_color: '#0D6EFD',
    secondary_color: '#6C757D',
  })
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [mostrarOtp, setMostrarOtp] = useState(false)
  const [datosPendientes, setDatosPendientes] = useState(null)

  const payload = obtenerPayloadToken(token)
  const esSuper = payload?.user_type === 'SUPER'
  const tenantId = Number(payload?.tenant_id)

  const cargarConfig = async () => {
    if (!esSuper || !token || !tenantId) {
      setCargandoConfig(false)
      return
    }

    try {
      setCargandoConfig(true)
      setError('')

      const resultado = await obtenerConfigTenantComoSuper(
        tenantId,
        token,
      )

      setConfig(resultado)
      setFormulario({
        app_title: resultado.app_title || '',
        logo_url: resultado.logo_url || '',
        primary_color: resultado.primary_color || '#0D6EFD',
        secondary_color: resultado.secondary_color || '#6C757D',
      })
    } catch (err) {
      setError(err.message || 'No fue posible cargar la configuración.')
    } finally {
      setCargandoConfig(false)
    }
  }

  useEffect(() => {
    cargarConfig()
  }, [esSuper, token, tenantId])

  const cambiarCampo = (event) => {
    const { name, value } = event.target
    setFormulario((actual) => ({ ...actual, [name]: value }))
    setMensaje('')
    setError('')
  }

  const prepararGuardado = (event) => {
    event.preventDefault()

    setDatosPendientes({
      app_title: formulario.app_title.trim(),
      logo_url: formulario.logo_url.trim() || null,
      primary_color: formulario.primary_color,
      secondary_color: formulario.secondary_color,
    })
    setMensaje('')
    setError('')
    setMostrarOtp(true)
  }

  const confirmarOtp = async (otp) => {
    if (!datosPendientes) return

    try {
      setGuardando(true)
      setError('')

      const resultado = await actualizarConfigTenantComoSuper(
        tenantId,
        datosPendientes,
        otp,
        token,
      )

      setConfig(resultado)
      setFormulario({
        app_title: resultado.app_title || '',
        logo_url: resultado.logo_url || '',
        primary_color: resultado.primary_color || '#0D6EFD',
        secondary_color: resultado.secondary_color || '#6C757D',
      })
      setMensaje('Configuración visual actualizada correctamente.')
      setDatosPendientes(null)
      setMostrarOtp(false)
    } catch (err) {
      throw err
    } finally {
      setGuardando(false)
    }
  }

  if (!esSuper) {
    return (
      <div className="alert alert-danger">
        No tienes permisos para administrar la configuración de la interfaz.
      </div>
    )
  }

  if (cargandoConfig) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status" />
        <div className="mt-3 text-muted">Cargando configuración...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Configuración de la interfaz</h3>
        <p className="text-muted mb-0">
          Personaliza la identidad visual del tenant. Esta administración está disponible únicamente para SUPER.
        </p>
      </div>

      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {config && (
        <div className="alert alert-info">
          <strong>Tenant:</strong> {config.name} ({config.slug})
        </div>
      )}

      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <form onSubmit={prepararGuardado}>
            <div className="row g-4">
              <div className="col-12">
                <label className="form-label fw-semibold">Título de la aplicación</label>
                <input
                  type="text"
                  name="app_title"
                  className="form-control"
                  value={formulario.app_title}
                  onChange={cambiarCampo}
                  minLength="2"
                  maxLength="150"
                  required
                  disabled={guardando}
                />
                <div className="form-text">Se mostrará en la pestaña del navegador.</div>
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">URL del logo</label>
                <input
                  type="url"
                  name="logo_url"
                  className="form-control"
                  value={formulario.logo_url}
                  onChange={cambiarCampo}
                  maxLength="500"
                  placeholder="https://..."
                  disabled={guardando}
                />
                <div className="form-text">Opcional. Se utilizará también como favicon.</div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Color principal</label>
                <div className="input-group">
                  <input
                    type="color"
                    className="form-control form-control-color"
                    value={formulario.primary_color}
                    onChange={cambiarCampo}
                    name="primary_color"
                    title="Seleccionar color principal"
                    disabled={guardando}
                  />
                  <input
                    type="text"
                    className="form-control text-uppercase"
                    value={formulario.primary_color}
                    onChange={cambiarCampo}
                    name="primary_color"
                    maxLength="7"
                    pattern="#[0-9A-Fa-f]{6}"
                    required
                    disabled={guardando}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Color secundario</label>
                <div className="input-group">
                  <input
                    type="color"
                    className="form-control form-control-color"
                    value={formulario.secondary_color}
                    onChange={cambiarCampo}
                    name="secondary_color"
                    title="Seleccionar color secundario"
                    disabled={guardando}
                  />
                  <input
                    type="text"
                    className="form-control text-uppercase"
                    value={formulario.secondary_color}
                    onChange={cambiarCampo}
                    name="secondary_color"
                    maxLength="7"
                    pattern="#[0-9A-Fa-f]{6}"
                    required
                    disabled={guardando}
                  />
                </div>
              </div>

              <div className="col-12">
                <div
                  className="p-4 rounded border"
                  style={{ borderLeft: `6px solid ${formulario.primary_color}` }}
                >
                  <div className="fw-bold mb-2">Vista previa</div>
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    <button type="button" className="btn text-white" style={{ backgroundColor: formulario.primary_color }}>
                      Acción principal
                    </button>
                    <button type="button" className="btn text-white" style={{ backgroundColor: formulario.secondary_color }}>
                      Acción secundaria
                    </button>
                    {formulario.logo_url && (
                      <img
                        src={formulario.logo_url}
                        alt="Logo del tenant"
                        style={{ maxHeight: '45px', maxWidth: '180px', objectFit: 'contain' }}
                        onError={(event) => { event.currentTarget.style.display = 'none' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end mt-4">
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                Guardar configuración
              </button>
            </div>
          </form>
        </div>
      </div>

      {mostrarOtp && (
        <SuperMfaModal
          onConfirmar={confirmarOtp}
          onCancelar={() => {
            if (guardando) return
            setMostrarOtp(false)
            setDatosPendientes(null)
          }}
          guardando={guardando}
        />
      )}
    </div>
  )
}

export default TenantConfigPage
