import ClientCatalogPage from './ClientCatalogPage'
import { obtenerPaisesCliente } from '../services/clientsApi'

function CountriesPage() {
  return <ClientCatalogPage
    title="Países"
    description="Catálogo geográfico de países."
    loader={obtenerPaisesCliente}
    columns={[{ key: 'code', label: 'Código' }, { key: 'name', label: 'País' }]}
  />
}

export default CountriesPage
