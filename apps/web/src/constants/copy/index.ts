import { COMMON_COPY } from './common'
import { GAME_COPY } from './game'
import { HOME_COPY } from './home'
import { LOBBY_COPY } from './lobby'
import { RESULTS_COPY } from './results'

export const COPY = {
  ...COMMON_COPY,
  ...HOME_COPY,
  ...LOBBY_COPY,
  ...GAME_COPY,
  ...RESULTS_COPY,
} as const
