import { type PublicPlayer } from '@doodle/shared'

import { THEME } from '@/constants/theme'

export const rowTone = (p: PublicPlayer, drawing: boolean) => {
  if (p.guessed) return 'bg-mint/25'

  return drawing ? 'bg-sunny/50' : 'bg-white'
}

export const avatarRing = (p: PublicPlayer, drawing: boolean) => {
  if (drawing) return THEME.sunny

  return p.guessed ? THEME.mint : undefined
}
