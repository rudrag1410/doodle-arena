import { ceil, clamp } from 'lodash-es'
import { COPY } from '../../constants/copy'
import { THEME, TIMER_THRESHOLDS } from '../../constants/theme'
import { MS_PER_SECOND } from '../../constants/timing'
const RING = { box: 60, centre: 30, radius: 24, stroke: 5 } as const
const CIRCUMFERENCE = 2 * Math.PI * RING.radius
const ringColor = (fraction: number) => {
  if (fraction > TIMER_THRESHOLDS.healthy) return THEME.mint
  if (fraction > TIMER_THRESHOLDS.warning) return THEME.sunny
  return THEME.tomato
}
export const TimerRing = ({ remainingMs, totalMs, urgent }: { remainingMs: number; totalMs: number; urgent?: boolean }) => {
  const fraction = totalMs > 0 ? clamp(remainingMs / totalMs, 0, 1) : 0
  const secs = ceil(remainingMs / MS_PER_SECOND)
  const hot = urgent && secs > 0 && secs <= TIMER_THRESHOLDS.urgentSeconds
  return (
    <div
      className={`relative grid size-12 place-items-center short:size-9 sm:size-14 ${hot ? 'animate-tick' : ''}`}
      role="timer"
      aria-label={COPY.game.timer(secs)}
    >
      <svg viewBox={`0 0 ${RING.box} ${RING.box}`} className="absolute inset-0 -rotate-90">
        <circle cx={RING.centre} cy={RING.centre} r={RING.radius} fill={THEME.cream} stroke={THEME.ink} strokeWidth={RING.stroke} />
        <circle
          cx={RING.centre}
          cy={RING.centre}
          r={RING.radius}
          fill="none"
          stroke={ringColor(fraction)}
          strokeWidth={RING.stroke}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          style={{ transition: 'stroke-dashoffset .25s linear, stroke .3s' }}
        />
      </svg>
      <span className="relative font-display text-lg font-bold sm:text-xl">{secs}</span>
    </div>
  )
}
