export const PAGE_SIZE = 10
export const emptyType = { code: '', name: '', active: true }
export const emptyProduct = { name: '', inventory_type_id: '', brand: '', presentation: '', active: true, image_url: '', image_source: '', image_source_url: '', image_credit: '' }
export const emptyMovement = { product_id: '', movement_type: 'ENTRY', origin_type: 'PURCHASE', quantity: '', unit_purchase_price: '', profit_percentage: '', notes: '' }

export const money = (value) => value == null ? '-' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 }).format(Number(value))
export const number = (value) => Number(value || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 3 })

export const originLabel = (value) => ({
  PURCHASE: 'Compra',
  SALE: 'Venta',
  MANUAL_ADJUSTMENT: 'Ajuste manual',
  SALES_RETURN: 'Devolución de venta',
  PURCHASE_RETURN: 'Devolución de compra',
  REVERSAL: 'Reversión',
}[value] || value || '-')

export const formatColombiaDateTime = (value) => {
  if (!value) return '-'
  const raw = String(value)
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)
  const date = new Date(hasTimezone ? raw : `${raw}Z`)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('es-CO', { timeZone: 'America/Bogota' })
}
