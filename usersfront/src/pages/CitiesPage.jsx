import ClientCatalogPage from './ClientCatalogPage'
import { obtenerCiudadesCliente } from '../services/clientsApi'

function CitiesPage() {
  return <ClientCatalogPage
    title="Ciudades"
    description="Ciudades relacionadas con los departamentos del catálogo geográfico."
    loader={obtenerCiudadesCliente}
    columns={[{ key: 'department_id', label: 'Departamento' }, { key: 'code', label: 'Código' }, { key: 'name', label: 'Ciudad' }]}
  />
}

export default CitiesPage
