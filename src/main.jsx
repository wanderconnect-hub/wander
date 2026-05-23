import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TravelProvider } from './context.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TravelProvider>
      <App />
    </TravelProvider>
  </StrictMode>,
)
