import { useState } from 'react'
import { useStickToBottom } from 'use-stick-to-bottom'
import { Send } from 'lucide-react'
import { ClientEvent, LIMITS, type RoomView } from '@doodle/shared'

import { COPY } from '@/constants/copy'
import { socket } from '@/services/socket'
import { useGame } from '@/store'
import { placeholderFor } from '@/utils/chat'
import { ChatLine } from '../ChatLine'

export const Chat = ({ view, compact = false }: { view: RoomView; compact?: boolean }) => {
  const chat = useGame((s) => s.chat)
  const [text, setText] = useState('')
  const { scrollRef, contentRef } = useStickToBottom()
  const guessed = !!view.players.find((p) => p.id === view.youId)?.guessed

  const send = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = text.trim()

    if (!trimmed) return

    socket.emit(ClientEvent.Chat, trimmed)
    setText('')
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border-(length:--border-width) border-ink bg-white">
      {!compact && (
        <div className="shrink-0 border-b-(length:--border-width) border-ink bg-sky/30 px-3 py-1.5 font-display text-lg font-semibold">
          {COPY.chat.title}
        </div>
      )}
      <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto" role="log" aria-live="polite">
        <div ref={contentRef} className="space-y-1 px-3 py-2 text-[0.95rem]">
          {chat.length === 0 && <p className="py-4 text-center font-semibold text-ink-soft">{COPY.chat.empty}</p>}
          {chat.map((m) => (
            <ChatLine key={m.id} m={m} mine={m.playerId === view.youId} />
          ))}
        </div>
      </div>
      <form onSubmit={send} className="flex shrink-0 gap-2 border-t-(length:--border-width) border-ink bg-cream p-2">
        <input
          className="input !rounded-xl !py-1.5 !text-base"
          value={text}
          maxLength={LIMITS.chatLen}
          placeholder={placeholderFor(view, guessed)}
          aria-label={COPY.chat.inputLabel}
          autoComplete="off"
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-sunny btn-icon" type="submit" aria-label={COPY.chat.send}>
          <Send size="1.125rem" />
        </button>
      </form>
    </div>
  )
}
