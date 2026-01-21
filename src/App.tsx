import './App.css'
import { BrowserRouter } from 'react-router-dom'
import RouteComponent from './routes'
import AuthProvider from './auth/AuthProvider'
import { Layout } from './layouts/Layout'
import { LayoutProvider } from './layouts/LayoutContext'
import { CssBaseline } from '@mui/material'
import ProductDetailPage from './pages/ProductDetailPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LayoutProvider>
          <Layout>
            <RouteComponent />
          </Layout>
        </LayoutProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App