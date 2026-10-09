import { Phase, type RoomView } from '@doodle/shared'

import { COPY } from '@/constants/copy'

export const placeholderFor = (view: RoomView, guessed: boolean): string => {
  if (view.phase !== Phase.Drawing) return COPY.chat.placeholderLobby
  if (view.drawerId === view.youId) return COPY.chat.placeholderDrawer

  return guessed ? COPY.chat.placeholderGuessed : COPY.chat.placeholderGuessing
}
