import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import {
  actualizarConfigTenant,
  obtenerConfigTenant,
  obtenerConfigTenantPublica,
} from '../services/api'

import { useAuth } from './AuthContext'

const TenantConfigContext = createContext(null)

const CONFIG_DEFAULT = {
  tenant_id: null,
  name: '',
  slug: '',
  app_title: 'Fénix SaS',
  logo_url: null,
  primary_color: '#0D6EFD',
  secondary_color: '#6C757D',
  updated_at: null,
}

function aplicarConfiguracion(config) {
  const root = document.documentElement

  root.style.setProperty('--tenant-primary-color', config.primary_color)
  root.style.setProperty('--tenant-secondary-color', config.secondary_color)

  root.style.setProperty('--bs-primary', config.primary_color)
  root.style.setProperty('--bs-secondary', config.secondary_color)
  root.style.setProperty('--bs-link-color', config.primary_color)

  if (config.app_title) {
    document.title = config.app_title
  }

  if (config.logo_url) {
    let favicon = document.querySelector('link[data-tenant-favicon]')

    if (!favicon) {
      favicon = document.createElement('link')
      favicon.rel = 'icon'
      favicon.dataset.tenantFavicon = 'true'
      document.head.appendChild(favicon)
    }

    favicon.href = config.logo_url
  }
}

function PantallaCargaConfiguracion() {
  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="text-center">
        <div className="spinner-border" role="status" aria-hidden="true" />
        <div className="mt-3">Cargando configuración...</div>
      </div>
    </div>
  )
}

function PantallaErrorConfiguracion({ mensaje }) {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 p-4">
      <div className="alert alert-danger mb-0" role="alert">
        {mensaje || 'No fue posible cargar la configuración de la empresa.'}
      </div>
    </div>
  )
}

export function TenantConfigProvider({ children }) {
  const { token, logueado, tenant } = useAuth()

  const [config, setConfig] = useState(null)
  const [cargandoConfig, setCargandoConfig] = useState(true)
  const [errorConfig, setErrorConfig] = useState('')

  const cargarConfigPublica = useCallback(async (tenantSlug) => {
    if (!tenantSlug) {
      setConfig(null)
      setErrorConfig('No se pudo determinar la empresa desde la URL.')
      setCargandoConfig(false)
      return
    }

    try {
      setCargandoConfig(true)
      setErrorConfig('')

      const resultado = await obtenerConfigTenantPublica(tenantSlug)
      const nuevaConfig = { ...CONFIG_DEFAULT, ...resultado }

      setConfig(nuevaConfig)
      aplicarConfiguracion(nuevaConfig)
    } catch (error) {
      console.error(
        'No fue posible cargar la configuración pública del tenant:',
        error
      )
      setConfig(null)
      setErrorConfig(
        error?.message ||
        'No fue posible cargar la configuración de la empresa.'
      )
    } finally {
      setCargandoConfig(false)
    }
  }, [])

  const cargarConfigAutenticada = useCallback(async (tokenActual) => {
    if (!tokenActual) return

    try {
      const resultado = await obtenerConfigTenant(tokenActual)
      const nuevaConfig = { ...CONFIG_DEFAULT, ...resultado }

      setConfig(nuevaConfig)
      setErrorConfig('')
      aplicarConfiguracion(nuevaConfig)
    } catch (error) {
      console.error(
        'No fue posible actualizar la configuración visual autenticada del tenant:',
        error
      )
    }
  }, [])

  const cargarConfig = useCallback(async (tokenActual = token) => {
    if (tokenActual) {
      await cargarConfigAutenticada(tokenActual)
      return
    }

    await cargarConfigPublica(tenant)
  }, [token, tenant, cargarConfigAutenticada, cargarConfigPublica])

  const guardarConfig = useCallback(async (datos, tokenActual = token) => {
    const resultado = await actualizarConfigTenant(datos, tokenActual)
    const nuevaConfig = { ...CONFIG_DEFAULT, ...resultado }

    setConfig(nuevaConfig)
    setErrorConfig('')
    aplicarConfiguracion(nuevaConfig)

    return nuevaConfig
  }, [token])

  useEffect(() => {
    cargarConfigPublica(tenant)
  }, [tenant, cargarConfigPublica])

  useEffect(() => {
    if (!logueado || !token) return

    cargarConfigAutenticada(token)
  }, [logueado, token, cargarConfigAutenticada])

  const value = {
    config,
    cargandoConfig,
    errorConfig,
    cargarConfig,
    guardarConfig,
  }

  if (cargandoConfig && !config) {
    return <PantallaCargaConfiguracion />
  }

  if (errorConfig && !config) {
    return <PantallaErrorConfiguracion mensaje={errorConfig} />
  }

  return (
    <TenantConfigContext.Provider value={value}>
      {children}
    </TenantConfigContext.Provider>
  )
}

export function useTenantConfig() {
  const context = useContext(TenantConfigContext)

  if (!context) {
    throw new Error('useTenantConfig debe utilizarse dentro de TenantConfigProvider')
  }

  return context
}
