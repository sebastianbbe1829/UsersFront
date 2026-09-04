import { useEffect, useMemo, useState } from 'react'
import ClientCatalogCrudPage from './ClientCatalogCrudPage'
import {
  obtenerDepartamentosCliente,
  crearDepartamentoCliente,
  actualizarDepartamentoCliente,
  eliminarDepartamentoCliente,
  obtenerPaisesCliente,
} from '../services/clientsApi'

function DepartmentsPage() {
  const [countries, setCountries] = useState([])

  useEffect(() => {
    const loadCountries = async () => {
      try {
        setCountries(await obtenerPaisesCliente())
      } catch {
        setCountries([])
      }
    }
    loadCountries()
  }, [])

  const formFields = useMemo(() => [
    { key: 'country_id', label: 'País', type: 'select', required: true, options: countries.map((country) => ({ value: country.id, label: `${country.code} - ${country.name}` })) },
    { key: 'code', label: 'Código DANE', required: true },
    { key: 'name', label: 'Departamento', required: true },
    { key: 'active', label: 'Activo', type: 'checkbox', defaultValue: true },
  ], [countries])

  return <ClientCatalogCrudPage
    title="Departamentos"
    description="Departamentos pertenecientes a un país. No se puede crear un departamento sin país."
    loader={obtenerDepartamentosCliente}
    createItem={crearDepartamentoCliente}
    updateItem={actualizarDepartamentoCliente}
    deleteItem={eliminarDepartamentoCliente}
    columns={[
      { key: 'country_id', label: 'País' },
      { key: 'code', label: 'Código DANE' },
      { key: 'name', label: 'Departamento' },
      { key: 'active', label: 'Activo', render: (item) => item.active ? 'Sí' : 'No' },
    ]}
    formFields={formFields}
  />
}

export default DepartmentsPage
