import { ROOM_PATH_PREFIX } from '@doodle/shared'

export const extractRoomCode = (input: string) =>
  input
    .trim()
    .toUpperCase()
    .replace(new RegExp(`^.*${ROOM_PATH_PREFIX}`), '')
