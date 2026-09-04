import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ClientCatalogCrudPage from './ClientCatalogCrudPage'
import {
  obtenerCiudadesCliente,
  crearCiudadCliente,
  actualizarCiudadCliente,
  eliminarCiudadCliente,
  obtenerDepartamentosCliente,
} from '../services/clientsApi'

function CitiesPage() {
  const { token, manejarSesionExpirada } = useAuth()
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    if (!token) return
    obtenerDepartamentosCliente(token)
      .then((data) => setDepartments(Array.isArray(data) ? data : []))
      .catch((error) => {
        setDepartments([])
        if (error.status === 401) manejarSesionExpirada()
      })
  }, [token, manejarSesionExpirada])

  const formFields = useMemo(() => [
    { key: 'department_id', label: 'Departamento', type: 'select', required: true, options: departments.map((department) => ({ value: department.id, label: `${department.code} - ${department.name}` })) },
    { key: 'code', label: 'Código DANE', required: true },
    { key: 'name', label: 'Nombre', required: true },
    { key: 'type', label: 'Tipo', type: 'select', required: true, options: [{ value: 'Municipio', label: 'Municipio' }, { value: 'Área no municipalizada', label: 'Área no municipalizada' }, { value: 'Isla', label: 'Isla' }] },
    { key: 'latitude', label: 'Latitud', type: 'number' },
    { key: 'longitude', label: 'Longitud', type: 'number' },
    { key: 'active', label: 'Activo', type: 'checkbox', defaultValue: true },
  ], [departments])

  return <ClientCatalogCrudPage
    title="Ciudades"
    description="Ciudades, municipios y demás unidades DIVIPOLA pertenecientes a un departamento. Pueden crearse, editarse y desactivarse cuando aparezcan nuevas unidades."
    loader={obtenerCiudadesCliente}
    createItem={crearCiudadCliente}
    updateItem={actualizarCiudadCliente}
    deleteItem={eliminarCiudadCliente}
    columns={[
      { key: 'department_id', label: 'Departamento' },
      { key: 'code', label: 'Código DANE' },
      { key: 'name', label: 'Nombre' },
      { key: 'type', label: 'Tipo' },
      { key: 'latitude', label: 'Latitud' },
      { key: 'longitude', label: 'Longitud' },
      { key: 'active', label: 'Activo', render: (item) => item.active ? 'Sí' : 'No' },
    ]}
    formFields={formFields}
  />
}

export default CitiesPage
