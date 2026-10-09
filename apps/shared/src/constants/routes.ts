export const HTTP_ROUTES = {
  health: '/healthz',
  stats: '/api/stats',
  roomInfo: (roomId: string) => `/api/rooms/${roomId}`,
} as const
export const ROOM_INFO_PATTERN = /^\/api\/rooms\/([A-Za-z0-9]{4,8})$/
export const ROOM_PATH_PREFIX = '/r/'
export const ROOM_PATH_PATTERN = /^\/r\/([A-Za-z0-9]{4,8})\/?$/
export const roomPath = (roomId: string) => `${ROOM_PATH_PREFIX}${roomId}`
