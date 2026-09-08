import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Can from '../components/Can'
import SessionManager from '../components/SessionManager'
import { crearMovimientoInventario, devolverMovimientoInventario, exportarKardexExcel, obtenerMovimientosInventario, obtenerProductosInventario } from '../services/inventoryApi'
import { emptyMovement, number, PAGE_SIZE, money } from './InventoryUtils'
import { EmptyState, MovementBadge, MovementModal, Pagination, ReversalModal } from './InventoryShared'

const ORIGIN_LABELS = { PURCHASE: 'Compra', SALE: 'Venta', MANUAL_ADJUSTMENT: 'Ajuste de inventario', SALES_RETURN: 'Devolución de venta', PURCHASE_RETURN: 'Devolución de compra', REVERSAL: 'Reversión' }
const OPERATION_MOVEMENT_TYPES = { PURCHASE: 'ENTRY', SALE: 'EXIT', SALES_RETURN: 'ENTRY', PURCHASE_RETURN: 'EXIT' }
const formatFechaColombia = (value) => { if (!value) return '-'; const normalized = typeof value === 'string' && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? `${value}Z` : value; return new Date(normalized).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) }
function descargarArchivo(blob, filename) { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url) }

function InventoryMovementsPage() {
  const { token, manejarSesionExpirada } = useAuth()