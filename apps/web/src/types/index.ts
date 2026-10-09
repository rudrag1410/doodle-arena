import type { JoinErrorCode, ToastKind } from '@doodle/shared'
import type { LocalErrorCode } from '../enums'
export interface Toast {
  id: number
  kind: ToastKind
  text: string
}
export interface Session {
  roomId: string
  playerId: string
  token: string
}
export interface Profile {
  name: string
  avatar: number
}
export interface ClientError {
  code: JoinErrorCode | LocalErrorCode
  message: string
}
