import { useQuery } from '@tanstack/react-query'

import { ROOM_INFO_STALE_MS, QueryKey } from '@/constants/api'
import { fetchRoomInfo } from '@/services/api'

export const useRoomInfo = (roomId: string) =>
  useQuery({ queryKey: [QueryKey.RoomInfo, roomId], queryFn: () => fetchRoomInfo(roomId), staleTime: ROOM_INFO_STALE_MS })
