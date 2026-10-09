import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { AVATARS } from '@doodle/shared'
import { random } from 'lodash-es'
import { StorageKey } from '../constants/storage'
import type { Profile, Session } from '../types'
interface SessionState {
  session: Session | null
  setSession: (session: Session | null) => void
}
export const useSessionStore = create<SessionState>()(
  persist((set) => ({ session: null, setSession: (session) => set({ session }) }), {
    name: StorageKey.Session,
    storage: createJSONStorage(() => sessionStorage),
  }),
)
interface ProfileState extends Profile {
  setProfile: (profile: Profile) => void
}
export const useProfileStore = create<ProfileState>()(
  persist((set) => ({ name: '', avatar: random(AVATARS.length - 1), setProfile: ({ name, avatar }) => set({ name, avatar }) }), {
    name: StorageKey.Profile,
    storage: createJSONStorage(() => localStorage),
    partialize: ({ name, avatar }) => ({ name, avatar }),
  }),
)
export const sessionFor = (roomId: string): Session | null => {
  const { session } = useSessionStore.getState()
  return session?.roomId === roomId.toUpperCase() ? session : null
}
