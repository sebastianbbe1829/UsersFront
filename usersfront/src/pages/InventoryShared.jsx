import Can from '../components/Can'
import { emptyMovement, emptyProduct, emptyType, formatColombiaDateTime, money, number, originLabel, PAGE_SIZE } from './InventoryUtils'

export function Pagination({ total, page, onPageChange, hasNext = false }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  if (pages === 1 && !hasNext) return null
  return <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
    <small className="text-muted">Página {page}{pages > 1 ? ` de ${pages}` : ''}</small>
    <div className="btn-group" role="group" aria-label="Paginación">
      <button type="button" className="btn btn-outline-secondary btn-sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Anterior</button>
      <button type="button" className="btn btn-outline-secondary btn-sm" disabled={!hasNext && page >= pages} onClick={() => onPageChange(page + 1)}>Siguiente</button>
    </div>
  </div>
}

export function SearchBar({ value, onChange, placeholder = 'Buscar por código o nombre...' }) {
  return <div className="input-group" style={{ maxWidth: 420 }}>
    <span className="input-group-text">🔎</span>
    <input type="search" className="form-control" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label="Buscar" />
  </div>
}

export function EmptyState({ text }) { return <div className="alert alert-info mb-0">{text}</div> }
export function StatusBadge({ active }) { return <span className={`badge ${active ? 'text-bg-success' : 'text-bg-secondary'}`}>{active ? 'Activo' : 'Inactivo'}</span> }
export function MovementBadge({ type }) { return <span className={`badge ${type === 'ENTRY' ? 'text-bg-success' : 'text-bg-danger'}`}>{type === 'ENTRY' ? 'Entrada' : 'Salida'}</span> }

export function TableTypes({ rows, onEdit }) {
  return <div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Código</th><th>Nombre</th><th>Estado</th><th className="text-end">Acciones</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td className="fw-semibold">{item.code}</td><td>{item.name}</td><td><StatusBadge active={item.active} /></td><td className="text-end"><Can permission="INVENTORY_UPDATE"><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onEdit(item)}>Editar</button></Can></td></tr>)}</tbody></table></div>
}

export function TableProducts({ rows, tipoPorId, onEdit }) {
  return <div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Código</th><th>Producto</th><th>Tipo</th><th>Estado</th><th className="text-end">Acciones</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td className="fw-semibold">{item.code}</td><td>{item.name}</td><td>{tipoPorId.get(item.inventory_type_id)?.name || `#${item.inventory_type_id}`}</td><td><StatusBadge active={item.active} /></td><td className="text-end"><Can permission="INVENTORY_UPDATE"><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onEdit(item)}>Editar</button></Can></td></tr>)}</tbody></table></div>
}

export function TableStock({ rows, productoPorId, tipoPorId }) {
  return <div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Producto</th><th>Tipo</th><th className="text-end">Existencia</th><th className="text-end">Precio compra</th><th className="text-end">Ganancia</th><th className="text-end">Precio venta</th><th className="text-end">Total inventario</th></tr></thead><tbody>{rows.map((item) => { const producto = productoPorId.get(item.product_id); const tipo = producto ? tipoPorId.get(producto.inventory_type_id) : null; return <tr key={item.id}><td><strong>{producto?.code || `#${item.product_id}`}</strong><br /><small>{producto?.name || 'Producto no disponible'}</small></td><td>{tipo?.name || '-'}</td><td className="text-end fw-semibold">{number(item.quantity)}</td><td className="text-end">{money(item.purchase_price)}</td><td className="text-end">{number(Number(item.profit_percentage) * 100)}%</td><td className="text-end">{money(item.sale_price)}</td><td className="text-end fw-semibold">{money(item.total_inventory)}</td></tr> })}</tbody></table></div>
}

export function Modal({ title, onClose, children, size = '' }) {
  return <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true"><div className="modal-backdrop show" style={{ zIndex: 1040 }} onClick={onClose} /><div className={`modal-dialog modal-dialog-centered ${size}`} style={{ zIndex: 1050 }}><div className="modal-content shadow-lg"><div className="modal-header"><h5 className="modal-title fw-bold">{title}</h5><button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} /></div><div className="modal-body">{children}</div></div></div></div>
}

export function ModalActions({ editing = false, submitLabel, onCancel, disabled }) {
  return <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 mt-4"><button type="button" className="btn btn-outline-secondary order-2 order-sm-1" onClick={onCancel} disabled={disabled}>Cancelar</button><button type="submit" className="btn btn-primary order-1 order-sm-2" disabled={disabled}>{disabled ? 'Guardando...' : submitLabel || (editing ? 'Guardar cambios' : 'Crear')}</button></div>
}

export function Check({ label, value, onChange }) {
  return <div className="form-check mb-3"><input id={`inventory-check-${label}`} className="form-check-input" type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /><label className="form-check-label" htmlFor={`inventory-check-${label}`}>{label}</label></div>
}

export function TypeModal({ editando, form, setForm, guardando, onClose, onSubmit }) {
  return <Modal title={editando ? 'Editar tipo de inventario' : 'Nuevo tipo de inventario'} onClose={onClose}><Can permission={editando ? 'INVENTORY_UPDATE' : 'INVENTORY_CREATE'}><form onSubmit={onSubmit}><input className="form-control mb-3" placeholder="Código" maxLength="30" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /><input className="form-control mb-3" placeholder="Nombre" maxLength="100" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Check label="Activo" value={form.active} onChange={(value) => setForm({ ...form, active: value })} /><ModalActions editing={editando} disabled={guardando} onCancel={onClose} /></form></Can></Modal>
}

export function ProductModal({ editando, form, setForm, tipos, guardando, onClose, onSubmit }) {
  return <Modal title={editando ? 'Editar producto' : 'Nuevo producto'} onClose={onClose}><Can permission={editando ? 'INVENTORY_UPDATE' : 'INVENTORY_CREATE'}><form onSubmit={onSubmit}><input className="form-control mb-3" placeholder="Nombre" maxLength="150" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><select className="form-select mb-3" required value={form.inventory_type_id} onChange={(e) => setForm({ ...form, inventory_type_id: e.target.value })}><option value="">Seleccione tipo...</option>{tipos.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select><Check label="Activo" value={form.active} onChange={(value) => setForm({ ...form, active: value })} /><ModalActions editing={editando} disabled={guardando} onCancel={onClose} /></form></Can></Modal>
}

export function MovementModal({ form, setForm, productos, guardando, onClose, onSubmit, onOriginChange }) {
  const requiresPurchasePrice = form.origin_type === 'PURCHASE'
  const isManualAdjustment = form.origin_type === 'MANUAL_ADJUSTMENT'
  return <Modal title="Registrar movimiento de inventario" onClose={onClose} size="modal-lg"><Can permission="INVENTORY_MOVEMENT_CREATE"><form onSubmit={onSubmit}><div className="row g-3"><div className="col-12 col-md-6"><label className="form-label">Producto</label><select className="form-select" required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}><option value="">Seleccione producto...</option>{productos.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></div><div className="col-12 col-md-6"><label className="form-label">Operación</label><select className="form-select" value={form.origin_type} onChange={(e) => onOriginChange(e.target.value)}><option value="PURCHASE">Compra</option><option value="SALE">Venta</option><option value="MANUAL_ADJUSTMENT">Ajuste de inventario</option><option value="SALES_RETURN">Devolución de venta</option><option value="PURCHASE_RETURN">Devolución de compra</option></select></div>{isManualAdjustment && <div className="col-12 col-md-4"><label className="form-label">Tipo de ajuste</label><select className="form-select" value={form.movement_type} onChange={(e) => setForm({ ...form, movement_type: e.target.value })}><option value="ENTRY">Entrada</option><option value="EXIT">Salida</option></select></div>}<div className={`col-12 col-md-${isManualAdjustment ? '4' : '6'}${!isManualAdjustment ? '' : ''}`}><label className="form-label">Cantidad</label><input className="form-control" type="number" min="0.001" step="0.001" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div><div className={`col-12 col-md-${isManualAdjustment ? '4' : '6'}`}><label className="form-label">Precio compra unitario</label><input className="form-control" type="number" min="0" step="0.01" required={requiresPurchasePrice} value={form.unit_purchase_price} onChange={(e) => setForm({ ...form, unit_purchase_price: e.target.value })} /></div><div className="col-12 col-md-6"><label className="form-label">Ganancia</label><input className="form-control" type="number" min="0" step="0.0001" placeholder="0.50 = 50%" value={form.profit_percentage} onChange={(e) => setForm({ ...form, profit_percentage: e.target.value })} /></div><div className="col-12"><label className="form-label">Notas</label><textarea className="form-control" rows="3" maxLength="500" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div></div><div className="alert alert-warning small mt-3 mb-0">La existencia no se modifica directamente. Cada cambio queda registrado en el kardex.</div><ModalActions submitLabel="Registrar movimiento" disabled={guardando || !form.product_id} onCancel={onClose} /></form></Can></Modal>
}

export function ReversalModal({ movement, product, devolviendo, onClose, onConfirm }) {
  if (!movement) return null
  return <Modal title="Reversar movimiento" onClose={devolviendo ? undefined : onClose} size="modal-md">
    <div className="text-center mb-4">
      <div className="mx-auto d-flex align-items-center justify-content-center rounded-circle bg-warning-subtle text-warning-emphasis" style={{ width: 56, height: 56, fontSize: 26 }}>↩</div>
      <h5 className="fw-bold mt-3 mb-1">¿Desea reversar este movimiento?</h5>
      <p className="text-muted mb-0">Esta acción creará un nuevo movimiento inverso y conservará el historial del movimiento original.</p>
    </div>
    <div className="bg-body-tertiary rounded p-3">
      <div className="row g-3 small">
        <div className="col-6"><span className="text-muted d-block">Producto</span><strong>{product?.code || `#${movement.product_id}`}</strong>{product?.name && <span className="d-block">{product.name}</span>}</div>
        <div className="col-6"><span className="text-muted d-block">Operación</span><strong>{originLabel(movement.origin_type)}</strong></div>
        <div className="col-6"><span className="text-muted d-block">Cantidad</span><strong>{number(movement.quantity)}</strong></div>
        <div className="col-6"><span className="text-muted d-block">Precio compra</span><strong>{money(movement.unit_purchase_price)}</strong></div>
        <div className="col-12"><span className="text-muted d-block">ID movimiento original</span><small className="font-monospace text-break">{movement.id}</small></div>
      </div>
    </div>
    <div className="alert alert-warning small mt-3 mb-0">El movimiento original no se elimina. Se registrará una reversión relacionada para mantener la trazabilidad del Kardex.</div>
    <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 mt-4">
      <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={devolviendo}>Cancelar</button>
      <button type="button" className="btn btn-warning" onClick={onConfirm} disabled={devolviendo}>{devolviendo ? 'Reversando...' : 'Sí, reversar movimiento'}</button>
    </div>
  </Modal>
}
