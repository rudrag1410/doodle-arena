import { useEffect, useRef } from 'react'
import { ChatKind, Phase, type RoomView } from '@doodle/shared'

import { TICK_FROM_MS } from '@/constants/sound'
import { SoundEffect } from '@/enums'
import { playSound } from '@/services/sound'
import { useGame } from '@/store'
import { useRemaining } from './useRemaining'
import { phaseSound } from '@/utils/sound'

const MS_PER_SECOND = 1000

export const useGameSounds = (view: RoomView) => {
  const lastChatId = useRef(useGame.getState().chat.at(-1)?.id)
  const phase = useRef(view.phase)
  const players = useRef(view.players.length)
  const lastSecond = useRef<number | null>(null)
  const remaining = useRemaining(view.phase === Phase.Drawing ? view.phaseEndsAt : null)

  useEffect(
    () =>
      useGame.subscribe((state) => {
        const message = state.chat.at(-1)

        if (!message || message.id === lastChatId.current) return

        lastChatId.current = message.id

        const mine = message.playerId === view.youId

        if (message.kind === ChatKind.Correct) playSound(mine ? SoundEffect.Success : SoundEffect.Correct)
        else if (message.kind === ChatKind.Close) playSound(SoundEffect.Close)
        else if (message.kind === ChatKind.Chat && !mine) playSound(SoundEffect.Pop)
      }),
    [view.youId],
  )

  useEffect(() => {
    if (phase.current === view.phase) return

    phase.current = view.phase

    const effect = phaseSound(view)

    if (effect) playSound(effect)
  }, [view])

  useEffect(() => {
    if (view.phase !== Phase.Lobby) {
      players.current = view.players.length

      return
    }

    if (view.players.length > players.current) playSound(SoundEffect.Join)
    else if (view.players.length < players.current) playSound(SoundEffect.Leave)

    players.current = view.players.length
  }, [view.phase, view.players.length])

  useEffect(() => {
    if (view.phase !== Phase.Drawing || remaining <= 0 || remaining > TICK_FROM_MS) {
      lastSecond.current = null

      return
    }

    const second = Math.ceil(remaining / MS_PER_SECOND)

    if (second === lastSecond.current) return

    lastSecond.current = second
    playSound(SoundEffect.Tick)
  }, [remaining, view.phase])
}
