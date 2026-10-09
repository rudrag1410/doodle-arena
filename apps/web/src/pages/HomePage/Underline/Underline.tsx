import { THEME } from '@/constants/theme'

export const Underline = () => (
  <svg viewBox="0 0 120 12" className="absolute -bottom-2 left-0 w-full" preserveAspectRatio="none" aria-hidden>
    <path d="M2 8 Q 20 1 40 7 T 78 6 T 118 5" fill="none" stroke={THEME.tomato} strokeWidth="4" strokeLinecap="round" />
  </svg>
)
