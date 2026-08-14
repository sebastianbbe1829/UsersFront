import {
  Routes,
  Route,
} from 'react-router-dom'

import MainPage from '../pages/MainPage'
import ActivateUser from '../components/ActivateUser'


function AppRoutes() {

  return (

    <Routes>

      {/* ========================== */}
      {/* ACTIVACIÓN DE USUARIO */}
      {/* ========================== */}

      <Route
        path="/users/activate/:dni/:token"
        element={
          <ActivateUser />
        }
      />


      {/* ========================== */}
      {/* APLICACIÓN PRINCIPAL */}
      {/* ========================== */}

      <Route
        path="*"
        element={
          <MainPage />
        }
      />

    </Routes>

  )

}


export default AppRoutes