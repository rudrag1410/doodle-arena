import { useState } from 'react'
import { useInterval } from 'usehooks-ts'

import { COUNTDOWN_TICK_MS } from '@/constants/timing'
import { serverNow } from '@/store'

export const useRemaining = (endsAt: number | null): number => {
  const [now, setNow] = useState(serverNow)

  useInterval(() => setNow(serverNow()), endsAt ? COUNTDOWN_TICK_MS : null)

  return endsAt ? Math.max(0, endsAt - now) : 0
}
