import { THEME } from '@/constants/theme'
import { DOODLES } from '@/constants/doodles'

export const Doodles = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden max-sm:hidden" aria-hidden>
    {DOODLES.map(({ color, className, rotation, delay, shape }) => (
      <svg
        key={className}
        viewBox="0 0 64 64"
        className={`animate-float absolute size-12 lg:size-20 ${className}`}
        style={{ ['--r' as string]: rotation, animationDelay: delay, fill: color, stroke: THEME.ink, strokeWidth: 3, strokeLinejoin: 'round' }}
      >
        {shape}
      </svg>
    ))}
  </div>
)
