import { ROOM_CODE } from '@doodle/shared'
import { z } from 'zod'
import { AVATAR_INPUT_MAX, NAME_INPUT_MAX_LEN, PLAYER_ID_MAX_LEN, TOKEN_MAX_LEN } from '../constants/server'

const name = z.string().max(NAME_INPUT_MAX_LEN)
const avatar = z.number().int().min(0).max(AVATAR_INPUT_MAX)

export const createRoomSchema = z.object({
  name,
  avatar,
  settings: z.record(z.unknown()).optional(),
})

export const joinRoomSchema = z.object({
  roomId: z.string().min(ROOM_CODE.minLength).max(ROOM_CODE.maxLength),
  name,
  avatar,
  playerId: z.string().max(PLAYER_ID_MAX_LEN).optional(),
  token: z.string().max(TOKEN_MAX_LEN).optional(),
})
