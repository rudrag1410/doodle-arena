import { BrushSize, ItemKind, PaletteColor, ServerEvent, type CanvasItem, type ChatMessage, type RoomView } from '@doodle/shared'
import type { Conn, Player } from '../game/types'

export const stroke = (id: string, coords = 4, extra: Partial<CanvasItem> = {}): CanvasItem => ({
  id,
  kind: ItemKind.Pen,
  color: PaletteColor.Red,
  size: BrushSize.Medium,
  points: Array.from({ length: coords }, (_, i) => 10 + i * 3),
  ...extra,
})

export interface TestBot {
  conn: Conn
  chats: ChatMessage[]
  closed: string[]
  ops: unknown[]
  view: () => RoomView
  player?: Player
}

export function testBot(): TestBot {
  const chats: ChatMessage[] = []
  const closed: string[] = []
  const ops: unknown[] = []
  let view: RoomView | null = null

  const conn = {
    send: (event: ServerEvent, payload: unknown) => {
      if (event === ServerEvent.State) view = payload as RoomView
      if (event === ServerEvent.Chat) chats.push(payload as ChatMessage)
      if (event === ServerEvent.CanvasOps) ops.push(payload)
    },
    close: (reason: string) => closed.push(reason),
  } as unknown as Conn

  return { conn, chats, closed, ops, view: () => view! }
}
