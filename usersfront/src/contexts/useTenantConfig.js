import { useContext } from 'react'

import { TenantConfigContext } from './TenantConfigContextValue'

export function useTenantConfig() {
  const context = useContext(TenantConfigContext)

  if (!context) {
    throw new Error('useTenantConfig debe utilizarse dentro de TenantConfigProvider')
  }

  return context
}
