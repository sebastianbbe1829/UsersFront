import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { obtenerUsuarios } from '../services/api'
import {
  actualizarCajaFisica,
  actualizarSucursalCaja,
  crearAsignacionCaja,
  crearCajaFisica,
  crearSucursalCaja,
  desasignarCajaUsuario,
  obtenerAsignacionesCaja,
  obtenerCajasFisicas,
  obtenerSucursalesCaja,
} from '../services/cashAdminApi'

const emptyBranch = { code: '', name: '', address: '', phone: '' }
const emptyBox = { branch_id: '', code: '', name: '' }
const emptyAssignment = { user_tenant_id: '', branch_id: '', cash_box_id: '' }

const active = (value) => Number(value) === 1

export default function CashManagementPage() {
  const { token } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [branches, setBranches] = useState([])
  const [boxes, setBoxes] = useState([])
  const [assignments, setAssignments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [branchForm, setBranchForm] = useState(emptyBranch)
  const [boxForm, setBoxForm] = useState(emptyBox)
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignment)

  const managementBase = useMemo(
    () => `${location.pathname.split('/caja/administracion')[0]}/caja/administracion`,
    [location.pathname],
  )
  const cajaPath = useMemo(() => managementBase.replace(/\/administracion$/, ''), [managementBase])

  const tab = useMemo(() => {
    if (location.pathname.endsWith('/sucursales')) return 'branches'
    if (location.pathname.endsWith('/cajas')) return 'boxes'
    if (location.pathname.endsWith('/asignaciones')) return 'assignments'
    return 'branches'
  }, [location.pathname])

  useEffect(() => {
    if (location.pathname.endsWith('/caja/administracion')) {
      navigate(`${managementBase}/sucursales`, { replace: true })
    }
  }, [location.pathname, managementBase, navigate])

  useEffect(() => {
    if (!location.pathname.includes('/caja/administracion')) return undefined

    const main = document.querySelector('main')
    const content = main?.querySelector(':scope > section')
    if (!main || !content) return undefined

    const previousMainStyle = {
      height: main.style.height,
      minHeight: main.style.minHeight,
      display: main.style.display,
      flexDirection: main.style.flexDirection,
      overflow: main.style.overflow,
    }
    const previousContentStyle = {
      flex: content.style.flex,
      minHeight: content.style.minHeight,
      overflow: content.style.overflow,
    }

    Object.assign(main.style, {
      height: '100vh',
      minHeight: '0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    })
    Object.assign(content.style, {
      flex: '1 1 auto',
      minHeight: '0',
      overflow: 'auto',
    })

    return () => {
      Object.assign(main.style, previousMainStyle)
      Object.assign(content.style, previousContentStyle)
    }
  }, [location.pathname])

  const load = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true)
    setError('')
    try {
      const [branchData, boxData, assignmentData, userData] = await Promise.all([
        obtenerSucursalesCaja(token),
        obtenerCajasFisicas(token),
        obtenerAsignacionesCaja(token),
        obtenerUsuarios(token),
      ])
      setBranches(Array.isArray(branchData) ? branchData : [])
      setBoxes(Array.isArray(boxData) ? boxData : [])
      setAssignments(Array.isArray(assignmentData) ? assignmentData : [])
      setUsers((Array.isArray(userData) ? userData : []).filter((user) => active(user.status)))
    } catch (err) {
      setError(err.message || 'No fue posible cargar la administración de Caja.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load({ showLoading: true })
  }, [load])

  const filteredBoxes = useMemo(
    () => boxes.filter((box) => String(box.branch_id) === String(assignmentForm.branch_id)),
    [boxes, assignmentForm.branch_id],
  )

  const showResult = async (operation, successMessage) => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await operation()
      await load()
      setMessage(successMessage)
    } catch (err) {
      setError(err.message || 'No fue posible completar la operación.')
    } finally {
      setSaving(false)
    }
  }

  const submitBranch = (event) => {
    event.preventDefault()
    if (!branchForm.code.trim() || !branchForm.name.trim()) {
      setError('Código y nombre de la sucursal son obligatorios.')
      return
    }
    return showResult(
      () => crearSucursalCaja({
        code: branchForm.code.trim(),
        name: branchForm.name.trim(),
        address: branchForm.address.trim() || null,
        phone: branchForm.phone.trim() || null,
      }, token),
      'Sucursal creada correctamente.',
    ).then(() => setBranchForm(emptyBranch))
  }

  const submitBox = (event) => {
    event.preventDefault()
    if (!boxForm.branch_id || !boxForm.code.trim() || !boxForm.name.trim()) {
      setError('Sucursal, código y nombre de la caja son obligatorios.')
      return
    }
    return showResult(
      () => crearCajaFisica({
        branch_id: Number(boxForm.branch_id),
        code: boxForm.code.trim(),
        name: boxForm.name.trim(),
      }, token),
      'Caja física creada correctamente.',
    ).then(() => setBoxForm((current) => ({ ...emptyBox, branch_id: current.branch_id })))
  }

  const submitAssignment = (event) => {
    event.preventDefault()
    if (!assignmentForm.user_tenant_id || !assignmentForm.branch_id || !assignmentForm.cash_box_id) {
      setError('Usuario, sucursal y caja son obligatorios.')
      return
    }
    return showResult(
      () => crearAsignacionCaja({
        user_tenant_id: Number(assignmentForm.user_tenant_id),
        branch_id: Number(assignmentForm.branch_id),
        cash_box_id: Number(assignmentForm.cash_box_id),
      }, token),
      'Caja asignada al usuario correctamente.',
    ).then(() => setAssignmentForm((current) => ({ ...emptyAssignment, branch_id: current.branch_id })))
  }

  const toggleBranch = (branch) => showResult(
    () => actualizarSucursalCaja(branch.id, { status: active(branch.status) ? 0 : 1 }, token),
    active(branch.status) ? 'Sucursal desactivada.' : 'Sucursal activada.',
  )

  const toggleBox = (box) => showResult(
    () => actualizarCajaFisica(box.id, { status: active(box.status) ? 0 : 1 }, token),
    active(box.status) ? 'Caja física desactivada.' : 'Caja física activada.',
  )

  const removeAssignment = (assignment) => {
    if (!window.confirm(`¿Desasignar la caja ${assignment.cash_box_code} del usuario ${assignment.user_name}?`)) return
    return showResult(
      () => desasignarCajaUsuario(assignment.id, token),
      'Asignación retirada correctamente.',
    )
  }

  const setAssignmentBranch = (value) => {
    setAssignmentForm((current) => ({ ...current, branch_id: value, cash_box_id: '' }))
  }

  const savingLabel = tab === 'branches'
    ? 'Guardando sucursal...'
    : tab === 'boxes'
      ? 'Guardando caja...'
      : 'Asignando caja...'

  if (loading) {
    return <section className="container-fluid py-4"><div className="text-center py-5"><div className="spinner-border text-primary" role="status" /><div className="mt-3 text-muted">Cargando administración de Caja...</div></div></section>
  }

  return (
    <section className="container-fluid py-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h2 className="mb-1">Administración de Caja</h2>
          <div className="text-muted">Configura sucursales, cajas físicas y la asignación operativa de usuarios.</div>
        </div>
        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(cajaPath)}>← Operación de Caja</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="btn-group mb-4" role="tablist">
        <button type="button" className={`btn ${tab === 'branches' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => navigate(`${managementBase}/sucursales`)}>Sucursales</button>
        <button type="button" className={`btn ${tab === 'boxes' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => navigate(`${managementBase}/cajas`)}>Cajas físicas</button>
        <button type="button" className={`btn ${tab === 'assignments' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => navigate(`${managementBase}/asignaciones`)}>Asignaciones</button>
      </div>

      {tab === 'branches' && (
        <>
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <h5 className="mb-3">Nueva sucursal</h5>
              <form className="row g-3 align-items-end" onSubmit={submitBranch}>
                <div className="col-12 col-md-2"><label className="form-label">Código</label><input className="form-control" maxLength="30" value={branchForm.code} onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })} disabled={saving} /></div>
                <div className="col-12 col-md-3"><label className="form-label">Nombre</label><input className="form-control" maxLength="150" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} disabled={saving} /></div>
                <div className="col-12 col-md-3"><label className="form-label">Dirección</label><input className="form-control" maxLength="250" value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} disabled={saving} /></div>
                <div className="col-12 col-md-2"><label className="form-label">Teléfono</label><input className="form-control" maxLength="30" value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} disabled={saving} /></div>
                <div className="col-12 col-md-2"><button className="btn btn-primary w-100" disabled={saving}>{saving && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />}{saving ? savingLabel : 'Crear sucursal'}</button></div>
              </form>
            </div>
          </div>
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="mb-3">Sucursales registradas</h5>
              <div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Código</th><th>Nombre</th><th>Dirección</th><th>Cajas</th><th>Estado</th><th className="text-end">Acción</th></tr></thead><tbody>
                {branches.length === 0 ? <tr><td colSpan="6" className="text-center text-muted py-4">No hay sucursales registradas.</td></tr> : branches.map((branch) => <tr key={branch.id}><td className="fw-semibold">{branch.code}</td><td>{branch.name}</td><td>{branch.address || '—'}</td><td>{branch.cash_boxes_count}</td><td><span className={`badge ${active(branch.status) ? 'text-bg-success' : 'text-bg-secondary'}`}>{active(branch.status) ? 'Activa' : 'Inactiva'}</span></td><td className="text-end"><button type="button" className={`btn btn-sm ${active(branch.status) ? 'btn-outline-danger' : 'btn-outline-success'}`} disabled={saving} onClick={() => toggleBranch(branch)}>{saving && <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />}{active(branch.status) ? 'Desactivar' : 'Activar'}</button></td></tr>)}
              </tbody></table></div>
            </div>
          </div>
        </>
      )}

      {tab === 'boxes' && (
        <>
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <h5 className="mb-3">Nueva caja física</h5>
              <form className="row g-3 align-items-end" onSubmit={submitBox}>
                <div className="col-12 col-md-4"><label className="form-label">Sucursal</label><select className="form-select" value={boxForm.branch_id} onChange={(e) => setBoxForm({ ...boxForm, branch_id: e.target.value })} disabled={saving}><option value="">Seleccione...</option>{branches.filter((branch) => active(branch.status)).map((branch) => <option key={branch.id} value={branch.id}>{branch.code} — {branch.name}</option>)}</select></div>
                <div className="col-12 col-md-2"><label className="form-label">Código</label><input className="form-control" maxLength="30" value={boxForm.code} onChange={(e) => setBoxForm({ ...boxForm, code: e.target.value })} disabled={saving} /></div>
                <div className="col-12 col-md-4"><label className="form-label">Nombre</label><input className="form-control" maxLength="100" value={boxForm.name} onChange={(e) => setBoxForm({ ...boxForm, name: e.target.value })} disabled={saving} /></div>
                <div className="col-12 col-md-2"><button className="btn btn-primary w-100" disabled={saving}>{saving && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />}{saving ? savingLabel : 'Crear caja'}</button></div>
              </form>
            </div>
          </div>
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="mb-3">Cajas físicas registradas</h5>
              <div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Sucursal</th><th>Código</th><th>Nombre</th><th>Estado</th><th className="text-end">Acción</th></tr></thead><tbody>
                {boxes.length === 0 ? <tr><td colSpan="5" className="text-center text-muted py-4">No hay cajas físicas registradas.</td></tr> : boxes.map((box) => <tr key={box.id}><td>{box.branch_name}</td><td className="fw-semibold">{box.code}</td><td>{box.name}</td><td><span className={`badge ${active(box.status) ? 'text-bg-success' : 'text-bg-secondary'}`}>{active(box.status) ? 'Activa' : 'Inactiva'}</span></td><td className="text-end"><button type="button" className={`btn btn-sm ${active(box.status) ? 'btn-outline-danger' : 'btn-outline-success'}`} disabled={saving} onClick={() => toggleBox(box)}>{saving && <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />}{active(box.status) ? 'Desactivar' : 'Activar'}</button></td></tr>)}
              </tbody></table></div>
            </div>
          </div>
        </>
      )}

      {tab === 'assignments' && (
        <>
          <div className="alert alert-info">Cada usuario puede tener una sola asignación activa: <strong>sucursal + caja física</strong>. El usuario no seleccionará estos datos durante una venta o un pago; quedan definidos aquí.</div>
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <h5 className="mb-3">Asignar caja a usuario</h5>
              <form className="row g-3 align-items-end" onSubmit={submitAssignment}>
                <div className="col-12 col-lg-4"><label className="form-label">Usuario</label><select className="form-select" value={assignmentForm.user_tenant_id} onChange={(e) => setAssignmentForm({ ...assignmentForm, user_tenant_id: e.target.value })} disabled={saving}><option value="">Seleccione...</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name} — {user.dni}</option>)}</select></div>
                <div className="col-12 col-md-6 col-lg-3"><label className="form-label">Sucursal</label><select className="form-select" value={assignmentForm.branch_id} onChange={(e) => setAssignmentBranch(e.target.value)} disabled={saving}><option value="">Seleccione...</option>{branches.filter((branch) => active(branch.status)).map((branch) => <option key={branch.id} value={branch.id}>{branch.code} — {branch.name}</option>)}</select></div>
                <div className="col-12 col-md-6 col-lg-3"><label className="form-label">Caja física</label><select className="form-select" value={assignmentForm.cash_box_id} onChange={(e) => setAssignmentForm({ ...assignmentForm, cash_box_id: e.target.value })} disabled={saving}><option value="">Seleccione...</option>{filteredBoxes.filter((box) => active(box.status)).map((box) => <option key={box.id} value={box.id}>{box.code} — {box.name}</option>)}</select></div>
                <div className="col-12 col-lg-2"><button className="btn btn-primary w-100" disabled={saving}>{saving && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />}{saving ? savingLabel : 'Asignar caja'}</button></div>
              </form>
            </div>
          </div>
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="mb-3">Asignaciones</h5>
              <div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Usuario</th><th>Identificación</th><th>Sucursal</th><th>Caja</th><th>Estado</th><th className="text-end">Acción</th></tr></thead><tbody>
                {assignments.length === 0 ? <tr><td colSpan="6" className="text-center text-muted py-4">No hay asignaciones registradas.</td></tr> : assignments.map((assignment) => <tr key={assignment.id}><td><div className="fw-semibold">{assignment.user_name}</div><div className="small text-muted">{assignment.user_email}</div></td><td>{assignment.user_dni}</td><td>{assignment.branch_name}</td><td><span className="fw-semibold">{assignment.cash_box_code}</span> — {assignment.cash_box_name}</td><td><span className={`badge ${active(assignment.status) ? 'text-bg-success' : 'text-bg-secondary'}`}>{active(assignment.status) ? 'Activa' : 'Retirada'}</span></td><td className="text-end">{active(assignment.status) && <button type="button" className="btn btn-sm btn-outline-danger" disabled={saving} onClick={() => removeAssignment(assignment)}>{saving && <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />}Desasignar</button>}</td></tr>)}
              </tbody></table></div>
            </div>
          </div>
        </>
      )}

      {message && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cash-operation-success-title"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title" id="cash-operation-success-title">Operación realizada</h5>
                <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setMessage('')} />
              </div>
              <div className="modal-body text-center py-4">
                <div className="text-success mb-3" style={{ fontSize: '3rem', lineHeight: 1 }}>✓</div>
                <div className="fs-5">{message}</div>
              </div>
              <div className="modal-footer justify-content-center">
                <button type="button" className="btn btn-primary px-4" onClick={() => setMessage('')}>Aceptar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
