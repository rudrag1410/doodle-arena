import type { ChatKind } from '../enums'
export interface ChatMessage {
  id: string
  kind: ChatKind
  playerId?: string
  name?: string
  text: string
  ts: number
}
