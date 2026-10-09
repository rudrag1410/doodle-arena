import { Phase, type RoomView } from '@doodle/shared'

import { SoundEffect } from '@/enums'

export const phaseSound = (view: RoomView): SoundEffect | null => {
  switch (view.phase) {
    case Phase.Choosing:
      return view.drawerId === view.youId ? SoundEffect.YourTurn : null
    case Phase.Drawing:
      return SoundEffect.Start
    case Phase.TurnEnd:
      return SoundEffect.TurnEnd
    case Phase.GameEnd:
      return view.ranking?.find((r) => r.playerId === view.youId)?.rank === 1 ? SoundEffect.Win : SoundEffect.GameOver
    default:
      return null
  }
}
