import type { ReactNode } from 'react'

export const DOODLE_COLORS = { star: '#ffc93c', circle: '#4cb8ff', squiggle: '#25c9a6', heart: '#ff8fc7', triangle: '#7c5cff' } as const

export interface FloatingDoodle {
  color: string
  className: string
  rotation: string
  delay: string
  shape: ReactNode
}

export const DOODLES: FloatingDoodle[] = [
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
