import {
  Routes,
  Route,
} from 'react-router-dom'

import MainPage from '../pages/MainPage'
import ActivateUser from '../components/ActivateUser'
import TenantRequired from '../components/TenantRequired'

import {
  obtenerTenantDesdeUrl,
} from '../utils/tenant'


function AppRoutes() {

  const tenant =
    obtenerTenantDesdeUrl()


  // ==========================
  // URL SIN TENANT
  // ==========================

  if (!tenant) {

    return <TenantRequired />

  }


  return (

    <Routes>

      {/* ========================== */}
      {/* ACTIVACIÓN DE USUARIO */}
      {/* ========================== */}

      <Route
        path="/:tenant/users/activate/:dni/:token"
        element={
          <ActivateUser />
        }
      />


      {/* ========================== */}
      {/* APLICACIÓN PRINCIPAL */}
      {/* ========================== */}

      <Route
        path="/:tenant"
        element={
          <MainPage />
        }
      />

    </Routes>

  )

}


export default AppRoutes