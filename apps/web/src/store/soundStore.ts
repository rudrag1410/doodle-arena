import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { StorageKey } from '@/constants/storage'

interface SoundState {
  muted: boolean
  toggle: () => void
}

export const useSoundStore = create<SoundState>()(
  persist((set) => ({ muted: false, toggle: () => set((s) => ({ muted: !s.muted })) }), {
    name: StorageKey.Sound,
    storage: createJSONStorage(() => localStorage),
  }),
)
