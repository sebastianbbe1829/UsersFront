import ClientCatalogCrudPage from './ClientCatalogCrudPage'
import {
  obtenerPaisesCliente,
  crearPaisCliente,
  actualizarPaisCliente,
  eliminarPaisCliente,
} from '../services/clientsApi'

function CountriesPage() {
  return <ClientCatalogCrudPage
    title="Países"
    description="Catálogo geográfico de países. Colombia es el primer país habilitado y el origen de la jerarquía demográfica."
    loader={obtenerPaisesCliente}
    createItem={crearPaisCliente}
    updateItem={actualizarPaisCliente}
    deleteItem={eliminarPaisCliente}
    columns={[
      { key: 'code', label: 'Alpha-2' },
      { key: 'name', label: 'Nombre' },
      { key: 'alpha3_code', label: 'Alpha-3' },
      { key: 'numeric_code', label: 'Numérico' },
      { key: 'independent', label: 'Independiente', render: (item) => item.independent ? 'Sí' : 'No' },
      { key: 'active', label: 'Activo', render: (item) => item.active ? 'Sí' : 'No' },
    ]}
    formFields={[
      { key: 'code', label: 'Código Alpha-2', required: true },
      { key: 'name', label: 'Nombre corto', required: true },
      { key: 'short_name_lower', label: 'Nombre corto (minúsculas)' },
      { key: 'full_name', label: 'Nombre completo', colClass: 'col-md-12' },
      { key: 'alpha3_code', label: 'Código Alpha-3' },
      { key: 'numeric_code', label: 'Código numérico', type: 'number' },
      { key: 'territory_name', label: 'Nombre del territorio', colClass: 'col-md-12' },
      { key: 'status', label: 'Estado' },
      { key: 'remarks', label: 'Observaciones', colClass: 'col-md-12' },
      { key: 'independent', label: 'Independiente', type: 'checkbox', defaultValue: true },
      { key: 'active', label: 'Activo', type: 'checkbox', defaultValue: true },
    ]}
  />
}

export default CountriesPage
