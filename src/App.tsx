import './App.css'
import { BrowserRouter } from 'react-router-dom'
import RouteComponent from './routes'
import AuthProvider from './auth/AuthProvider'
import CartProvider from './contexts/CartProvider'
import { Layout } from './layouts/Layout'
import { LayoutProvider } from './layouts/LayoutContext'

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