import './App.css'
import { BrowserRouter } from 'react-router-dom'
import RouteComponent from './routes'
import AuthProvider from './auth/AuthProvider'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RouteComponent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
