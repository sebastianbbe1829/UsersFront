import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTenantConfig } from '../contexts/TenantConfigContext'
import Can from './Can'

function ClientMenu({ rutaTenant, menuColapsado, obtenerClaseMenu }) {
  const { config } = useTenantConfig()
  const location = useLocation()
  const clientesPorRuta = location.pathname.includes('/clientes')
  const [clientesAbiertos, setClientesAbiertos] = useState(clientesPorRuta)
  const primaryColor = config?.primary_color || '#0d6efd'

  useEffect(() => {
    if (clientesPorRuta) setClientesAbiertos(true)
  }, [clientesPorRuta])

  return (
    <Can permission="CLIENT_READ">
      <button
        type="button"
        className={obtenerClaseMenu(clientesPorRuta)}
        onClick={() => setClientesAbiertos((valor) => !valor)}
        title="Clientes"
        style={{ background: 'transparent' }}
      >
        <span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>👤</span>
        {!menuColapsado && (
          <>
            <span className="ms-3 flex-grow-1 text-start">Clientes</span>
            <span>{clientesAbiertos ? '▾' : '▸'}</span>
          </>
        )}
      </button>

      {clientesAbiertos && !menuColapsado && (
        <div className="ps-3">
          <NavLink to={`${rutaTenant}/clientes/tipos-identificacion`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Tipos de Identificación" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}>
            <span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🪪</span>
            <span className="ms-3">Tipos de Identificación</span>
          </NavLink>

          <div className="px-3 py-2 text-uppercase small text-secondary fw-semibold">Demográfica</div>
          <div className="ps-3">
            <NavLink to={`${rutaTenant}/clientes/demografica/paises`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Países" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}>
              <span style={{ fontSize: '18px', minWidth: '24px', textAlign: 'center' }}>🌎</span>
              <span className="ms-3">Países</span>
            </NavLink>
            <NavLink to={`${rutaTenant}/clientes/demografica/departamentos`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Departamentos" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}>
              <span style={{ fontSize: '18px', minWidth: '24px', textAlign: 'center' }}>🗺️</span>
              <span className="ms-3">Departamentos</span>
            </NavLink>
            <NavLink to={`${rutaTenant}/clientes/demografica/ciudades`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Ciudades" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}>
              <span style={{ fontSize: '18px', minWidth: '24px', textAlign: 'center' }}>📍</span>
              <span className="ms-3">Ciudades</span>
            </NavLink>
          </div>

          <NavLink to={`${rutaTenant}/clientes`} end className={({ isActive }) => obtenerClaseMenu(isActive)} title="Clientes" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}>
            <span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>👥</span>
            <span className="ms-3">Clientes</span>
          </NavLink>

          <NavLink to={`${rutaTenant}/clientes/informes-listas-restrictivas`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Informes Listas Restrictivas" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}>
            <span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>📊</span>
            <span className="ms-3">Informes Listas Restrictivas</span>
          </NavLink>
        </div>
      )}

      {clientesAbiertos && menuColapsado && (
        <div className="border-top border-secondary border-bottom border-secondary">
          <NavLink to={`${rutaTenant}/clientes/tipos-identificacion`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Tipos de Identificación"><span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>🪪</span></NavLink>
          <NavLink to={`${rutaTenant}/clientes/demografica/paises`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Países"><span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>🌎</span></NavLink>
          <NavLink to={`${rutaTenant}/clientes/demografica/departamentos`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Departamentos"><span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>🗺️</span></NavLink>
          <NavLink to={`${rutaTenant}/clientes/demografica/ciudades`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Ciudades"><span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>📍</span></NavLink>
          <NavLink to={`${rutaTenant}/clientes`} end className={({ isActive }) => obtenerClaseMenu(isActive)} title="Clientes"><span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>👥</span></NavLink>
          <NavLink to={`${rutaTenant}/clientes/informes-listas-restrictivas`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Informes Listas Restrictivas"><span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>📊</span></NavLink>
        </div>
      )}
    </Can>
  )
}

export default ClientMenu
