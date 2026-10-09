import { useState } from 'react'
import clsx from 'clsx'
import { LogOut, Play } from 'lucide-react'
import { ClientEvent, MIN_PLAYERS_TO_START, type RoomView } from '@doodle/shared'
import { COPY } from '../../constants/copy'
import { useLeaveRoom } from '../../hooks'
import { socket } from '../../services/socket'
import { Logo, Screen, SoundToggle, TabBar } from '../common'
import { Chat } from '../game/Chat'
import { InviteBanner } from '../lobby/InviteBanner'
import { PlayerRoster } from '../lobby/PlayerRoster'
import { SettingsPanel } from '../lobby/SettingsPanel'
enum LobbyTab {
  Players = 'players',
  Settings = 'settings',
}
const TABS = [
  { id: LobbyTab.Players, label: COPY.tabs.players },
  { id: LobbyTab.Settings, label: COPY.tabs.settings },
]
export const Lobby = ({ view }: { view: RoomView }) => {
  const leave = useLeaveRoom()
  const [tab, setTab] = useState(LobbyTab.Players)
  const isHost = view.hostId === view.youId
  const canStart = isHost && view.players.filter((p) => p.connected).length >= MIN_PLAYERS_TO_START
  const hostName = view.players.find((p) => p.id === view.hostId)?.name ?? COPY.lobby.theHost
  return (
    <Screen className="gap-2 p-3 sm:gap-3 lg:p-5">
      <header className="flex shrink-0 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <SoundToggle />
          <button className="btn btn-sm" onClick={leave}>
            <LogOut size={16} /> {COPY.common.leave}
          </button>
        </div>
      </header>

      <InviteBanner roomId={view.roomId} />
      <TabBar tabs={TABS} value={tab} onChange={setTab} />

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1fr_1.1fr] lg:gap-4">
        <section className={clsx('card flex min-h-0 flex-col p-3 sm:p-4', tab !== LobbyTab.Players && 'max-lg:hidden')}>
          <PlayerRoster view={view} />
          <div className="mt-2 min-h-12 flex-1">
            <Chat view={view} compact />
          </div>
        </section>

        <section className={clsx('card flex min-h-0 flex-col p-3 sm:p-4', tab !== LobbyTab.Settings && 'max-lg:hidden')}>
          <h2 className="mb-2 shrink-0 text-xl font-bold sm:text-2xl">{COPY.lobby.settings}</h2>
          <SettingsPanel settings={view.settings} editable={isHost} />
          <div className="mt-3 shrink-0">
            {isHost ? (
              <>
                <button
                  className="btn btn-primary w-full py-3 text-lg sm:py-4 sm:text-xl"
                  disabled={!canStart}
                  onClick={() => socket.emit(ClientEvent.GameStart)}
                >
                  <Play size={22} fill="currentColor" /> {COPY.lobby.start}
                </button>
                {!canStart && <p className="mt-1 text-center text-xs font-bold text-ink-soft sm:text-sm">{COPY.lobby.needMore}</p>}
              </>
            ) : (
              <div className="rounded-2xl border-[2.5px] border-dashed border-ink/40 p-3 text-center font-display text-base font-semibold sm:text-lg">
                {COPY.lobby.waitingPrefix} <b>{hostName}</b> {COPY.lobby.waitingSuffix}
              </div>
            )}
          </div>
        </section>
      </div>
    </Screen>
  )
}
