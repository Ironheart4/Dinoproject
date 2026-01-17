// main.tsx — Application entry point
// Responsibilities:
// - Bootstraps React app and mounts it to the DOM
// - Wraps the app in BrowserRouter (client-side routing)
// Note: Ensure `index.html` contains a div#root and that Vite build outputs are correctly deployed on Vercel
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
) 
