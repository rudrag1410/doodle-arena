import { fork, spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { ClientEvent, Phase, type ServerStats } from '@doodle/shared'
import { EnvVar, ENV_OFF } from '../src/config/envVars'
import { Bot } from './lib/bot'
import { DEFAULT_SERVER_URL, NODE_TSX_ARGS, SERVER_ENTRY_SOURCE, SERVER_READY_MARKER, SERVER_STATS_PATH, fastServerEnv } from './lib/constants'
import { fakeStrokeWithId } from './lib/strokes'
enum Flag {
  Rooms = 'rooms',
  Players = 'players',
  Seconds = 'seconds',
  Procs = 'procs',
  Url = 'url',
  Spawn = 'spawn',
  Worker = 'worker',
  MyRooms = 'my-rooms',
  Offset = 'offset',
}
enum WorkerMessage {
  Ready = 'ready',
  Result = 'result',
}
const LOAD = {
  defaults: { rooms: 100, players: 5, seconds: 20, procs: 2 },
  rampMs: 25,
  warmupMs: 5000,
  extraDrawSeconds: 5,
  updateIntervalMs: 33,
  strokePauseMs: 300,
  strokePoints: { start: 8, end: 120, step: 4 },
  chatEveryMs: [3000, 6000] as const,
  chatText: 'is it a thing?',
  gameSettings: { rounds: 1, drawTime: 180 },
  phaseWaitMs: 10000,
  maxLatencySamples: 200000,
  ipcSamples: 20000,
  parentTimeoutExtraS: 90,
  pollMs: 1000,
  portBase: 4100,
  portSpread: 800,
  maxRooms: '100000',
  strokeIdPrefix: 'shape:lt',
  serverBuild: '../dist/index.js',
  tailWindowPadding: 4,
  minWindow: 3,
} as const
const arg = (name: Flag, def: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? (process.argv[i + 1] ?? 'true') : def
}
const flag = (name: Flag) => process.argv.includes(`--${name}`)
const ROOMS = Number(arg(Flag.Rooms, String(LOAD.defaults.rooms)))
const PLAYERS = Number(arg(Flag.Players, String(LOAD.defaults.players)))
const SECONDS = Number(arg(Flag.Seconds, String(LOAD.defaults.seconds)))
const PROCS = Number(arg(Flag.Procs, String(LOAD.defaults.procs)))
const URL = arg(Flag.Url, DEFAULT_SERVER_URL)
async function worker() {
  const rooms = Number(arg(Flag.MyRooms, '1'))
  const url = arg(Flag.Url, URL)
  const offset = Number(arg(Flag.Offset, '0'))
  const latencies: number[] = []
  let received = 0
  let sent = 0
  let failed = 0
  const bots: Bot[] = []
  const quiet = (b: Bot) => ((b.keep = false), b)
  const runRoom = async (r: number) => {
    const host = quiet(new Bot(`h${r}`, url))
    bots.push(host)
    const created = await host.create(LOAD.gameSettings)
    if (!created.ok) return void failed++
    const guests: Bot[] = []
    for (let i = 1; i < PLAYERS; i++) {
      const g = quiet(new Bot(`g${r}-${i}`, url))
      g.onOps = (p) => {
        received++
        const t = (
          p.puts[0]?.meta as
            | {
                t?: number
              }
            | undefined
        )?.t
        if (t && latencies.length < LOAD.maxLatencySamples) latencies.push(Date.now() - t)
      }
      bots.push(g)
      if (!(await g.join(host.roomId)).ok) return void failed++
      guests.push(g)
    }
    host.socket.emit(ClientEvent.GameStart)
    await host.waitFor((v) => v.phase === Phase.Choosing, LOAD.phaseWaitMs).catch(() => failed++)
    const everyone = [host, ...guests]
    const drawer = everyone.find((b) => b.isDrawer)!
    const viewers = everyone.filter((b) => b !== drawer)
    drawer.socket.emit(ClientEvent.TurnPick, 0)
    await drawer.waitFor((v) => v.phase === Phase.Drawing, LOAD.phaseWaitMs).catch(() => failed++)
    const [lo, hi] = LOAD.chatEveryMs
    const chatTimers = viewers.map((v) => setInterval(() => v.say(LOAD.chatText), lo + Math.random() * (hi - lo)))
    chatTimers.forEach((t) => t.unref())
    let stroke = 0
    const end = Date.now() + (SECONDS + LOAD.extraDrawSeconds) * 1000
    const { start, end: maxPts, step } = LOAD.strokePoints
    while (Date.now() < end) {
      const id = `${LOAD.strokeIdPrefix}${r.toString(36)}x${(stroke++).toString(36)}`
      for (let pts = start; pts <= maxPts && Date.now() < end; pts += step) {
        const rec = fakeStrokeWithId(id, pts)
        rec.meta = { t: Date.now() }
        drawer.socket.emit(ClientEvent.CanvasOps, { puts: [rec], removes: [] })
        sent++
        await sleep(LOAD.updateIntervalMs)
      }
      await sleep(LOAD.strokePauseMs)
    }
    chatTimers.forEach(clearInterval)
  }
  for (let r = 0; r < rooms; r++) {
    runRoom(offset + r).catch(() => void failed++)
    await sleep(LOAD.rampMs)
  }
  process.send?.({ type: WorkerMessage.Ready })
  await sleep(LOAD.warmupMs)
  latencies.length = 0
  received = 0
  const t0 = Date.now()
  await sleep(SECONDS * 1000)
  const elapsed = (Date.now() - t0) / 1000
  const stride = Math.max(1, Math.ceil(latencies.length / LOAD.ipcSamples))
  const sample = latencies.filter((_, i) => i % stride === 0)
  const connected = bots.filter((b) => b.socket.connected).length
  bots.forEach((b) => b.close())
  process.send?.({ type: WorkerMessage.Result, latencies: sample, received, elapsed, sent, failed, connected }, () => process.exit(0))
}
interface WorkerResult {
  latencies: number[]
  received: number
  elapsed: number
  failed: number
  connected: number
}
const pct = (a: number[], p: number) => (a.length ? a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))] : NaN)
async function main() {
  let server: ChildProcess | null = null
  let url = URL
  if (flag(Flag.Spawn)) {
    const port = LOAD.portBase + Math.floor(Math.random() * LOAD.portSpread)
    url = `http://localhost:${port}`
    const built = fileURLToPath(new globalThis.URL(LOAD.serverBuild, import.meta.url))
    const args = existsSync(built) ? [built] : [...NODE_TSX_ARGS, SERVER_ENTRY_SOURCE]
    server = spawn('node', args, {
      env: fastServerEnv(port, { [EnvVar.MaxRooms]: LOAD.maxRooms, [EnvVar.IpRateLimit]: ENV_OFF }),
      stdio: ['ignore', 'pipe', 'inherit'],
    })
    await new Promise<void>((res) => server!.stdout!.on('data', (d) => String(d).includes(SERVER_READY_MARKER) && res()))
    console.log(`spawned ${existsSync(built) ? 'built' : 'tsx'} server on ${url}`)
  }
  const per = Math.ceil(ROOMS / PROCS)
  const results: WorkerResult[] = []
  const kids: ChildProcess[] = []
  for (let i = 0; i < PROCS; i++) {
    const n = Math.min(per, ROOMS - i * per)
    if (n <= 0) break
    const args = [
      `--${Flag.Worker}`,
      `--${Flag.Url}`,
      url,
      `--${Flag.MyRooms}`,
      String(n),
      `--${Flag.Offset}`,
      String(i * per),
      `--${Flag.Players}`,
      String(PLAYERS),
      `--${Flag.Seconds}`,
      String(SECONDS),
    ]
    const kid = fork(fileURLToPath(import.meta.url), args, { execArgv: [...NODE_TSX_ARGS] })
    kid.on(
      'message',
      (
        m: {
          type: WorkerMessage
        } & WorkerResult,
      ) => m.type === WorkerMessage.Result && results.push(m),
    )
    kid.on('exit', (code, sig) => code && console.error(`worker ${i} exited with code ${code} ${sig ?? ''}`))
    kids.push(kid)
  }
  const samples: ServerStats[] = []
  const poll = setInterval(async () => {
    try {
      samples.push((await (await fetch(`${url}${SERVER_STATS_PATH}`)).json()) as ServerStats)
    } catch {}
  }, LOAD.pollMs)
  const t0 = Date.now()
  while (results.length < kids.length && Date.now() - t0 < (SECONDS + LOAD.parentTimeoutExtraS) * 1000) await sleep(250)
  clearInterval(poll)
  kids.forEach((k) => k.kill())
  const lat = results.flatMap((r) => r.latencies).sort((a, b) => a - b)
  const received = results.reduce((n, r) => n + r.received, 0)
  const elapsed = Math.max(...results.map((r) => r.elapsed), 1)
  const failed = results.reduce((n, r) => n + r.failed, 0)
  const connected = results.reduce((n, r) => n + r.connected, 0)
  const window = samples.filter((s) => s.rooms > 0).slice(-Math.max(LOAD.minWindow, SECONDS - LOAD.tailWindowPadding))
  const avg = (k: keyof ServerStats) => window.reduce((n, s) => n + s[k], 0) / Math.max(1, window.length)
  const max = (k: keyof ServerStats) => Math.max(...window.map((s) => s[k]), 0)
  const last = samples[samples.length - 1]
  console.log(
    JSON.stringify({
      rooms: ROOMS,
      playersPerRoom: PLAYERS,
      sockets: ROOMS * PLAYERS,
      connectedAtEnd: connected,
      failedRooms: failed,
      deliveredPerSec: Math.round(received / elapsed),
      latencyMs: { p50: pct(lat, 50), p95: pct(lat, 95), p99: pct(lat, 99), max: lat[lat.length - 1] },
      server: {
        cpuPctAvg: +avg('cpuPct').toFixed(1),
        cpuPctMax: max('cpuPct'),
        rssMB: last?.rssMB,
        loopP99Ms: +avg('eventLoopP99Ms').toFixed(1),
        loopP99MaxMs: max('eventLoopP99Ms'),
      },
    }),
  )
  server?.kill()
  process.exit(0)
}
if (flag(Flag.Worker)) await worker()
else await main()
