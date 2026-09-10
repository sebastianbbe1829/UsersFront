import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  actualizarCajaFisica,
  actualizarSucursal,
  crearAsignacionCaja,
  crearCajaFisica,
  crearSucursal,
  obtenerAsignacionesCaja,
  obtenerCajasFisicas,
  obtenerSucursalesCaja,
  obtenerUsuarios,
  retirarAsignacionCaja,
} from '../services/cashApi'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

const active = (status) => Number(status) === 1

const emptyBranch = { code: '', name: '', address: '', phone: '' }
const emptyBox = { code: '', name: '', branch_id: '' }
const emptyAssignment = { user_tenant_id: '', branch_id: '', cash_box_id: '' }

export default function CashManagementPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [branches, setBranches] = useState([])
  const [boxes, setBoxes] = useState([])
  const [assignments, setAssignments] = useState([])
  const [users, setUsers] = useState([])
  const [branchForm, setBranchForm] = useState(emptyBranch)
  const [boxForm, setBoxForm] = useState(emptyBox)
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignment)
  const [editingBranch, setEditingBranch] = useState(null)
  const [editingBox, setEditingBox] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const activeBranchCount = useMemo(() => branches.filter((branch) => active(branch.status)).length, [branches])

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
      const branchList = Array.isArray(branchData) ? branchData : []
      const boxList = Array.isArray(boxData) ? boxData : []
      const assignmentList = Array.isArray(assignmentData) ? assignmentData : []
      const activeBoxIds = new Set(
        boxList.filter((box) => active(box.status)).map((box) => String(box.id)),
      )
      const visibleAssignments = assignmentList.filter(
        (assignment) => active(assignment.status) && activeBoxIds.has(String(assignment.cash_box_id)),
      )

      setBranches(branchList)
      setBoxes(boxList)
      setAssignments(visibleAssignments)
      setUsers((Array.isArray(userData) ? userData : []).filter((user) => active(user.status)))
    } catch (err) {
      setError(err.message || 'No fue posible cargar la administración de Caja.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [token])

  useEffect(() => {
    const timeoutId = setTimeout(() => load({ showLoading: true }), 0)
    return () => clearTimeout(timeoutId)
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

  const submitBranch = async (event) => {
    event.preventDefault()
    await showResult(
      () => editingBranch
        ? actualizarSucursal(editingBranch.id, branchForm, token)
        : crearSucursal(branchForm, token),
      editingBranch ? 'Sucursal actualizada.' : 'Sucursal creada.',
    )
    setBranchForm(emptyBranch)
    setEditingBranch(null)
  }

  const submitBox = async (event) => {
    event.preventDefault()
    await showResult(
      () => editingBox
        ? actualizarCajaFisica(editingBox.id, boxForm, token)
        : crearCajaFisica(boxForm, token),
      editingBox ? 'Caja actualizada.' : 'Caja creada.',
    )
    setBoxForm(emptyBox)
    setEditingBox(null)
  }

  const submitAssignment = async (event) => {
    event.preventDefault()
    await showResult(
      () => crearAsignacionCaja(assignmentForm, token),
      'Asignación creada.',
    )
    setAssignmentForm(emptyAssignment)
  }

  const toggleBranch = async (branch) => {
    await showResult(
      () => actualizarSucursal(branch.id, { status: active(branch.status) ? 0 : 1 }, token),
      active(branch.status) ? 'Sucursal desactivada.' : 'Sucursal reactivada.',
    )
  }

  const toggleBox = async (box) => {
    await showResult(
      () => actualizarCajaFisica(box.id, { status: active(box.status) ? 0 : 1 }, token),
      active(box.status) ? 'Caja desactivada.' : 'Caja reactivada.',
    )
  }

  const removeAssignment = async (assignment) => {
    await showResult(
      () => retirarAsignacionCaja(assignment.id, token),
      'Asignación retirada.',
    )
  }

  const startEditBranch = (branch) => {
    setEditingBranch(branch)
    setBranchForm({
      code: branch.code || '',
      name: branch.name || '',
      address: branch.address || '',
      phone: branch.phone || '',
    })
  }

  const startEditBox = (box) => {
    setEditingBox(box)
    setBoxForm({
      code: box.code || '',
      name: box.name || '',
      branch_id: String(box.branch_id || ''),
    })
  }

  const cajaPath = location.pathname.replace(/\/administracion(?:\/.*)?$/, '')

  if (loading) {
    return (
      <section className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <div className="mt-3 text-muted">Cargando administración de Caja...</div>
        </div>
      </section>
    )
  }

  return (
    <section className="container-fluid py-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h2 className="mb-1">Administración de Caja</h2>
          <div className="text-muted">Sucursales, cajas físicas y asignaciones.</div>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate(cajaPath)}>
          ← Operación de Caja
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="d-flex gap-2 flex-wrap mb-3">
        <span className="badge text-bg-primary">Sucursales activas: {activeBranchCount}</span>
        <span className="badge text-bg-secondary">Cajas físicas: {boxes.length}</span>
        <span className="badge text-bg-secondary">Asignaciones: {assignments.length}</span>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-5">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Sucursales</h5>
                <span className="small text-muted">{branches.length} registradas</span>
              </div>
              <form onSubmit={submitBranch} className="row g-2 mb-4">
                <div className="col-4"><input className="form-control" placeholder="Código" value={branchForm.code} onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })} required /></div>
                <div className="col-8"><input className="form-control" placeholder="Nombre" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} required /></div>
                <div className="col-7"><input className="form-control" placeholder="Dirección" value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} /></div>
                <div className="col-5"><input className="form-control" placeholder="Teléfono" value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} /></div>
                <div className="col-12 d-flex gap-2">
                  <button className="btn btn-primary" disabled={saving}>{editingBranch ? 'Actualizar' : 'Crear sucursal'}</button>
                  {editingBranch && <button type="button" className="btn btn-outline-secondary" onClick={() => { setEditingBranch(null); setBranchForm(emptyBranch) }}>Cancelar</button>}
                </div>
              </form>
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead><tr><th>Código</th><th>Nombre</th><th>Estado</th><th className="text-end">Acciones</th></tr></thead>
                  <tbody>
                    {branches.map((branch) => (
                      <tr key={branch.id}>
                        <td>{branch.code}</td><td>{branch.name}</td>
                        <td><span className={`badge ${active(branch.status) ? 'text-bg-success' : 'text-bg-secondary'}`}>{active(branch.status) ? 'Activa' : 'Inactiva'}</span></td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary" onClick={() => startEditBranch(branch)}>Editar</button>
                            <button className="btn btn-outline-secondary" onClick={() => toggleBranch(branch)} disabled={saving}>{active(branch.status) ? 'Desactivar' : 'Reactivar'}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-7">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Cajas físicas</h5>
                <span className="small text-muted">Las inactivas pueden reactivarse.</span>
              </div>
              <form onSubmit={submitBox} className="row g-2 mb-4">
                <div className="col-3"><input className="form-control" placeholder="Código" value={boxForm.code} onChange={(e) => setBoxForm({ ...boxForm, code: e.target.value })} required /></div>
                <div className="col-4"><input className="form-control" placeholder="Nombre" value={boxForm.name} onChange={(e) => setBoxForm({ ...boxForm, name: e.target.value })} required /></div>
                <div className="col-5">
                  <select className="form-select" value={boxForm.branch_id} onChange={(e) => setBoxForm({ ...boxForm, branch_id: e.target.value })} required>
                    <option value="">Sucursal...</option>
                    {branches.filter((branch) => active(branch.status)).map((branch) => <option key={branch.id} value={branch.id}>{branch.code} · {branch.name}</option>)}
                  </select>
                </div>
                <div className="col-12 d-flex gap-2">
                  <button className="btn btn-primary" disabled={saving}>{editingBox ? 'Actualizar' : 'Crear caja'}</button>
                  {editingBox && <button type="button" className="btn btn-outline-secondary" onClick={() => { setEditingBox(null); setBoxForm(emptyBox) }}>Cancelar</button>}
                </div>
              </form>
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead><tr><th>Código</th><th>Nombre</th><th>Sucursal</th><th>Estado</th><th className="text-end">Acciones</th></tr></thead>
                  <tbody>
                    {boxes.map((box) => {
                      const branch = branches.find((item) => String(item.id) === String(box.branch_id))
                      return (
                        <tr key={box.id}>
                          <td>{box.code}</td><td>{box.name}</td><td>{branch?.name || '—'}</td>
                          <td><span className={`badge ${active(box.status) ? 'text-bg-success' : 'text-bg-secondary'}`}>{active(box.status) ? 'Activa' : 'Inactiva'}</span></td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary" onClick={() => startEditBox(box)}>Editar</button>
                              <button className="btn btn-outline-secondary" onClick={() => toggleBox(box)} disabled={saving}>{active(box.status) ? 'Desactivar' : 'Reactivar'}</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Asignaciones</h5>
                <span className="small text-muted">Usuario → sucursal → caja</span>
              </div>
              <form onSubmit={submitAssignment} className="row g-2 mb-4">
                <div className="col-12 col-md-4">
                  <select className="form-select" value={assignmentForm.user_tenant_id} onChange={(e) => setAssignmentForm({ ...assignmentForm, user_tenant_id: e.target.value })} required>
                    <option value="">Usuario...</option>
                    {users.map((user) => <option key={user.id} value={user.id}>{user.name || user.email || user.id}</option>)}
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <select className="form-select" value={assignmentForm.branch_id} onChange={(e) => setAssignmentForm({ ...assignmentForm, branch_id: e.target.value, cash_box_id: '' })} required>
                    <option value="">Sucursal...</option>
                    {branches.filter((branch) => active(branch.status)).map((branch) => <option key={branch.id} value={branch.id}>{branch.code} · {branch.name}</option>)}
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <select className="form-select" value={assignmentForm.cash_box_id} onChange={(e) => setAssignmentForm({ ...assignmentForm, cash_box_id: e.target.value })} required disabled={!assignmentForm.branch_id}>
                    <option value="">Caja...</option>
                    {filteredBoxes.filter((box) => active(box.status)).map((box) => <option key={box.id} value={box.id}>{box.code} · {box.name}</option>)}
                  </select>
                </div>
                <div className="col-12"><button className="btn btn-primary" disabled={saving}>Asignar caja</button></div>
              </form>
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead><tr><th>Usuario</th><th>Sucursal</th><th>Caja</th><th className="text-end">Acción</th></tr></thead>
                  <tbody>
                    {assignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td>{assignment.user_name || assignment.user_email || assignment.user_tenant_id}</td>
                        <td>{assignment.branch_name || assignment.branch_id}</td>
                        <td>{assignment.cash_box_name || assignment.cash_box_id}</td>
                        <td className="text-end"><button className="btn btn-sm btn-outline-danger" onClick={() => removeAssignment(assignment)} disabled={saving}>Retirar</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
