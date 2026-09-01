import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import './styles/extinguishers-mobile.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { TenantConfigProvider } from './contexts/TenantConfigContext'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TenantConfigProvider>
          <App />
        </TenantConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
