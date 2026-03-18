import './App.css'
import { BrowserRouter } from 'react-router-dom'
import RouteComponent from './routes'
import AuthProvider from './auth/AuthProvider'
import { Layout } from './layouts/Layout'
import { LayoutProvider } from './layouts/LayoutContext'
import CartProvider from './contexts/CartProvider'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <LayoutProvider>
            <Layout>
              <RouteComponent />
            </Layout>
          </LayoutProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App