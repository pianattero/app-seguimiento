import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { db, requestPersistentStorage } from './lib/db'
import { watchDb } from './lib/dbStatus'
import './index.css'

watchDb(db)
requestPersistentStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
