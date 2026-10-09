import { motion } from 'motion/react'
import { Home as HomeIcon, RefreshCw, TriangleAlert } from 'lucide-react'
import type { FallbackProps } from 'react-error-boundary'

import { COPY } from '@/constants/copy'
import { Screen } from '../Screen'

const goHome = () => window.location.assign('/')
const reload = () => window.location.reload()

export const CrashScreen = ({ error, resetErrorBoundary }: FallbackProps) => (
  <Screen className="items-center justify-center p-6">
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card max-w-md p-8 text-center" role="alert">
      <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full border-(length:--border-width) border-ink bg-sunny">
        <TriangleAlert size="2rem" />
      </div>
      <h1 className="text-3xl font-bold">{COPY.crash.title}</h1>
      <p className="mt-2 font-semibold text-ink-soft">{COPY.crash.body}</p>
      {import.meta.env.DEV && <pre className="mt-3 overflow-auto rounded-lg bg-cream p-2 text-left text-xs">{String(error)}</pre>}
      <div className="mt-6 flex justify-center gap-3">
        <button className="btn" onClick={goHome}>
          <HomeIcon size="1.125rem" /> {COPY.common.backHome}
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetErrorBoundary()
            reload()
          }}
        >
          <RefreshCw size="1.125rem" /> {COPY.crash.reload}
        </button>
      </div>
    </motion.div>
  </Screen>
)
