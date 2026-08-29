import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import { obtenerConfigTenantPublica } from '../services/api'

import { useAuth } from './AuthContext'

const TenantConfigContext = createContext(null)

const CONFIG_DEFAULT = {
  tenant_id: null,
  name: null,
  slug: null,
  app_title: null,
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

export function TenantConfigProvider({ children }) {
  const { tenant } = useAuth()

  const [config, setConfig] = useState(null)
  const [cargandoConfig, setCargandoConfig] = useState(true)
  const [errorConfig, setErrorConfig] = useState('')

  const cargarConfig = useCallback(async (tenantSlug = tenant) => {
    if (!tenantSlug) {
      setConfig(CONFIG_DEFAULT)
      aplicarConfiguracion(CONFIG_DEFAULT)
      setErrorConfig('')
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
      console.warn(
        'No fue posible cargar la configuración pública del tenant.',
        error
      )

      setConfig(CONFIG_DEFAULT)
      setErrorConfig('No fue posible cargar la configuración del tenant.')
      aplicarConfiguracion(CONFIG_DEFAULT)
    } finally {
      setCargandoConfig(false)
    }
  }, [tenant])

  useEffect(() => {
    cargarConfig(tenant)
  }, [tenant, cargarConfig])

  const value = {
    config,
    cargandoConfig,
    errorConfig,
    cargarConfig,
  }

  if (cargandoConfig && !config) {
    return <PantallaCargaConfiguracion />
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
