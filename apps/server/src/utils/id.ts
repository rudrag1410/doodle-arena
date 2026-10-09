import { customAlphabet, nanoid } from 'nanoid'
import { ID_LENGTH, TOKEN_LENGTH } from '../constants/server'
import { ROOM_CODE } from '@doodle/shared'

export const newRoomCode = customAlphabet(ROOM_CODE.alphabet, ROOM_CODE.length)
export const newPlayerId = () => nanoid(ID_LENGTH)
export const newToken = () => nanoid(TOKEN_LENGTH)
