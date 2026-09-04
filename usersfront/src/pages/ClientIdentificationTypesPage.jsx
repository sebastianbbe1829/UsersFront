import ClientCatalogCrudPage from './ClientCatalogCrudPage'
import {
  obtenerTiposIdentificacionCliente,
  crearTipoIdentificacionCliente,
  actualizarTipoIdentificacionCliente,
  eliminarTipoIdentificacionCliente,
} from '../services/clientsApi'

function ClientIdentificationTypesPage() {
  return <ClientCatalogCrudPage
    title="Tipos de Identificación"
    description="Catálogo de tipos de identificación disponibles para los clientes."
    loader={obtenerTiposIdentificacionCliente}
    createItem={crearTipoIdentificacionCliente}
    updateItem={actualizarTipoIdentificacionCliente}
    deleteItem={eliminarTipoIdentificacionCliente}
    columns={[
      { key: 'code', label: 'Código' },
      { key: 'name', label: 'Nombre' },
      { key: 'person_type', label: 'Tipo de persona' },
      { key: 'active', label: 'Activo', render: (item) => item.active ? 'Sí' : 'No' },
    ]}
    formFields={[
      { key: 'code', label: 'Código', required: true, disabledWhenEditing: true },
      { key: 'name', label: 'Nombre', required: true },
      { key: 'person_type', label: 'Tipo de persona', type: 'select', required: true, disabledWhenEditing: true, options: [{ value: 'NATURAL', label: 'Natural' }, { value: 'JURIDICA', label: 'Jurídica' }] },
      { key: 'active', label: 'Activo', type: 'checkbox', defaultValue: true },
    ]}
  />
}

export default ClientIdentificationTypesPage
