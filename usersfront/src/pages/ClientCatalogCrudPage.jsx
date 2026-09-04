import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import SessionManager from '../components/SessionManager'
import Can from '../components/Can'

const initialForm = (fields) => Object.fromEntries(fields.map((field) => [field.key, field.defaultValue ?? (field.type === 'checkbox' ? true : '')]))

export default function ClientCatalogCrudPage({ title, description, loader, columns, createItem, updateItem, deleteItem, formFields = [] }) {
  const { token, manejarSesionExpirada } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(() => initialForm(formFields))
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const result = await loader(token)
      setItems(Array.isArray(result) ? result : [])
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMessage({ type: 'danger', text: error.message || `No fue posible cargar ${title.toLowerCase()}.` })
    } finally {
      setLoading(false)
    }
  }, [token, loader, manejarSesionExpirada, title])

  useEffect(() => { load() }, [load])

  const edit = (item) => {
    setEditingId(item.id)
    setForm(Object.fromEntries(formFields.map((field) => [field.key, item[field.key] ?? (field.type === 'checkbox' ? false : '')])))
    setMessage(null)
  }

  const reset = () => {
    setEditingId(null)
    setForm(initialForm(formFields))
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const data = { ...form }
      formFields.forEach((field) => {
        if (field.type === 'number' && data[field.key] !== '') data[field.key] = Number(data[field.key])
      })
      if (editingId) await updateItem(editingId, data, token)
      else await createItem(data, token)
      const wasEditing = Boolean(editingId)
      reset()
      setMessage({ type: 'success', text: wasEditing ? 'Registro actualizado correctamente.' : 'Registro creado correctamente.' })
      await load()
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMessage({ type: 'danger', text: error.message || 'No fue posible guardar el registro.' })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`¿Deseas desactivar "${item.name || item.code || item.id}"?`)) return
    try {
      await deleteItem(item.id, token)
      setMessage({ type: 'success', text: 'Registro desactivado correctamente.' })
      await load()
    } catch (error) {
      if (error.status === 401) return manejarSesionExpirada()
      setMessage({ type: 'danger', text: error.message || 'No fue posible desactivar el registro.' })
    }
  }

  const renderField = (field) => {
    const disabled = saving || (editingId && field.disabledWhenEditing)
    if (field.type === 'checkbox') return <div className="form-check mt-2"><input className="form-check-input" type="checkbox" checked={Boolean(form[field.key])} onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.checked }))} disabled={disabled} /><label className="form-check-label">{field.label}</label></div>
    if (field.type === 'select') return <select className="form-select" value={form[field.key] ?? ''} onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))} required={field.required} disabled={disabled}><option value="">Seleccione...</option>{(field.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
    return <input className="form-control" type={field.type || 'text'} step={field.type === 'number' ? 'any' : undefined} value={form[field.key] ?? ''} onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))} required={field.required} disabled={disabled} />
  }

  const formCard = (mode) => <div className="card shadow-sm border-0 mb-4"><div className="card-body"><div className="d-flex justify-content-between align-items-center mb-3"><h5 className="fw-bold mb-0">{mode === 'edit' ? 'Editar registro' : 'Nuevo registro'}</h5>{mode === 'edit' && <button type="button" className="btn btn-outline-secondary btn-sm" onClick={reset}>Cancelar</button>}</div><form onSubmit={save}><div className="row g-3">{formFields.map((field) => <div key={field.key} className={field.colClass || 'col-md-6'}>{field.type !== 'checkbox' && <label className="form-label fw-semibold">{field.label}</label>}{renderField(field)}</div>)}</div><button className="btn btn-primary mt-3" type="submit" disabled={saving}>{saving ? 'Guardando...' : mode === 'edit' ? 'Actualizar' : 'Crear'}</button></form></div></div>

  return <>
    <SessionManager token={token} onSesionExpirada={manejarSesionExpirada} />
    <div className="mb-4"><h2 className="fw-bold mb-1">{title}</h2><p className="text-muted mb-0">{description}</p></div>
    {message && <div className={`alert alert-${message.type}`} role="alert">{message.text}</div>}
    {!editingId && <Can permission="CLIENT_CREATE">{formCard('create')}</Can>}
    {editingId && <Can permission="CLIENT_UPDATE">{formCard('edit')} </Can>}
    <div className="card shadow-sm border-0"><div className="card-body"><div className="d-flex justify-content-between align-items-center mb-3"><h5 className="fw-bold mb-0">Registros</h5><span className="badge text-bg-secondary">{items.length}</span></div>{loading ? <div className="text-center py-4"><div className="spinner-border" role="status" /></div> : items.length === 0 ? <div className="text-muted text-center py-4">No hay registros.</div> : <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}<th>Acciones</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(item) : item[column.key] ?? '-'}</td>)}<td className="text-nowrap"><Can permission="CLIENT_UPDATE"><button type="button" className="btn btn-outline-primary btn-sm me-2" onClick={() => edit(item)}>Editar</button></Can><Can permission="CLIENT_DELETE"><button type="button" className="btn btn-outline-danger btn-sm" onClick={() => remove(item)}>Desactivar</button></Can></td></tr>)}</tbody></table></div>}</div></div>
  </>
}
