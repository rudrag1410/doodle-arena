import {
  CanvasRejectReason,
  DashStyle,
  FillStyle,
  PAGE_ID,
  PaletteColor,
  RecordTypeName,
  SegmentType,
  ShapeKind,
  BrushSize,
  ServerEvent,
  SHAPE_ID_PREFIX,
  type ChatMessage,
  type RoomView,
  type ShapeRecord,
} from '@doodle/shared'
import type { Conn, Player } from '../game/types'
export const stroke = (id: string, path = 'AAAA', extra: Record<string, unknown> = {}): ShapeRecord => ({
  id: `${SHAPE_ID_PREFIX}${id}`,
  typeName: RecordTypeName.Shape,
  type: ShapeKind.Draw,
  x: 10,
  y: 20,
  rotation: 0,
  index: 'a1',
  parentId: PAGE_ID,
  isLocked: false,
  opacity: 1,
  meta: {},
  props: {
    color: PaletteColor.Red,
    size: BrushSize.Medium,
    fill: FillStyle.None,
    dash: DashStyle.Draw,
    scale: 1,
    segments: [{ type: SegmentType.Free, path }],
    ...extra,
  },
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
