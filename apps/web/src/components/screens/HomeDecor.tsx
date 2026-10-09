import type { ReactNode } from 'react'
import { THEME } from '../../constants/theme'
const DOODLE_COLORS = { star: '#ffc93c', circle: '#4cb8ff', squiggle: '#25c9a6', heart: '#ff8fc7', triangle: '#7c5cff' } as const
interface FloatingDoodle {
  color: string
  className: string
  rotation: string
  delay: string
  shape: ReactNode
}
const DOODLES: FloatingDoodle[] = [
  {
    color: DOODLE_COLORS.star,
    className: 'left-[4%] top-[8%]',
    rotation: '-12deg',
    delay: '0s',
    shape: <path d="M32 4l8 18 20 2-15 13 5 20-18-10-18 10 5-20L4 24l20-2z" />,
  },
  { color: DOODLE_COLORS.circle, className: 'right-[5%] top-[10%]', rotation: '10deg', delay: '1.2s', shape: <circle cx="32" cy="32" r="24" /> },
  {
    color: DOODLE_COLORS.squiggle,
    className: 'left-[6%] bottom-[8%]',
    rotation: '8deg',
    delay: '2.1s',
    shape: <path d="M6 40 Q 18 6 32 34 T 58 28" fill="none" strokeWidth="7" strokeLinecap="round" />,
  },
  {
    color: DOODLE_COLORS.heart,
    className: 'right-[6%] bottom-[8%]',
    rotation: '-8deg',
    delay: '0.6s',
    shape: <path d="M32 58C8 40 4 24 14 14c8-8 16-2 18 4 2-6 10-12 18-4 10 10 6 26-18 44z" />,
  },
  {
    color: DOODLE_COLORS.triangle,
    className: 'left-[44%] bottom-[4%] hidden lg:block',
    rotation: '4deg',
    delay: '1.6s',
    shape: <path d="M8 52L32 8l24 44z" />,
  },
]
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
export const Underline = () => (
  <svg viewBox="0 0 120 12" className="absolute -bottom-2 left-0 w-full" preserveAspectRatio="none" aria-hidden>
    <path d="M2 8 Q 20 1 40 7 T 78 6 T 118 5" fill="none" stroke={THEME.tomato} strokeWidth="4" strokeLinecap="round" />
  </svg>
)
