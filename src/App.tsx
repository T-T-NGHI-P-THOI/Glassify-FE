import './App.css'
import { BrowserRouter } from 'react-router-dom'
import RouteComponent from './routes'
import AuthProvider from './auth/AuthProvider'
import { Layout } from './layouts/Layout'
import { LayoutProvider } from './layouts/LayoutContext'
import CartProvider from './contexts/CartProvider'
import { ToastContainer } from 'react-toastify'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <LayoutProvider>
            <ToastContainer
              position="bottom-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnHover
              draggable
              theme="light"
            />
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