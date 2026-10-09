import { Phase } from '@doodle/shared'
import { containsAnswer, isClose } from './guess'
import type { Player } from './types'

export type ChatRoute = { type: 'open'; close: boolean } | { type: 'secret' } | { type: 'correct' }

interface ChatContext {
  phase: Phase
  word: string | null
  drawerId: string | null
}

export const routeChat = ({ phase, word, drawerId }: ChatContext, sender: Player, text: string): ChatRoute => {
  if (phase !== Phase.Drawing || !word) return { type: 'open', close: false }
  if (sender.id === drawerId || sender.guessed) return { type: 'secret' }
  if (containsAnswer(text, word)) return { type: 'correct' }

  return { type: 'open', close: isClose(text, word) }
}
