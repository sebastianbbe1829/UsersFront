import ClientCatalogPage from './ClientCatalogPage'
import { obtenerDepartamentosCliente } from '../services/clientsApi'

function DepartmentsPage() {
  return <ClientCatalogPage
    title="Departamentos"
    description="Departamentos relacionados con los países del catálogo geográfico."
    loader={(token) => obtenerDepartamentosCliente(token)}
    columns={[{ key: 'country_id', label: 'País' }, { key: 'code', label: 'Código' }, { key: 'name', label: 'Departamento' }]}
  />
}

export default DepartmentsPage
