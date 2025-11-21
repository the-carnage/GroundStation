import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import GroundStation from './GroundStation.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GroundStation />
  </StrictMode>,
)
