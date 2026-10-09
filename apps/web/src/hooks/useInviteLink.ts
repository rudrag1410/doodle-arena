import { roomPath } from '@doodle/shared'

export const useInviteLink = (roomId: string) => `${window.location.origin}${roomPath(roomId)}`
