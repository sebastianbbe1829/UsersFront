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

import { useAuth } from './AuthContext'

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

  // Bootstrap 5 consume estas variables para sus componentes principales.
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

export function TenantConfigProvider({ children }) {
  const { token, logueado } = useAuth()

  const [config, setConfig] = useState(CONFIG_DEFAULT)
  const [cargandoConfig, setCargandoConfig] = useState(true)
  const [errorConfig, setErrorConfig] = useState('')

  const cargarConfig = useCallback(async (tokenActual) => {
    if (!tokenActual) {
      setConfig(CONFIG_DEFAULT)
      aplicarConfiguracion(CONFIG_DEFAULT)
      setCargandoConfig(false)
      return
    }

    try {
      setCargandoConfig(true)
      setErrorConfig('')

      const resultado = await obtenerConfigTenant(tokenActual)
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

  const guardarConfig = useCallback(async (datos, tokenActual = token) => {
    const resultado = await actualizarConfigTenant(datos, tokenActual)
    const nuevaConfig = { ...CONFIG_DEFAULT, ...resultado }

    setConfig(nuevaConfig)
    setErrorConfig('')
    aplicarConfiguracion(nuevaConfig)

    return nuevaConfig
  }, [token])

  useEffect(() => {
    if (!logueado || !token) {
      setConfig(CONFIG_DEFAULT)
      aplicarConfiguracion(CONFIG_DEFAULT)
      setCargandoConfig(false)
      return
    }

    cargarConfig(token)
  }, [logueado, token, cargarConfig])

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
