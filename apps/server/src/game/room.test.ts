import { test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { CanvasRejectReason, ChatKind, Phase, ServerEvent, TurnEndReason, type CanvasFull } from '@doodle/shared'
import { stroke, testBot, type TestBot } from '../testing/fixtures'
import { Room } from './room'
import { defaultSettings } from './settings'
import type { Player } from './types'
const bot = testBot
type Seated = TestBot & {
  player: Player
}
const CHOOSE_MS = 10000
const TURN_END_MS = 3000
const GRACE_MS = 30000
const DRAW_TIME_S = 60
const START_TIME = 1000000
const FINAL_ROUNDS = 2
const TEST_WORDS = ['elephant', 'giraffe', 'penguin']
let room: Room
let ended = false
beforeEach(() => {
  mock.timers.reset()
  mock.timers.enable({ apis: ['setTimeout', 'Date'], now: START_TIME })
  ended = false
  room = new Room(
    'TEST22',
    { ...defaultSettings(), rounds: FINAL_ROUNDS, drawTime: DRAW_TIME_S, customWords: TEST_WORDS, customOnly: true },
    {
      chooseMs: CHOOSE_MS,
      turnEndMs: TURN_END_MS,
      graceMs: GRACE_MS,
      now: () => Date.now(),
      onEmpty: () => (ended = true),
      onChange: () => {},
    },
  )
})
function seat(n: number): Seated[] {
  return Array.from({ length: n }, (_, i) => {
    const b = bot()
    b.player = room.join(`P${i}`, i, b.conn) as Player
    return b as Seated
  })
}
function startTurn(bots: Seated[]) {
  assert.equal(room.start(bots[0].player.id), null)
  const drawer = bots.find((b) => b.player.id === room.drawerId)!
  assert.equal(room.pickWord(drawer.player.id, 0), null)
  return drawer
}
test('only the host can start, and it needs two players', () => {
  const [a] = seat(1)
  assert.match(room.start(a.player.id)!, /at least 2/)
  const [, b] = seat(2)
  assert.match(room.start(b.player.id)!, /Only the host/)
})
test('the word is only visible to the drawer', () => {
  const bots = seat(3)
  const drawer = startTurn(bots)
  const word = drawer.view().word
  assert.ok(word)
  for (const b of bots.filter((x) => x !== drawer)) {
    assert.equal(b.view().word, null)
    assert.equal(b.view().wordChoices, null)
    assert.equal(b.view().hint!.length, word!.length)
    assert.ok(!b.view().hint!.includes(word![0]) || word![0] === ' ')
  }
  assert.equal(JSON.stringify(bots.filter((x) => x !== drawer).map((b) => b.chats)).includes(word!), false)
})
test('only the drawer is offered words, and picking is validated', () => {
  const bots = seat(2)
  room.start(bots[0].player.id)
  const drawer = bots.find((b) => b.player.id === room.drawerId)!
  const other = bots.find((b) => b !== drawer)!
  assert.equal(drawer.view().wordChoices?.length, 3)
  assert.ok(room.pickWord(other.player.id, 0))
  assert.ok(room.pickWord(drawer.player.id, 7))
})
test('a correct guess scores by speed and is never shown as text', () => {
  const bots = seat(3)
  const drawer = startTurn(bots)
  const [g1, g2] = bots.filter((b) => b !== drawer)
  const word = drawer.view().word!
  mock.timers.tick(5000)
  room.chat(g1.player.id, word)
  assert.equal(g1.view().word, word, 'guesser now sees the word')
  const early = g1.player.score
  mock.timers.tick(40000)
  room.chat(g2.player.id, word.toUpperCase())
  assert.ok(early > g2.player.score, 'earlier guess earns more')
  assert.ok(drawer.player.score > 0)
  const all = [...g1.chats, ...g2.chats, ...drawer.chats].filter((m) => m.kind !== 'system')
  assert.ok(
    all.every((m) => !m.text.toLowerCase().includes(word.toLowerCase())),
    'answer never appears in chat',
  )
})
test('players who guessed cannot leak the word to people still guessing', () => {
  const bots = seat(4)
  const drawer = startTurn(bots)
  const [g1, g2, g3] = bots.filter((b) => b !== drawer)
  const word = drawer.view().word!
  room.chat(g1.player.id, word)
  const before2 = g2.chats.length
  const before3 = g3.chats.length
  room.chat(g1.player.id, `lol it is ${word}`)
  room.chat(drawer.player.id, `${word} is easy`)
  assert.equal(g2.chats.length, before2, 'still-guessing players get nothing')
  assert.equal(g3.chats.length, before3)
})
test('near misses say "close!" only to the guesser', () => {
  const bots = seat(3)
  const drawer = startTurn(bots)
  const [g1, g2] = bots.filter((b) => b !== drawer)
  const word = drawer.view().word!
  room.chat(g1.player.id, word.slice(0, -1) + (word.endsWith('z') ? 'y' : 'z'))
  assert.ok(g1.chats.some((m) => m.kind === ChatKind.Close))
  assert.ok(!g2.chats.some((m) => m.kind === ChatKind.Close))
})
test('turn ends early when everyone guessed, then the next player draws', () => {
  const bots = seat(3)
  const drawer = startTurn(bots)
  const word = drawer.view().word!
  for (const g of bots.filter((b) => b !== drawer)) room.chat(g.player.id, word)
  assert.equal(room.phase, Phase.TurnEnd)
  assert.equal(drawer.view().turnResult?.reason, TurnEndReason.AllGuessed)
  const first = room.drawerId
  mock.timers.tick(TURN_END_MS)
  assert.equal(room.phase, Phase.Choosing)
  assert.notEqual(room.drawerId, first)
})
test('time running out ends the turn', () => {
  const bots = seat(2)
  startTurn(bots)
  mock.timers.tick(DRAW_TIME_S * 1000)
  assert.equal(room.phase, Phase.TurnEnd)
  assert.equal(bots[0].view().turnResult?.reason, TurnEndReason.Time)
})
test('a full game reaches gameEnd with a ranking', () => {
  const bots = seat(2)
  room.start(bots[0].player.id)
  for (let i = 0; i < 4; i++) {
    assert.equal(room.phase, Phase.Choosing)
    const d = bots.find((b) => b.player.id === room.drawerId)!
    room.pickWord(d.player.id, 0)
    room.chat(bots.find((b) => b !== d)!.player.id, d.view().word!)
    mock.timers.tick(TURN_END_MS)
  }
  assert.equal(room.phase, Phase.GameEnd)
  assert.equal(bots[0].view().ranking?.length, 2)
  assert.equal(bots[0].view().ranking?.[0].rank, 1)
})
test('drawer leaving mid-turn moves the game on', () => {
  const bots = seat(3)
  const drawer = startTurn(bots)
  room.remove(drawer.player.id)
  assert.equal(room.phase, Phase.TurnEnd)
  assert.equal(bots.find((b) => b !== drawer)!.view().turnResult?.reason, TurnEndReason.DrawerLeft)
  mock.timers.tick(TURN_END_MS)
  assert.equal(room.phase, Phase.Choosing)
  assert.notEqual(room.drawerId, drawer.player.id)
})
test('drawer dropping connection: waits through the grace period, then recovers', () => {
  const bots = seat(3)
  const drawer = startTurn(bots)
  room.detach(drawer.player.id, drawer.conn)
  const other = bots.find((b) => b !== drawer)!
  assert.match(other.view().notice ?? '', /lost connection/)
  mock.timers.tick(GRACE_MS - 1000)
  assert.equal(room.phase, Phase.Drawing)
  mock.timers.tick(2000)
  assert.equal(room.phase, Phase.TurnEnd)
})
test('reconnecting within 30s keeps the score; the old tab is closed', () => {
  const bots = seat(3)
  const drawer = startTurn(bots)
  const g = bots.find((b) => b !== drawer)!
  room.chat(g.player.id, drawer.view().word!)
  const score = g.player.score
  assert.ok(score > 0)
  room.detach(g.player.id, g.conn)
  mock.timers.tick(GRACE_MS - 10000)
  const fresh = bot()
  assert.ok(room.rejoin(g.player.id, g.player.token, fresh.conn))
  assert.equal(room.players.get(g.player.id)!.score, score)
  assert.equal(fresh.view().word, drawer.view().word, 'guessed state survives')
  const tab2 = bot()
  assert.ok(room.rejoin(g.player.id, g.player.token, tab2.conn))
  assert.equal(fresh.closed.length, 1)
  assert.equal(room.rejoin(g.player.id, 'wrong-token', bot().conn), null)
})
test('after 30s away the player is removed', () => {
  const bots = seat(3)
  room.detach(bots[2].player.id, bots[2].conn)
  mock.timers.tick(GRACE_MS + 1)
  assert.equal(room.players.has(bots[2].player.id), false)
})
test('host is reassigned and an empty room is destroyed', () => {
  const bots = seat(2)
  room.remove(bots[0].player.id)
  assert.equal(room.hostId, bots[1].player.id)
  room.remove(bots[1].player.id)
  assert.equal(ended, true)
})
test('late joiners receive the canvas as it stands', () => {
  const bots = seat(2)
  const drawer = startTurn(bots)
  const r = room.canvasOps(drawer.player.id, { puts: [stroke('abcd1')], removes: [] })
  assert.equal(r.ok, true)
  let received: CanvasFull | null = null
  const late = bot()
  const orig = late.conn.send
  late.conn.send = ((event: ServerEvent, payload: unknown) => {
    if (event === ServerEvent.CanvasFull) received = payload as CanvasFull
    ;(orig as (e: ServerEvent, p: unknown) => void)(event, payload)
  }) as never
  room.join('Late', 0, late.conn)
  assert.equal((received as CanvasFull | null)?.shapes.length, 1)
})
test('only the drawer may draw; spectators cannot, strokes are relayed to others', () => {
  const bots = seat(3)
  const drawer = startTurn(bots)
  const other = bots.find((b) => b !== drawer)!
  const bad = room.canvasOps(other.player.id, { puts: [stroke('abcd1')], removes: [] })
  assert.equal(bad.ok, false)
  assert.equal(bad.ok === false && bad.reason, CanvasRejectReason.NotDrawer)
  assert.equal(room.canvasOps(drawer.player.id, { puts: [stroke('abcd2')], removes: [] }).ok, true)
  assert.equal(other.ops.length, 1)
  assert.equal(drawer.ops.length, 0, 'not echoed to the sender')
})
test('settings are host-only and locked during play', () => {
  const bots = seat(2)
  assert.ok(room.updateSettings(bots[1].player.id, { rounds: 5 }))
  assert.equal(room.updateSettings(bots[0].player.id, { rounds: 99, drawTime: 5 }), null)
  assert.equal(room.settings.rounds, 10)
  assert.equal(room.settings.drawTime, 20)
  room.start(bots[0].player.id)
  assert.ok(room.updateSettings(bots[0].player.id, { rounds: 2 }))
})
test('custom word list is used when custom-only', () => {
  const bots = seat(2)
  room.updateSettings(bots[0].player.id, { customWords: ['alpha', 'bravo', 'charlie'], customOnly: true })
  room.start(bots[0].player.id)
  const d = bots.find((b) => b.player.id === room.drawerId)!
  assert.deepEqual([...d.view().wordChoices!].sort(), ['alpha', 'bravo', 'charlie'])
})
