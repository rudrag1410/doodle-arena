import { THEME, TIMER_THRESHOLDS } from '@/constants/theme'

export const ringColor = (fraction: number) => {
  if (fraction > TIMER_THRESHOLDS.healthy) return THEME.mint
  if (fraction > TIMER_THRESHOLDS.warning) return THEME.sunny

  return THEME.tomato
}
