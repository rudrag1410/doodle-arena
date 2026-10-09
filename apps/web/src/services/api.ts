import axios from 'axios'
import { QueryClient } from '@tanstack/react-query'
import { HTTP_ROUTES, type RoomInfo } from '@doodle/shared'

import { HTTP_TIMEOUT_MS } from '@/constants/api'

const http = axios.create({ baseURL: import.meta.env.VITE_SERVER_URL ?? '', timeout: HTTP_TIMEOUT_MS, validateStatus: (s) => s < 500 })
export const fetchRoomInfo = async (roomId: string): Promise<RoomInfo> => (await http.get<RoomInfo>(HTTP_ROUTES.roomInfo(roomId))).data

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false }, mutations: { retry: false } },
})
