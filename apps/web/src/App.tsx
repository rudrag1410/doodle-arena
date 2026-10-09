import { ErrorBoundary } from 'react-error-boundary'
import { useLocation } from 'wouter'

import { ConnectionBanner, CrashScreen, Toasts } from '@/components'
import { AppRouter } from '@/router'

export const App = () => {
  const [location] = useLocation()

  return (
    <ErrorBoundary FallbackComponent={CrashScreen} resetKeys={[location]}>
      <AppRouter />
      <Toasts />
      <ConnectionBanner />
    </ErrorBoundary>
  )
}
