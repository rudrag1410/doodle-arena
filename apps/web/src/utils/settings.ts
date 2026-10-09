import { ClientEvent, type RoomSettings } from '@doodle/shared'

import { socket } from '@/services/socket'

const WORD_SEPARATOR = /[,\n]/

export const sendSettings = (patch: Partial<RoomSettings>) => socket.emit(ClientEvent.RoomSettings, patch)

export const parseWords = (text: string) =>
  text
    .split(WORD_SEPARATOR)
    .map((w) => w.trim())
    .filter(Boolean)
