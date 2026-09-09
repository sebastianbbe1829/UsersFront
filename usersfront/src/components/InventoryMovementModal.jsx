import { useEffect, useMemo, useState } from 'react'
import Can from './Can'
import { obtenerMovimientosInventario } from '../services/inventoryApi'

const formatFecha = (value) => {
  if (!value) return '-'
  const normalized = typeof value === 'string' && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? `${value}Z` : value
  return new Date(normalized).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
}

const formatMoney = (value) => {
  if (value == null || value === '') return '-'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 }).format(Number(value))
}

const formatProfit = (value) => {
  if (value == null || value === '') return '-'
  return `${Number(value) * 100}%`
}

export function InventoryMovementModal({ form, setForm, productos, guardando, onClose, onSubmit, onOriginChange }) {
  const requiresPurchasePrice = form.origin_type === 'PURCHASE'
  const isManualAdjustment = form.origin_type === 'MANUAL_ADJUSTMENT'
  const activos = useMemo(() => productos.filter((item) => item.active), [productos])
  const selectedProduct = useMemo(() => activos.find((item) => String(item.id) === String(form.product_id)), [activos, form.product_id])
  const { token } = useAuth()
  const [productSearch, setProductSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [lastPurchase, setLastPurchase] = useState(null)
  const [loadingLastPurchase, setLoadingLastPurchase] = useState(false)
  const [lastPurchaseError, setLastPurchaseError] = useState('')

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    if (!query) return activos.slice(0, 10)
    return activos.filter((item) => `${item.code || ''} ${item.name || ''}`.toLowerCase().includes(query)).slice(0, 10)
  }, [activos, productSearch])

  useEffect(() => {
    let cancelled = false
    const cargarUltimaCompra = async () => {
      if (!form.product_id || !token) {
        setLastPurchase(null)
        setLastPurchaseError('')
        setLoadingLastPurchase(false)
        return
      }
      setLoadingLastPurchase(true)
      setLastPurchaseError('')
      try {
        const result = await obtenerMovimientosInventario(form.product_id, token, { limit: 100, offset: 0 })
        const rows = Array.isArray(result) ? result : []
        const purchases = rows.filter((item) => item.origin_type === 'PURCHASE' && item.movement_type === 'ENTRY' && item.unit_purchase_price != null)
        purchases.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        if (!cancelled) setLastPurchase(purchases[0] || null)
      } catch (error) {
        if (!cancelled) {
          setLastPurchase(null)
          setLastPurchaseError(error.message || 'No fue posible consultar la última compra.')
        }
      } finally {
        if (!cancelled) setLoadingLastPurchase(false)
      }
    }
    void cargarUltimaCompra()
    return () => { cancelled = true }
  }, [form.product_id, token])

  const selectProduct = (product) => {
    setForm({ ...form, product_id: String(product.id) })
    setProductSearch(`${product.code} — ${product.name}`)
    setSearchFocused(false)
  }

  const clearProduct = () => {
    setForm({ ...form, product_id: '' })
    setProductSearch('')
    setSearchFocused(true)
  }

  return <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true">
    <div className="modal-backdrop show" style={{ zIndex: 1040 }} onClick={onClose} />
    <div className="modal-dialog modal-dialog-centered modal-lg" style={{ zIndex: 1050 }}>
      <div className="modal-content shadow-lg">
        <div className="modal-header">
          <h5 className="modal-title fw-bold">Registrar movimiento de inventario</h5>
          <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} />
        </div>
        <div className="modal-body">
          <Can permission="INVENTORY_MOVEMENT_CREATE">
            <form onSubmit={onSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">Producto</label>
                  <div className="position-relative">
                    <div className="input-group">
                      <span className="input-group-text">🔎</span>
                      <input className="form-control" type="search" required={!form.product_id} value={productSearch || (selectedProduct ? `${selectedProduct.code} — ${selectedProduct.name}` : '')} onChange={(e) => { setProductSearch(e.target.value); setForm({ ...form, product_id: '' }); setSearchFocused(true) }} onFocus={() => setSearchFocused(true)} placeholder="Buscar por código o nombre..." autoComplete="off" aria-label="Buscar producto" />
                      {form.product_id && <button type="button" className="btn btn-outline-secondary" onClick={clearProduct} aria-label="Cambiar producto">Cambiar</button>}
                    </div>
                    {searchFocused && !form.product_id && <div className="position-absolute bg-body border rounded shadow-sm w-100 mt-1" style={{ zIndex: 1060, maxHeight: 280, overflowY: 'auto' }} role="listbox">
                      {filteredProducts.length === 0 ? <div className="p-3 text-muted small">No encontramos productos con esa búsqueda.</div> : filteredProducts.map((item) => <button type="button" key={item.id} className="btn btn-link text-start text-decoration-none w-100 px-3 py-2 border-0 rounded-0" onMouseDown={(e) => e.preventDefault()} onClick={() => selectProduct(item)} role="option"><strong className="d-block">{item.code}</strong><span className="d-block text-body">{item.name}</span></button>)}
                    </div>}
                  </div>
                  {selectedProduct && form.product_id && <div className="small text-success mt-1">✓ {selectedProduct.code} — {selectedProduct.name}</div>}
                </div>

                {form.product_id && <div className="col-12">
                  {loadingLastPurchase && <div className="alert alert-info py-2 mb-0 small">⏳ Consultando última compra del producto...</div>}
                  {!loadingLastPurchase && lastPurchaseError && <div className="alert alert-warning py-2 mb-0 small">{lastPurchaseError}</div>}
                  {!loadingLastPurchase && !lastPurchaseError && lastPurchase && <div className="alert alert-light border py-2 mb-0">
                    <div className="small fw-semibold mb-1">Última compra registrada</div>
                    <div className="row g-2 small">
                      <div className="col-12 col-sm-4"><span className="text-muted">Valor de compra:</span> <strong>{formatMoney(lastPurchase.unit_purchase_price)}</strong></div>
                      <div className="col-12 col-sm-4"><span className="text-muted">Fecha:</span> <strong>{formatFecha(lastPurchase.created_at)}</strong></div>
                      <div className="col-12 col-sm-4"><span className="text-muted">Ganancia:</span> <strong>{formatProfit(lastPurchase.profit_percentage)}</strong></div>
                    </div>
                  </div>}
                  {!loadingLastPurchase && !lastPurchaseError && !lastPurchase && <div className="alert alert-secondary py-2 mb-0 small">No hay compras registradas para este producto.</div>}
                </div>}

                <div className="col-12 col-md-6">
                  <label className="form-label">Operación</label>
                  <select className="form-select" value={form.origin_type} onChange={(e) => onOriginChange(e.target.value)}>
                    <option value="PURCHASE">Compra</option><option value="SALE">Venta</option><option value="MANUAL_ADJUSTMENT">Ajuste de inventario</option><option value="SALES_RETURN">Devolución de venta</option><option value="PURCHASE_RETURN">Devolución de compra</option>
                  </select>
                </div>
                {isManualAdjustment && <div className="col-12 col-md-4"><label className="form-label">Tipo de ajuste</label><select className="form-select" value={form.movement_type} onChange={(e) => setForm({ ...form, movement_type: e.target.value })}><option value="ENTRY">Entrada</option><option value="EXIT">Salida</option></select></div>}
                <div className={`col-12 col-md-${isManualAdjustment ? '4' : '6'}`}><label className="form-label">Cantidad</label><input className="form-control" type="number" min="0.001" step="0.001" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                <div className={`col-12 col-md-${isManualAdjustment ? '4' : '6'}`}><label className="form-label">Precio compra unitario</label><input className="form-control" type="number" min="0" step="0.01" required={requiresPurchasePrice} value={form.unit_purchase_price} onChange={(e) => setForm({ ...form, unit_purchase_price: e.target.value })} /></div>
                <div className="col-12 col-md-6"><label className="form-label">Ganancia</label><input className="form-control" type="number" min="0" step="0.0001" placeholder="0.50 = 50%" value={form.profit_percentage} onChange={(e) => setForm({ ...form, profit_percentage: e.target.value })} /></div>
                <div className="col-12"><label className="form-label">Notas</label><textarea className="form-control" rows="3" maxLength="500" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <div className="alert alert-warning small mt-3 mb-0">La existencia no se modifica directamente. Cada cambio queda registrado en el kardex.</div>
              <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 mt-4"><button type="button" className="btn btn-outline-secondary order-2 order-sm-1" onClick={onClose} disabled={guardando}>Cancelar</button><button type="submit" className="btn btn-primary order-1 order-sm-2" disabled={guardando || !form.product_id}>{guardando ? 'Guardando...' : 'Registrar movimiento'}</button></div>
            </form>
          </Can>
        </div>
      </div>
    </div>
  </div>
}
