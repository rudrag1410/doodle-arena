import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import 'tldraw/tldraw.css'
import './index.css'

import { App } from './App'
import { queryClient } from '@/services/api'

const ROOT_ID = 'root'

const rootElement = document.getElementById(ROOT_ID)

if (!rootElement) throw new Error(`#${ROOT_ID} element is missing from index.html`)

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
