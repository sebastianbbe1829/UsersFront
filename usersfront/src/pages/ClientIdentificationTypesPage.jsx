import ClientCatalogPage from './ClientCatalogPage'
import { obtenerTiposIdentificacionCliente } from '../services/clientsApi'

function ClientIdentificationTypesPage() {
  return <ClientCatalogPage
    title="Tipos de Identificación"
    description="Catálogo de tipos de identificación disponibles para los clientes."
    loader={obtenerTiposIdentificacionCliente}
    columns={[
      { key: 'code', label: 'Código' },
      { key: 'name', label: 'Nombre' },
      { key: 'person_type', label: 'Tipo de persona' },
    ]}
  />
}

export default ClientIdentificationTypesPage
