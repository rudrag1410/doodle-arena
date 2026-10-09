import { LIMITS, type RoomInfo } from '@doodle/shared'

export const isRoomFull = (info?: RoomInfo) => !!info?.players && info.players >= (info.maxPlayers ?? LIMITS.maxPlayers)
