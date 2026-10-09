import { Loader2 } from 'lucide-react'

import { Logo } from '../Logo'
import { Screen } from '../Screen'

export const Splash = ({ text }: { text: string }) => (
  <Screen className="items-center justify-center gap-5 p-6">
    <Logo />
    <div className="card flex items-center gap-3 px-5 py-3 font-display text-lg font-semibold">
      <Loader2 className="animate-spin" /> {text}
    </div>
  </Screen>
)
