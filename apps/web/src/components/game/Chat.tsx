import { useState } from 'react'
import { useStickToBottom } from 'use-stick-to-bottom'
import { Lock, Send, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { ChatKind, ClientEvent, LIMITS, Phase, type ChatMessage, type RoomView } from '@doodle/shared'
import { COPY } from '../../constants/copy'
import { socket } from '../../services/socket'
import { useGame } from '../../store'
const placeholderFor = (view: RoomView, guessed: boolean): string => {
  if (view.phase !== Phase.Drawing) return COPY.chat.placeholderLobby
  if (view.drawerId === view.youId) return COPY.chat.placeholderDrawer
  return guessed ? COPY.chat.placeholderGuessed : COPY.chat.placeholderGuessing
}
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border-[2.5px] border-ink bg-white">
      {!compact && (
        <div className="shrink-0 border-b-[2.5px] border-ink bg-sky/30 px-3 py-1.5 font-display text-lg font-semibold">{COPY.chat.title}</div>
      )}
      <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto" role="log" aria-live="polite">
        <div ref={contentRef} className="space-y-1 px-3 py-2 text-[0.95rem]">
          {chat.length === 0 && <p className="py-4 text-center font-semibold text-ink-soft">{COPY.chat.empty}</p>}
          {chat.map((m) => (
            <Line key={m.id} m={m} mine={m.playerId === view.youId} />
          ))}
        </div>
      </div>
      <form onSubmit={send} className="flex shrink-0 gap-2 border-t-[2.5px] border-ink bg-cream p-2">
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
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
const Line = ({ m, mine }: { m: ChatMessage; mine: boolean }) => {
  switch (m.kind) {
    case ChatKind.System:
      return <p className="py-0.5 text-center text-sm font-bold text-ink-soft">{m.text}</p>
    case ChatKind.Correct:
      return (
        <p className="flex items-center gap-1.5 rounded-lg bg-mint/25 px-2 py-1 font-extrabold text-[#0b7d67]">
          <Sparkles size={16} /> {m.text}
        </p>
      )
    case ChatKind.Close:
      return <p className="rounded-lg bg-sunny/40 px-2 py-1 font-extrabold">🔥 {m.text}</p>
    case ChatKind.Secret:
      return (
        <p className="rounded-lg bg-grape/10 px-2 py-1 text-grape">
          <Lock size={13} className="mr-1 inline -translate-y-px" />
          <b>{m.name}</b>: <span className="font-semibold">{m.text}</span>
        </p>
      )
    case ChatKind.Chat:
      return (
        <p className="break-words">
          <b className={clsx(mine && 'text-tomato')}>{m.name}</b>
          <span className="text-ink-soft">: </span>
          <span className="font-semibold">{m.text}</span>
        </p>
      )
  }
}
