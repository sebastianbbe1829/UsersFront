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
} from '../services/api'

const TenantConfigContext = createContext(null)

const CONFIG_DEFAULT = {
  tenant_id: null,
  name: '',
  slug: '',
  app_title: 'Gestión de Usuarios',
  logo_url: null,
  primary_color: '#0D6EFD',
  secondary_color: '#6C757D',
  updated_at: null,
}

function aplicarConfiguracion(config) {
  const root = document.documentElement

  root.style.setProperty('--tenant-primary-color', config.primary_color)
  root.style.setProperty('--tenant-secondary-color', config.secondary_color)

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

export function TenantConfigProvider({ children }) {
  const [config, setConfig] = useState(CONFIG_DEFAULT)
  const [cargandoConfig, setCargandoConfig] = useState(true)
  const [errorConfig, setErrorConfig] = useState('')

  const cargarConfig = useCallback(async (token) => {
    if (!token) {
      setConfig(CONFIG_DEFAULT)
      setCargandoConfig(false)
      return
    }

    try {
      setCargandoConfig(true)
      setErrorConfig('')

      const resultado = await obtenerConfigTenant(token)
      const nuevaConfig = { ...CONFIG_DEFAULT, ...resultado }

      setConfig(nuevaConfig)
      aplicarConfiguracion(nuevaConfig)
    } catch (error) {
      console.error('No fue posible cargar la configuración visual del tenant:', error)
      setErrorConfig(error?.message || 'No fue posible cargar la configuración visual.')
      setConfig(CONFIG_DEFAULT)
      aplicarConfiguracion(CONFIG_DEFAULT)
    } finally {
      setCargandoConfig(false)
    }
  }, [])

  const guardarConfig = useCallback(async (datos, token) => {
    const resultado = await actualizarConfigTenant(datos, token)
    const nuevaConfig = { ...CONFIG_DEFAULT, ...resultado }

    setConfig(nuevaConfig)
    setErrorConfig('')
    aplicarConfiguracion(nuevaConfig)

    return nuevaConfig
  }, [])

  useEffect(() => {
    aplicarConfiguracion(config)
  }, [config])

  const value = {
    config,
    cargandoConfig,
    errorConfig,
    cargarConfig,
    guardarConfig,
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
