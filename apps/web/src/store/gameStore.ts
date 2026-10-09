import { create } from 'zustand'
import type { ChatMessage, ReplayTurn, RoomView, ToastKind } from '@doodle/shared'
import { ClientEvent } from '@doodle/shared'

import { TOAST_MS, TOASTS_VISIBLE } from '@/constants/timing'
import { canvasBus } from '@/services/canvasBus'
import { socket } from '@/services/socket'
import type { ClientError, Profile, Toast } from '@/types'
import { useSessionStore } from './sessionStore'

interface GameState {
  connected: boolean
  seat: {
    roomId: string
    profile: Profile
  } | null
  view: RoomView | null
  chat: ChatMessage[]
  replay: ReplayTurn[] | null
  toasts: Toast[]
  error: ClientError | null
  clockOffset: number
  rtt: number
  toast: (kind: ToastKind, text: string) => void
  dismissToast: (id: number) => void
  leave: () => void
}

let nextToastId = 1

export const useGame = create<GameState>((set, get) => ({
  connected: false,
  seat: null,
  view: null,
  chat: [],
  replay: null,
  toasts: [],
  error: null,
  clockOffset: 0,
  rtt: 0,
  toast: (kind, text) => {
    const id = nextToastId++

    set((s) => ({ toasts: [...s.toasts.slice(-(TOASTS_VISIBLE - 1)), { id, kind, text }] }))
    setTimeout(() => get().dismissToast(id), TOAST_MS)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  leave: () => {
    socket.emit(ClientEvent.RoomLeave)
    useSessionStore.getState().setSession(null)
    canvasBus.clear()
    set({ seat: null, view: null, chat: [], replay: null, error: null })
  },
}))

export const serverNow = () => Date.now() + useGame.getState().clockOffset
