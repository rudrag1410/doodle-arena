import { Lock, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { ChatKind, type ChatMessage } from '@doodle/shared'

export const ChatLine = ({ m, mine }: { m: ChatMessage; mine: boolean }) => {
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
