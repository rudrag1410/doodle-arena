import { ConnectionBanner, Toasts } from '@/components'
import { AppRouter } from '@/router'

export const App = () => (
  <>
    <AppRouter />
    <Toasts />
    <ConnectionBanner />
  </>
)
