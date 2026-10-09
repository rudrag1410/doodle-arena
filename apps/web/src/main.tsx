import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import 'tldraw/tldraw.css'
import './index.css'

import { App } from './App'
import { queryClient } from '@/services/api'

const ROOT_ID = 'root'

createRoot(document.getElementById(ROOT_ID)!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
