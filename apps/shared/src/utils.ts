import { clamp, isFinite, round } from 'lodash-es'

export const clampInt = (value: unknown, lo: number, hi: number, fallback: number): number =>
  isFinite(value) ? clamp(round(value as number), lo, hi) : fallback
