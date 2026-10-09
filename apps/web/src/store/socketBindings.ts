import { round } from 'lodash-es'
import { Phase, ServerEvent, SocketLifecycle, ToastKind, type RoomView } from '@doodle/shared'
import { COPY } from '../constants/copy'
import { CHAT_KEEP } from '../constants/timing'
import { LocalErrorCode } from '../enums'
import { canvasBus } from '../services/canvasBus'
import { estimateClock } from '../services/clockSync'
import { RoomRequestError, joinRoomRequest } from '../services/rooms'
import { socket } from '../services/socket'
import { useGame } from './gameStore'
import { useSessionStore } from './sessionStore'
const IN_TURN: ReadonlySet<Phase> = new Set([Phase.Choosing, Phase.Drawing, Phase.TurnEnd])
let syncing = false
const refreshClock = async () => {
  if (syncing) return
  syncing = true
  try {
    const { offset, rtt } = await estimateClock()
    useGame.setState({ clockOffset: offset, rtt: round(rtt) })
  } finally {
    syncing = false
  }
}
const wasKnockedToLobby = (prev: RoomView | null, next: RoomView) =>
  !!prev && prev.roomId === next.roomId && IN_TURN.has(prev.phase) && next.phase === Phase.Lobby
const retakeSeat = async () => {
  const { seat } = useGame.getState()
  if (!seat) return
  try {
    useSessionStore.getState().setSession(await joinRoomRequest(seat.roomId, seat.profile))
  } catch (err) {
    if (err instanceof RoomRequestError) useGame.setState({ error: { code: err.code, message: err.message } })
  }
}
export const bindSocketToStore = () => {
  let wasDisconnected = false
  socket.on(SocketLifecycle.Connect, () => {
    useGame.setState({ connected: true })
    void refreshClock()
    if (wasDisconnected) void retakeSeat()
  })
  socket.on(SocketLifecycle.Disconnect, () => {
    wasDisconnected = true
    useGame.setState({ connected: false })
  })
  socket.on(ServerEvent.State, (view) => {
    const { view: prev, toast } = useGame.getState()
    if (wasDisconnected && wasKnockedToLobby(prev, view)) toast(ToastKind.Info, COPY.toasts.serverRestarted)
    wasDisconnected = false
    useGame.setState((s) => ({ view, clockOffset: s.rtt ? s.clockOffset : view.serverNow - Date.now() }))
  })
  socket.on(ServerEvent.Chat, (m) => useGame.setState((s) => ({ chat: [...s.chat.slice(-(CHAT_KEEP - 1)), m] })))
  socket.on(ServerEvent.Replay, (replay) => useGame.setState({ replay }))
  socket.on(ServerEvent.Toast, (t) => useGame.getState().toast(t.kind, t.text))
  socket.on(ServerEvent.Kicked, (message) => {
    useSessionStore.getState().setSession(null)
    canvasBus.clear()
    useGame.setState({ error: { code: LocalErrorCode.Kicked, message }, view: null, seat: null })
  })
}
