import { spawn } from 'node:child_process'
import assert from 'node:assert/strict'
import { setTimeout as sleep } from 'node:timers/promises'
import { CanvasRejectReason, ChatKind, ClientEvent, Phase, type ReplayTurn } from '@doodle/shared'
import { EnvVar } from '../src/config/envVars'
import { Bot } from './lib/bot'
import { NODE_TSX_ARGS, SERVER_ENTRY_SOURCE, SERVER_READY_MARKER, fastServerEnv } from './lib/constants'
import { fakeStroke, strokeRecord } from './lib/strokes'

const E2E = {
  portBase: 3900,
  portSpread: 90,
  turnEndMs: 300,
  chooseMs: 3000,
  graceMs: 1200,
  settle: 100,
  longSettle: 150,
  unknownRoom: 'ZZZZZZ',
  game: { rounds: 1, drawTime: 30 },
  hugePathChars: 60000,
  forbiddenShapeType: 'embed',
  floodMessages: 40,
  maxDeliveredOfFlood: 8,
  oversizedChars: 2000000,
  disconnectWaitMs: 2000,
  phaseWaitMs: 3000,
  endWaitMs: 8000,
  playLoops: 40,
} as const

const PORT = E2E.portBase + Math.floor(Math.random() * E2E.portSpread)
const URL = `http://localhost:${PORT}`

const server = spawn('node', [...NODE_TSX_ARGS, SERVER_ENTRY_SOURCE], {
  env: fastServerEnv(PORT, {
    [EnvVar.TurnEndMs]: String(E2E.turnEndMs),
    [EnvVar.ChooseMs]: String(E2E.chooseMs),
    [EnvVar.GraceMs]: String(E2E.graceMs),
  }),
  stdio: ['ignore', 'pipe', 'inherit'],
})

await new Promise<void>((resolve) => server.stdout!.on('data', (d) => String(d).includes(SERVER_READY_MARKER) && resolve()))

let passed = 0

const ok = (name: string) => {
  passed++
  console.log(`  ✓ ${name}`)
}

async function main() {
  const a = new Bot('Ann', URL)
  const b = new Bot('Ben', URL)
  const c = new Bot('Cy', URL)
  const bots = [a, b, c]
  const created = await a.create(E2E.game)

  assert.ok(created.ok, JSON.stringify(created))
  ok('room created, shareable code returned: ' + a.roomId)
  assert.ok((await b.join(a.roomId)).ok)
  assert.ok((await c.join(a.roomId.toLowerCase())).ok)
  ok('two players joined by code (case-insensitive)')

  const missing = await new Bot('X', URL).join(E2E.unknownRoom)

  assert.equal(missing.ok, false)
  ok('unknown room is rejected')
  b.socket.emit(ClientEvent.GameStart)
  await sleep(E2E.settle)
  assert.equal(a.view!.phase, Phase.Lobby)
  ok('non-host cannot start the game')
  a.socket.emit(ClientEvent.GameStart)
  await a.waitFor((v) => v.phase === Phase.Choosing, E2E.disconnectWaitMs, 'choosing')

  const drawer = bots.find((x) => x.isDrawer)!
  const others = bots.filter((x) => x !== drawer)

  assert.equal(drawer.view!.wordChoices?.length, 3)
  assert.ok(others.every((x) => x.view!.wordChoices === null))
  drawer.socket.emit(ClientEvent.TurnPick, 0)
  await drawer.waitFor((v) => v.phase === Phase.Drawing)

  const word = drawer.view!.word!

  assert.ok(word)
  await sleep(E2E.settle)

  for (const o of others) {
    assert.equal(o.view!.word, null)
    assert.ok(!JSON.stringify(o.view).toLowerCase().includes(`"${word.toLowerCase()}"`), 'word absent from spectator payload')
  }

  ok(`word "${word}" is visible to the drawer only`)

  const [g1, g2] = others

  g1.socket.emit(ClientEvent.CanvasOps, { puts: [fakeStroke(4)], removes: [] })
  await sleep(E2E.settle)
  assert.ok(g1.rejects.includes(CanvasRejectReason.NotDrawer))
  assert.equal(drawer.ops.length + g2.ops.length, 0)
  ok('a non-drawer cannot draw')

  const evil = { ...fakeStroke(4), type: E2E.forbiddenShapeType }

  drawer.socket.emit(ClientEvent.CanvasOps, { puts: [evil], removes: [] })

  const huge = strokeRecord(fakeStroke(4).id, 'A'.repeat(E2E.hugePathChars))

  drawer.socket.emit(ClientEvent.CanvasOps, { puts: [huge], removes: [] })
  await sleep(E2E.longSettle)
  assert.deepEqual(drawer.rejects.slice(-2), [CanvasRejectReason.Invalid, CanvasRejectReason.TooLarge])
  assert.equal(g1.ops.length, 0)
  ok('forbidden shape types and oversized strokes are rejected')

  const stroke = fakeStroke(30)

  drawer.socket.emit(ClientEvent.CanvasOps, { puts: [stroke], removes: [] })
  await sleep(E2E.longSettle)
  assert.equal(g1.ops.length, 1)
  assert.equal(g2.ops.length, 1)
  assert.equal(drawer.ops.length, 0)
  ok('strokes are relayed to everyone but the drawer')

  const late = new Bot('Late', URL)

  assert.ok((await late.join(a.roomId)).ok)
  await sleep(E2E.longSettle)
  assert.equal(late.full?.shapes.length, 1)
  assert.equal(late.view!.word, null)
  ok('mid-round joiner receives the current canvas')
  g1.say(word.slice(0, -1) + (word.endsWith('x') ? 'y' : 'x'))
  await sleep(E2E.settle)
  assert.ok(g1.chats.some((m) => m.kind === ChatKind.Close))
  assert.ok(!g2.chats.some((m) => m.kind === ChatKind.Close))
  ok('"close!" is shown only to the person who guessed')
  g1.say(word)
  await g1.waitFor((v) => !!v.word, E2E.disconnectWaitMs, 'guesser sees word')

  const s1 = g1.view!.players.find((p) => p.id === g1.view!.youId)!.score

  assert.ok(s1 >= 100)
  g1.say(`psst the answer is ${word}`)
  await sleep(E2E.longSettle)
  assert.ok(!g2.chats.some((m) => m.text.toLowerCase().includes(word.toLowerCase())), 'g2 never saw the word')
  assert.ok(!late.chats.some((m) => m.text.toLowerCase().includes(word.toLowerCase())))
  ok('correct guess scores points; the answer never reaches players still guessing')

  const creds = { playerId: g1.playerId, token: g1.token }

  g1.close()
  await sleep(300)

  const g1b = new Bot('Ben-again', URL)

  assert.ok((await g1b.join(a.roomId, creds)).ok)
  await g1b.waitFor((v) => v.players.length >= 4)
  assert.equal(g1b.view!.players.find((p) => p.id === creds.playerId)!.score, s1)
  assert.equal(g1b.view!.word, word)
  ok('refresh/reconnect within grace keeps seat, score and guessed state')
  g2.say(word)
  await sleep(E2E.settle)
  late.say(word)
  await a.waitFor((v) => v.phase === Phase.TurnEnd, E2E.phaseWaitMs, 'turn end after everyone guessed')
  ok('turn ends as soon as everyone has guessed')
  await a.waitFor((v) => v.phase === Phase.Choosing || v.phase === Phase.GameEnd, E2E.phaseWaitMs)

  if ((a.view!.phase as Phase) === Phase.Choosing) {
    const all = [a, b, c, late, g1b]
    const d2 = all.find((x) => x.view && x.view.drawerId === x.view.youId)!

    d2.close()

    const rest = all.filter((x) => x !== d2 && x.socket.connected)

    await rest[0].waitFor((v) => v.drawerId !== null && v.drawerId !== d2.playerId, E2E.phaseWaitMs * 2, 'game recovers from drawer loss')
    ok('drawer disconnecting mid-turn: game recovers, next player draws')
  }

  const live = [a, b, c, late, g1b].filter((x) => x.socket.connected)

  for (let i = 0; i < E2E.playLoops; i++) {
    const v = live[0].view!

    if (v.phase === Phase.GameEnd) break

    const d = live.find((x) => x.view && x.view.drawerId === x.view.youId && x.view.phase !== Phase.TurnEnd)

    if (d?.view?.phase === Phase.Choosing) d.socket.emit(ClientEvent.TurnPick, 1)

    if (d?.view?.word) {
      d.socket.emit(ClientEvent.CanvasOps, { puts: [fakeStroke(10)], removes: [] })

      for (const o of live.filter((x) => x !== d)) o.say(d.view.word)
    }

    await sleep(E2E.settle + 20)
  }

  const end = await live[0].waitFor((v) => v.phase === Phase.GameEnd, E2E.endWaitMs, 'game end')

  assert.ok(end.ranking && end.ranking.length >= 3)
  assert.equal(end.ranking[0].rank, 1)
  await sleep(200)
  assert.ok(Array.isArray(live[0].replay) && live[0].replay.length >= 1, 'replay delivered')

  const turn = live[0].replay![0] as ReplayTurn

  assert.ok(turn.word && turn.events.length >= 1 && turn.drawerName)
  ok(`game finished with ranking; replay has ${live[0].replay!.length} drawing(s)`)

  const spam = new Bot('Spam', URL)

  assert.ok((await spam.join(a.roomId)).ok)

  for (let i = 0; i < E2E.floodMessages; i++) spam.say('hello ' + i)

  await sleep(300)
  assert.ok(spam.toasts.some((t) => /slow down/i.test(t)))

  const delivered = live[0].chats.filter((m) => m.name === 'Spam' && m.kind === ChatKind.Chat).length

  assert.ok(delivered <= E2E.maxDeliveredOfFlood, `chat flood limited (delivered ${delivered}/${E2E.floodMessages})`)
  ok(`chat flood is rate-limited (${delivered}/${E2E.floodMessages} delivered)`)

  const big = new Bot('Big', URL)

  await big.connected()

  const closed = new Promise<string>((res) => big.socket.on('disconnect', res))

  big.socket.emit(ClientEvent.Chat, 'x'.repeat(E2E.oversizedChars))
  assert.ok((await Promise.race([closed, sleep(E2E.disconnectWaitMs).then(() => 'timeout')])) !== 'timeout')
  ok('a message over the 1 MB transport cap disconnects the sender')
  bots.concat([late, g1b, spam]).forEach((x) => x.close())
}

try {
  await main()
  console.log(`\nAll ${passed} end-to-end checks passed`)
  process.exitCode = 0
} catch (err) {
  console.error('\nE2E FAILED:', err)
  process.exitCode = 1
} finally {
  server.kill()
  setTimeout(() => process.exit(process.exitCode ?? 0), 200)
}
