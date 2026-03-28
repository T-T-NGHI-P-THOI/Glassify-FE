import './App.css'
import { BrowserRouter } from 'react-router-dom'
import RouteComponent from './routes'
import AuthProvider from './auth/AuthProvider'
import { Layout } from './layouts/Layout'
import { LayoutProvider } from './layouts/LayoutContext'
import CartProvider from './contexts/CartProvider'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

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
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        style={{ zIndex: 99999 }}
      />
    </BrowserRouter>
  )
}

export default App