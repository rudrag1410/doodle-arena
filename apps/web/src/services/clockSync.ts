import { minBy, times } from 'lodash-es'
import { ClientEvent } from '@doodle/shared'

import { CLOCK_SYNC_GAP_MS, CLOCK_SYNC_SAMPLES } from '@/constants/timing'
import { socket } from './socket'

interface ClockEstimate {
  offset: number
  rtt: number
}

const sample = async (): Promise<ClockEstimate> => {
  const t0 = performance.now()
  const wall0 = Date.now()
  const serverNow = await new Promise<number>((resolve) => socket.emit(ClientEvent.TimeSync, resolve))
  const rtt = performance.now() - t0

  return { rtt, offset: serverNow + rtt / 2 - (wall0 + rtt) }
}

export const estimateClock = async (): Promise<ClockEstimate> => {
  const samples: ClockEstimate[] = []

  for (const _ of times(CLOCK_SYNC_SAMPLES)) {
    samples.push(await sample())
    await new Promise((r) => setTimeout(r, CLOCK_SYNC_GAP_MS))
  }

  return minBy(samples, 'rtt') ?? { rtt: 0, offset: 0 }
}
