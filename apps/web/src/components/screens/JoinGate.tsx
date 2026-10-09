import { useState } from 'react'
import { motion } from 'motion/react'
import { Loader2, LogIn, Users } from 'lucide-react'
import { JoinErrorCode, LIMITS, Phase, type RoomInfo } from '@doodle/shared'
import { COPY } from '../../constants/copy'
import { useJoinRoom, useRoomInfo } from '../../hooks'
import { useProfileStore } from '../../store'
import { AvatarPicker, Logo, Screen } from '../common'
import { ErrorScreen } from './StatusScreens'
const isRoomFull = (info?: RoomInfo) => !!info?.players && info.players >= (info.maxPlayers ?? LIMITS.maxPlayers)

const RoomSummary = ({ info }: { info: RoomInfo }) => {
  if (info.players === undefined) return null
  const inProgress = !!info.phase && info.phase !== Phase.Lobby
  return (
    <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft">
      <Users size={15} /> {COPY.gate.inRoom(info.players)}
      {info.host && COPY.gate.hostedBy(info.host)}
      {inProgress && COPY.gate.inProgress}
    </div>
  )
}

export const JoinGate = ({ roomId }: { roomId: string }) => {
  const stored = useProfileStore()
  const [profile, setProfile] = useState({ name: stored.name, avatar: stored.avatar })
  const { data: info } = useRoomInfo(roomId)
  const join = useJoinRoom()
  if (info && !info.exists) return <ErrorScreen error={{ code: JoinErrorCode.RoomNotFound, message: '' }} />
  const name = profile.name.trim()
  const full = isRoomFull(info)
  return (
    <Screen className="items-center justify-center gap-4 p-4 short:gap-0 short:p-2">
      <div className="short:hidden">
        <Logo />
      </div>
      <motion.form
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="card w-full max-w-md p-4 short:p-3 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault()
          if (name) join.mutate({ roomId, profile: { ...profile, name } })
        }}
      >
        <div className="mb-3 text-center short:mb-1.5">
          <div className="label">{COPY.gate.invited}</div>
          <div className="font-display text-3xl font-bold tracking-[0.2em] short:text-2xl sm:text-4xl">{roomId}</div>
          {info && <RoomSummary info={info} />}
        </div>
        <label className="label" htmlFor="gate-name">
          {COPY.common.nameLabel}
        </label>
        <input
          id="gate-name"
          className="input mt-1"
          placeholder={COPY.common.namePlaceholder}
          maxLength={LIMITS.nameLen}
          autoFocus
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        />
        <div className="label mt-3 mb-1.5">{COPY.common.buddyLabel}</div>
        <AvatarPicker value={profile.avatar} onChange={(avatar) => setProfile({ ...profile, avatar })} />
        <button
          className="btn btn-primary mt-4 w-full py-3 text-lg short:mt-2 short:py-2 sm:py-4 sm:text-xl"
          disabled={!name || full || join.isPending}
          type="submit"
        >
          {join.isPending ? <Loader2 className="animate-spin" /> : <LogIn size={22} />} {full ? COPY.gate.full : COPY.gate.join}
        </button>
        {join.error && <p className="mt-2 text-center text-sm font-bold text-tomato">{join.error.message}</p>}
      </motion.form>
    </Screen>
  )
}
