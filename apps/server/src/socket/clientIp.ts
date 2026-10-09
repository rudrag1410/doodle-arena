import type { Socket } from 'socket.io'
import { Header } from '../constants/http'

const FORWARDED_SEPARATOR = ','

export function clientIp(socket: Socket, trustProxy: boolean): string {
  const forwarded = trustProxy
    ? (socket.handshake.headers[Header.XForwardedFor] as string | undefined)?.split(FORWARDED_SEPARATOR)[0]?.trim()
    : undefined

  return forwarded || socket.handshake.address
}
