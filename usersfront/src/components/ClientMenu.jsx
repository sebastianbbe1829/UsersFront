import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTenantConfig } from '../contexts/TenantConfigContext'
import Can from './Can'

function ClientMenu({ rutaTenant, menuColapsado, obtenerClaseMenu, onOpenSection }) {
  const { config } = useTenantConfig()
  const location = useLocation()
  const clientesPorRuta = location.pathname.includes('/clientes')
  const primaryColor = config?.primary_color || '#0d6efd'
  const [abierto, setAbierto] = useState(clientesPorRuta)

  useEffect(() => {
    if (clientesPorRuta) setAbierto(true)
  }, [clientesPorRuta])

  useEffect(() => {
    const nav = document.querySelector('aside nav')
    if (!nav) return undefined

    const sincronizarConOtrasSecciones = () => {
      const botones = Array.from(nav.querySelectorAll('button'))
      const otraSeccionAbierta = botones.some((boton) => {
        const texto = boton.textContent?.trim() || ''
        return (texto.startsWith('Extintores') || texto.startsWith('Administración')) && texto.includes('▾')
      })
      if (otraSeccionAbierta) setAbierto(false)
    }

    sincronizarConOtrasSecciones()
    const observer = new MutationObserver(sincronizarConOtrasSecciones)
    observer.observe(nav, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [clientesPorRuta])

  const alternarClientes = () => {
    const nuevoEstado = !abierto
    setAbierto(nuevoEstado)
    if (nuevoEstado) onOpenSection?.('clientes')
  }

  return (
    <Can permission="CLIENT_READ">
      <button type="button" className={obtenerClaseMenu(clientesPorRuta)} onClick={alternarClientes} title="Clientes" style={{ background: 'transparent' }}>
        <span style={{ fontSize: '21px', minWidth: '24px', textAlign: 'center' }}>👤</span>
        {!menuColapsado && <><span className="ms-3 flex-grow-1 text-start">Clientes</span><span>{abierto ? '▾' : '▸'}</span></>}
      </button>

      {abierto && !menuColapsado && (
        <div className="ps-3">
          <NavLink to={`${rutaTenant}/clientes/tipos-identificacion`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Tipos de Identificación" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🪪</span><span className="ms-3">Tipos de Identificación</span></NavLink>
          <NavLink to={`${rutaTenant}/clientes/demografica/paises`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Países" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🌎</span><span className="ms-3">Países</span></NavLink>
          <NavLink to={`${rutaTenant}/clientes/demografica/departamentos`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Departamentos" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>🗺️</span><span className="ms-3">Departamentos</span></NavLink>
          <NavLink to={`${rutaTenant}/clientes/demografica/ciudades`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Ciudades" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>📍</span><span className="ms-3">Ciudades</span></NavLink>
          <NavLink to={`${rutaTenant}/clientes`} end className={({ isActive }) => obtenerClaseMenu(isActive)} title="Clientes" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>👥</span><span className="ms-3">Clientes</span></NavLink>
          <NavLink to={`${rutaTenant}/clientes/informes-listas-restrictivas`} className={({ isActive }) => obtenerClaseMenu(isActive)} title="Informes Listas Restrictivas" style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : undefined)}><span style={{ fontSize: '19px', minWidth: '24px', textAlign: 'center' }}>📊</span><span className="ms-3">Informes Listas Restrictivas</span></NavLink>
        </div>
      )}
    </Can>
  )
}

export default ClientMenu
