export const TOAST_MS = 3500
export const TOASTS_VISIBLE = 4
export const CHAT_KEEP = 150
export const CLOCK_SYNC_SAMPLES = 5
export const CLOCK_SYNC_GAP_MS = 60
export const COUNTDOWN_TICK_MS = 200
export const COPIED_FLASH_MS = 1800
export const SETTINGS_DEBOUNCE_MS = 220
export const BOARD_FLUSH_MS = 30
export const RESYNC_MIN_GAP_MS = 1500
export const RECONNECT_RESYNC_DELAY_MS = 400
export const CONFETTI_PIECES = 70

export { MS_PER_SECOND } from '@doodle/shared'

export const RECONNECT = { delayMs: 250, maxDelayMs: 2500, randomization: 0.3 } as const
export const STROKE_REPLAY = { maxIdleMs: 700, minStrokeMs: 220, maxStrokeMs: 2600, tailMs: 600 } as const
