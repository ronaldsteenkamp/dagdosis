import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource-variable/manrope/wght.css'
import './styles/app.css'
import { App } from './App'
// Vroeg laden: Chrome stuurt zijn installatievraag vaak al voordat de app getekend is.
import './logica/installatie'

// Laadt een nieuwe versie vanzelf zodra die binnen is, dus je hoeft de app niet twee keer te openen.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
