import { random } from 'lodash-es'

import { THEME } from '@/constants/theme'

export const makePiece = (i: number) => ({
  x: random(100, true),
  delay: random(1.2, true),
  dur: random(2.6, 4.8, true),
  rot: random(-450, 450, true),
  drift: random(-80, 80, true),
  w: random(7, 14, true),
  color: THEME.confetti[i % THEME.confetti.length],
  round: random(1, true) > 0.6,
})
