import { NavLink, useLocation } from 'react-router-dom'
import { useTenantConfig } from '../contexts/TenantConfigContext'
import Can from './Can'

function ClientMenu({ rutaTenant, menuColapsado, obtenerClaseMenu, abierto, onToggleSection }) {
  const { config } = useTenantConfig()
  const location = useLocation()
  const clientesPorRuta = location.pathname.includes('/clientes')
  const primaryColor = config?.primary_color || '#0d6efd'

  const obtenerClaseCompacta = (activo = false) =>
    `d-flex align-items-center justify-content-center text-decoration-none py-2 border-0 rounded-0 w-100 ${activo ? 'text-white' : 'bg-dark text-white'}`

  return (
    <Can permission="CLIENT_READ">
      <button type="button" className={obtenerClaseMenu(clientesPorRuta)} onClick={onToggleSection} title="Clientes" style={{ background: 'transparent' }}>
        <span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>👤</span>
        {!menuColapsado && <><span className="ms-3 flex-grow-1 text-start">Clientes</span><span>{abierto ? '▾' : '▸'}</span></>}
      </button>

      {abierto && (
        <div className={menuColapsado ? 'd-flex flex-column align-items-center' : 'ps-3'}>
          <NavLink to={`${rutaTenant}/clientes/tipos-identificacion`} className={({ isActive }) => menuColapsado ? obtenerClaseCompacta(isActive) : obtenerClaseMenu(isActive)} title="Tipos de Identificación" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}>
            <span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🪪</span>{!menuColapsado && <span className="ms-3">Tipos de Identificación</span>}
          </NavLink>
          <NavLink to={`${rutaTenant}/clientes/demografica/paises`} className={({ isActive }) => menuColapsado ? obtenerClaseCompacta(isActive) : obtenerClaseMenu(isActive)} title="Países" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}>
            <span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🌎</span>{!menuColapsado && <span className="ms-3">Países</span>}
          </NavLink>
          <NavLink to={`${rutaTenant}/clientes/demografica/departamentos`} className={({ isActive }) => menuColapsado ? obtenerClaseCompacta(isActive) : obtenerClaseMenu(isActive)} title="Departamentos" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}>
            <span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🗺️</span>{!menuColapsado && <span className="ms-3">Departamentos</span>}
          </NavLink>
          <NavLink to={`${rutaTenant}/clientes/demografica/ciudades`} className={({ isActive }) => menuColapsado ? obtenerClaseCompacta(isActive) : obtenerClaseMenu(isActive)} title="Ciudades" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}>
            <span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>📍</span>{!menuColapsado && <span className="ms-3">Ciudades</span>}
          </NavLink>
          <NavLink to={`${rutaTenant}/clientes`} end className={({ isActive }) => menuColapsado ? obtenerClaseCompacta(isActive) : obtenerClaseMenu(isActive)} title="Clientes" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}>
            <span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>👥</span>{!menuColapsado && <span className="ms-3">Clientes</span>}
          </NavLink>
          <NavLink to={`${rutaTenant}/clientes/informes-listas-restrictivas`} className={({ isActive }) => menuColapsado ? obtenerClaseCompacta(isActive) : obtenerClaseMenu(isActive)} title="Informes Listas Restrictivas" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}>
            <span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>📊</span>{!menuColapsado && <span className="ms-3">Informes Listas Restrictivas</span>}
          </NavLink>
        </div>
      )}
    </Can>
  )
}

export default ClientMenu
