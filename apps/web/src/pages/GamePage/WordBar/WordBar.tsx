import { Check } from 'lucide-react'
import { toUpper } from 'lodash-es'
import { HINTS, Phase, type RoomView } from '@doodle/shared'

import { COPY } from '@/constants/copy'
import { HintChar } from '../HintChar'

export const WordBar = ({ view }: { view: RoomView }) => {
  const isDrawer = view.drawerId === view.youId
  const guessed = !!view.players.find((p) => p.id === view.youId)?.guessed

  if (view.phase === Phase.Drawing && view.hint) {
    if (view.word) {
      return (
        <div className="flex flex-wrap items-center justify-center gap-x-3">
          <span className="label">{isDrawer ? COPY.game.drawThis : COPY.game.theWord}</span>
          <span className="font-display text-2xl font-bold tracking-wide sm:text-4xl">{toUpper(view.word)}</span>
          {!isDrawer && guessed && <Check size="1.625rem" strokeWidth={4} className="text-mint" />}
        </div>
      )
    }

    const chars = [...view.hint]

    return (
      <div className="flex flex-wrap items-end justify-center gap-x-1 gap-y-1 sm:gap-x-1.5" aria-label={COPY.game.hintLabel(chars.length)}>
        {chars.map((ch, i) => (
          <HintChar key={i} ch={ch} />
        ))}
        <span className="mb-0.5 ml-2 font-display text-base font-semibold text-ink-soft sm:text-lg">
          {chars.filter((c) => c !== HINTS.separatorChar).length}
        </span>
      </div>
    )
  }

  if (view.phase === Phase.Choosing)
    return <div className="text-center font-display text-lg font-semibold text-ink-soft sm:text-xl">{COPY.game.pickingWord}</div>

  if (view.phase === Phase.TurnEnd && view.turnResult) {
    return (
      <div className="flex items-center justify-center gap-3">
        <span className="label">{COPY.game.wordWas}</span>
        <span className="font-display text-2xl font-bold sm:text-4xl">{toUpper(view.turnResult.word)}</span>
      </div>
    )
  }

  return null
}
