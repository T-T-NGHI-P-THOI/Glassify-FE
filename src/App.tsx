import { useState } from 'react'
import './App.css'
import { BrowserRouter } from 'react-router-dom'
import RouteComponent from './routes'

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <RouteComponent />
    </BrowserRouter>
  )
}

export default App
