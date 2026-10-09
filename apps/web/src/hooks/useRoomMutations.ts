import { useMutation } from '@tanstack/react-query'
import { roomPath, type RoomSettings } from '@doodle/shared'
import { useLocation } from 'wouter'
import { MutationKey } from '../constants/api'
import { createRoomRequest, joinRoomRequest } from '../services/rooms'
import { useGame, useProfileStore, useSessionStore } from '../store'
import type { Profile, Session } from '../types'
const useSeating = () => {
  const [, navigate] = useLocation()
  const setProfile = useProfileStore((s) => s.setProfile)
  return (session: Session, profile: Profile) => {
    setProfile(profile)
    useSessionStore.getState().setSession(session)
    useGame.setState({ seat: { roomId: session.roomId, profile }, error: null })
    navigate(roomPath(session.roomId))
  }
}
export const useCreateRoom = () => {
  const seat = useSeating()
  return useMutation({
    mutationKey: [MutationKey.CreateRoom],
    mutationFn: ({ profile, settings }: { profile: Profile; settings?: Partial<RoomSettings> }) => createRoomRequest(profile, settings),
    onSuccess: (session, { profile }) => seat(session, profile),
  })
}
export const useJoinRoom = () => {
  const seat = useSeating()
  return useMutation({
    mutationKey: [MutationKey.JoinRoom],
    mutationFn: ({ roomId, profile }: { roomId: string; profile: Profile }) => joinRoomRequest(roomId, profile),
    onSuccess: (session, { profile }) => seat(session, profile),
  })
}
export const useLeaveRoom = () => {
  const [, navigate] = useLocation()
  const leave = useGame((s) => s.leave)
  return () => {
    leave()
    navigate('/')
  }
}
