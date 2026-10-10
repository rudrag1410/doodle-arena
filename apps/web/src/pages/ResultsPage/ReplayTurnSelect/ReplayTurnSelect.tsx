import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { groupBy } from 'lodash-es'
import type { ReplayTurn } from '@doodle/shared'

import { Avatar } from '@/components'
import { COPY } from '@/constants/copy'
import { AVATAR_SIZE } from '@/constants/ui'

interface Props {
  turns: ReplayTurn[]
  index: number
  onChange: (index: number) => void
}

const TurnLabel = ({ turn }: { turn: ReplayTurn }) => (
  <span className="flex min-w-0 items-center gap-2">
    <Avatar index={turn.drawerAvatar} size={AVATAR_SIZE.replayTurn} />
    <span className="flex min-w-0 flex-col text-left leading-tight">
      <span className="truncate font-display text-base font-semibold">{turn.word}</span>
      <span className="truncate text-xs font-bold text-ink-soft">{COPY.replay.drawnBy(turn.drawerName)}</span>
    </span>
  </span>
)

export const ReplayTurnSelect = ({ turns, index, onChange }: Props) => {
  const rounds = groupBy(
    turns.map((turn, i) => ({ turn, i })),
    ({ turn }) => turn.round,
  )

  return (
    <Select.Root value={String(index)} onValueChange={(value) => onChange(Number(value))}>
      <Select.Trigger
        aria-label={COPY.replay.turns}
        className="input flex shrink-0 items-center justify-between gap-2 !py-1.5 data-[state=open]:border-sky"
      >
        <span className="min-w-0 flex-1">{turns[index] && <TurnLabel turn={turns[index]} />}</span>
        <span className="chip !cursor-default !px-2 !py-0.5 text-xs">{COPY.replay.turnCount(index + 1, turns.length)}</span>
        <Select.Icon>
          <ChevronDown size="1.25rem" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          collisionPadding={12}
          className="card z-50 w-(--radix-select-trigger-width) overflow-hidden !bg-cream p-1.5"
        >
          <Select.Viewport className="max-h-[min(22rem,var(--radix-select-content-available-height))] overflow-y-auto">
            {Object.entries(rounds).map(([round, entries]) => (
              <Select.Group key={round}>
                <Select.Label className="label px-2 pt-2 pb-1">{COPY.replay.roundHeading(Number(round))}</Select.Label>

                {entries.map(({ turn, i }) => (
                  <Select.Item
                    key={`${turn.round}-${turn.drawerId}-${turn.word}`}
                    value={String(i)}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-2 py-1.5 outline-none data-[highlighted]:bg-sunny/40 data-[state=checked]:bg-sky/25"
                  >
                    <Select.ItemText>
                      <TurnLabel turn={turn} />
                    </Select.ItemText>
                    <Select.ItemIndicator>
                      <Check size="1.125rem" strokeWidth={3} />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Group>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
