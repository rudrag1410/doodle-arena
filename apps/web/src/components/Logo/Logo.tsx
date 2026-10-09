import clsx from 'clsx'

import { COPY } from '@/constants/copy'
import { THEME } from '@/constants/theme'

const SIZES = {
  md: { icon: 'size-9', text: 'text-2xl' },
  lg: { icon: 'size-10 sm:size-16 short:sm:size-9', text: 'text-3xl sm:text-6xl short:sm:text-3xl' },
} as const

export const Logo = ({ size = 'md' }: { size?: keyof typeof SIZES }) => {
  const { icon, text } = SIZES[size]

  return (
    <div className="inline-flex items-center gap-3 select-none">
      <svg viewBox="0 0 64 64" className={clsx('animate-wiggle drop-shadow-[3px_3px_0_#1d1b3a]', icon)} aria-hidden>
        <rect x="3" y="3" width="58" height="58" rx="16" fill={THEME.sunny} stroke={THEME.ink} strokeWidth="4" />
        <path d="M16 46 L40 15 L50 23 L26 54 L13 56 Z" fill="#fff7ea" stroke={THEME.ink} strokeWidth="4" strokeLinejoin="round" />
        <path d="M36 20 L46 28" stroke={THEME.ink} strokeWidth="4" />
        <path d="M13 56 L16 46 L26 54 Z" fill={THEME.tomato} stroke={THEME.ink} strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <span className={clsx('font-display leading-none font-bold', text)}>
        {COPY.brand.first}
        <span className="text-tomato">{COPY.brand.second}</span>
      </span>
    </div>
  )
}
