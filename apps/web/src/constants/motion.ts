export const SPRING = {
  gentle: { type: 'spring', stiffness: 160, damping: 18 },
  card: { type: 'spring', stiffness: 260, damping: 20 },
  row: { type: 'spring', stiffness: 380, damping: 32 },
  podium: { type: 'spring', stiffness: 160, damping: 16 },
} as const

export const STAGGER_MS = 0.08
export const ENTRY_DELAY_S = 0.1
export const STEP_BASE_DELAY_S = 0.25
export const FADE_S = 0.18
