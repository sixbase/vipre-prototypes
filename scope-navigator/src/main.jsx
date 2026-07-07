import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PasswordGate from './PasswordGate.jsx'
import SymphonyShell from './shell/SymphonyShell.jsx'
import MspShell from './shell/MspShell.jsx'
import MspShellV2 from './shell/MspShellV2.jsx'

// Gated "corners": the Symphony × Scope shell at ?view=shell (horizontal scope bar),
// the MSP shell at ?view=msp (scope navigator as a vertical breadcrumb in the
// left nav, frozen for reference), and its iteration copy at ?view=msp2.
// Everything else is the existing app, untouched.
const params = new URLSearchParams(window.location.search)
const cleanPath = window.location.pathname.replace(/\/+$/, '')
const isMsp2 = params.get('view') === 'msp2' || cleanPath.endsWith('/msp2')
const isMsp = !isMsp2 && (params.get('view') === 'msp' || cleanPath.endsWith('/msp'))
const isShell = params.get('view') === 'shell' || cleanPath.endsWith('/shell')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PasswordGate>
      {isMsp2 ? <MspShellV2 /> : isMsp ? <MspShell /> : isShell ? <SymphonyShell /> : <App />}
    </PasswordGate>
  </StrictMode>,
)
