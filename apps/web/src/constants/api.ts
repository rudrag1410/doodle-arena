export const REQUEST_TIMEOUT_MS = 10000
export const HTTP_TIMEOUT_MS = 8000
export const ROOM_INFO_STALE_MS = 5000

export enum QueryKey {
  RoomInfo = 'room-info',
}

export enum MutationKey {
  CreateRoom = 'create-room',
  JoinRoom = 'join-room',
}
