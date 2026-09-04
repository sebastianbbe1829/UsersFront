import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import SessionManager from '../components/SessionManager'
import Can from '../components/Can'

const initialForm = (fields) => Object.fromEntries(fields.map((field) => [field.key, field.defaultValue ?? (field.type === 'checkbox' ? true : '')]))
const PAGE_SIZE = 10

export default function ClientCatalogCrudPage({ title, description, loader, columns, createItem, updateItem, deleteItem, formFields = [] }) {
  const { token, manejarSesionExpirada } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(() => initialForm(formFields))
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const result = await loader(token)
      setItems(Array.isArray(result) ? result : [])
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMessage({ type: 'danger', text: error.message || `No fue posible cargar ${title.toLowerCase()}.` })
    } finally { setLoading(false) }
  }, [token, loader, manejarSesionExpirada, title])

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      if (!token) return
      try {
        setLoading(true)
        const result = await loader(token)
        if (!activo) return
        setItems(Array.isArray(result) ? result : [])
      } catch (error) {
        if (!activo) return
        if (error.status === 401) return manejarSesionExpirada()
        setMessage({ type: 'danger', text: error.message || `No fue posible cargar ${title.toLowerCase()}.` })
      } finally {
        if (activo) setLoading(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [token, loader, manejarSesionExpirada, title])

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter((item) => columns.some((column) => {
      const value = column.searchValue ? column.searchValue(item) : item[column.key]
      return String(value ?? '').toLowerCase().includes(term)
    }))
  }, [items, search, columns])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleSearchChange = (event) => {
    setSearch(event.target.value)
    setPage(1)
  }

  const openCreate = () => { setCreating(true); setEditingId(null); setForm(initialForm(formFields)); setMessage(null) }
  const openEdit = (item) => { setEditingId(item.id); setCreating(false); setForm(Object.fromEntries(formFields.map((field) => [field.key, item[field.key] ?? (field.type === 'checkbox' ? false : '')]))); setMessage(null) }
  const closeModal = () => { setCreating(false); setEditingId(null); setForm(initialForm(formFields)) }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const data = { ...form }
      formFields.forEach((field) => { if (field.type === 'number' && data[field.key] !== '') data[field.key] = Number(data[field.key]) })
      const wasEditing = Boolean(editingId)
      if (wasEditing) await updateItem(editingId, data, token)
      else await createItem(data, token)
      closeModal()
      setMessage({ type: 'success', text: wasEditing ? 'Registro actualizado correctamente.' : 'Registro creado correctamente.' })
      await load()
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMessage({ type: 'danger', text: error.message || 'No fue posible guardar el registro.' })
    } finally { setSaving(false) }
  }

  const remove = async (item) => {
    if (!window.confirm(`¿Deseas desactivar "${item.name || item.code || item.id}"?`)) return
    try { await deleteItem(item.id, token); setMessage({ type: 'success', text: 'Registro desactivado correctamente.' }); await load() }
    catch (error) { if (error.status === 401) return manejarSesionExpirada(); setMessage({ type: 'danger', text: error.message || 'No fue posible desactivar el registro.' }) }
  }

  const renderField = (field) => {
    const disabled = saving || (Boolean(editingId) && field.disabledWhenEditing)
    if (field.type === 'checkbox') return <div className="form-check mt-2"><input className="form-check-input" type="checkbox" checked={Boolean(form[field.key])} onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.checked }))} disabled={disabled} /><label className="form-check-label">{field.label}</label></div>
    if (field.type === 'select') return <select className="form-select" value={form[field.key] ?? ''} onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))} required={field.required} disabled={disabled}><option value="">Seleccione...</option>{(field.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
    return <input className="form-control" type={field.type || 'text'} step={field.type === 'number' ? 'any' : undefined} value={form[field.key] ?? ''} onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))} required={field.required} disabled={disabled} />
  }

  const modal = (creating || editingId) ? <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,.5)', position: 'fixed', inset: 0, zIndex: 2000, overflowY: 'auto' }} role="dialog" aria-modal="true"><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content shadow-lg border-0"><div className="modal-header"><h5 className="modal-title fw-bold">{editingId ? 'Editar registro' : 'Nuevo registro'}</h5><button type="button" className="btn-close" onClick={closeModal} disabled={saving} aria-label="Cerrar" /></div><div className="modal-body"><form onSubmit={save}><div className="row g-3">{formFields.map((field) => <div key={field.key} className={field.colClass || 'col-md-6'}>{field.type !== 'checkbox' && <label className="form-label fw-semibold">{field.label}</label>}{renderField(field)}</div>)}</div><div className="d-flex justify-content-end gap-2 mt-4"><button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>Cancelar</button><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}</button></div></form></div></div></div></div> : null

  return <>
    <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
    <div className="mb-4"><h2 className="fw-bold mb-1">{title}</h2><p className="text-muted mb-0">{description}</p></div>
    {message && <div className={`alert alert-${message.type}`} role="alert">{message.text}</div>}
    <div className="card shadow-sm border-0"><div className="card-body">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><div><h5 className="fw-bold mb-0">Registros</h5><small className="text-muted">{filteredItems.length} de {items.length}</small></div><Can permission="CLIENT_CREATE"><button type="button" className="btn btn-primary" onClick={openCreate}>+ Nuevo</button></Can></div>
      <div className="mb-3"><input type="search" className="form-control" placeholder={`Buscar en ${title.toLowerCase()}...`} value={search} onChange={handleSearchChange} /></div>
      {loading ? <div className="text-center py-5"><div className="spinner-border" role="status" /><div className="text-muted mt-2">Cargando...</div></div> : filteredItems.length === 0 ? <div className="text-muted text-center py-5">{items.length === 0 ? 'No hay registros.' : 'No se encontraron registros con la búsqueda.'}</div> : <><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}<th className="text-end">Acciones</th></tr></thead><tbody>{visibleItems.map((item) => <tr key={item.id}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(item) : item[column.key] ?? '-'}</td>)}<td className="text-end text-nowrap"><Can permission="CLIENT_UPDATE"><button type="button" className="btn btn-outline-primary btn-sm me-2" onClick={() => openEdit(item)}>Editar</button></Can><Can permission="CLIENT_DELETE"><button type="button" className="btn btn-outline-danger btn-sm" onClick={() => remove(item)}>Desactivar</button></Can></td></tr>)}</tbody></table></div><div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3"><small className="text-muted">Página {currentPage} de {totalPages}</small><div className="btn-group"><button type="button" className="btn btn-outline-secondary btn-sm" disabled={currentPage === 1} onClick={() => setPage((p) => p - 1)}>Anterior</button><button type="button" className="btn btn-outline-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</button></div></div></>}
    </div></div>
    {modal}
  </>
}
