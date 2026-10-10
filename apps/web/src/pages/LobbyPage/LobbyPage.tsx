import { useState } from 'react'
import clsx from 'clsx'
import { Play } from 'lucide-react'
import { ClientEvent, MIN_PLAYERS_TO_START, type RoomView } from '@doodle/shared'

import { COPY } from '@/constants/copy'
import { socket } from '@/services/socket'
import { RoomHeader, Screen, TabBar } from '@/components'
import { Chat } from '@/components'
import { InviteBanner } from './InviteBanner'
import { PlayerRoster } from './PlayerRoster'
import { SettingsPanel } from './SettingsPanel'

enum LobbyTab {
  Players = 'players',
  Settings = 'settings',
}

const TABS = [
  { id: LobbyTab.Players, label: COPY.tabs.players },
  { id: LobbyTab.Settings, label: COPY.tabs.settings },
]

export const LobbyPage = ({ view }: { view: RoomView }) => {
  const [tab, setTab] = useState(LobbyTab.Players)
  const isHost = view.hostId === view.youId
  const canStart = isHost && view.players.filter((p) => p.connected).length >= MIN_PLAYERS_TO_START
  const hostName = view.players.find((p) => p.id === view.hostId)?.name ?? COPY.lobby.theHost

  return (
    <Screen className="gap-2 p-3 sm:gap-3 lg:p-5">
      <RoomHeader />

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
          <SettingsPanel settings={view.settings} customWordCount={view.customWordCount} editable={isHost} />
          <div className="mt-3 shrink-0">
            {isHost ? (
              <>
                <button
                  className="btn btn-primary w-full py-3 text-lg sm:py-4 sm:text-xl"
                  disabled={!canStart}
                  onClick={() => socket.emit(ClientEvent.GameStart)}
                >
                  <Play size="1.375rem" fill="currentColor" /> {COPY.lobby.start}
                </button>
                {!canStart && <p className="mt-1 text-center text-xs font-bold text-ink-soft sm:text-sm">{COPY.lobby.needMore}</p>}
              </>
            ) : (
              <div className="rounded-2xl border-(length:--border-width) border-dashed border-ink/40 p-3 text-center font-display text-base font-semibold sm:text-lg">
                {COPY.lobby.waitingPrefix} <b>{hostName}</b> {COPY.lobby.waitingSuffix}
              </div>
            )}
          </div>
        </section>
      </div>
    </Screen>
  )
}
