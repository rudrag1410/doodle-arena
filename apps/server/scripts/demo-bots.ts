import { setTimeout as sleep } from 'node:timers/promises'
import { random, shuffle } from 'lodash-es'
import { ClientEvent, Phase } from '@doodle/shared'
import { Bot } from './lib/bot'
import { DEFAULT_SERVER_URL } from './lib/constants'
import { BOT_NAMES, DOODLES, DOODLE_WORDS, FALLBACK_DOODLE, type Doodle } from './lib/doodles'
import { strokeItem } from './lib/strokes'

const DEMO = {
  defaultBots: 3,
  pointsPerFrame: 2,
  frameMs: 30,
  pauseBetweenStrokesMs: [250, 650] as const,
  pickDelayMs: [800, 2300] as const,
  firstGuessDelayMs: [4000, 16000] as const,
  guessGapMs: 1800,
  loopMs: 100,
  usage: 'usage: demo-bots ROOMCODE|new [bots] [url] [startAt]',
  newRoomKeyword: 'new',
  newRoomSettings: { rounds: 1, drawTime: 40 },
  startDelayMs: 1500,
} as const

const [roomArg, count = String(DEMO.defaultBots), url = DEFAULT_SERVER_URL, startAtArg] = process.argv.slice(2)
const room = roomArg

if (!room) {
  console.error(DEMO.usage)
  process.exit(1)
}

const between = ([lo, hi]: readonly [number, number]) => random(lo, hi, true)
let counter = 0

async function drawStroke(bot: Bot, s: Doodle) {
  const id = `demo${(counter++).toString(36).padStart(5, '0')}${random(36 ** 4).toString(36)}`
  const coords = s.pts.flat()

  for (let n = DEMO.pointsPerFrame; n <= s.pts.length + DEMO.pointsPerFrame; n += DEMO.pointsPerFrame) {
    const upto = Math.min(n, s.pts.length)

    bot.socket.emit(ClientEvent.CanvasOps, { puts: [strokeItem(id, coords.slice(0, upto * 2), { color: s.color, size: s.size })], removes: [] })
    await sleep(DEMO.frameMs)

    if (upto === s.pts.length) break
  }
}

async function guessLater(bot: Bot) {
  await sleep(between(DEMO.firstGuessDelayMs))

  for (const w of shuffle(DOODLE_WORDS)) {
    const me = bot.view?.players.find((p) => p.id === bot.playerId)

    if (!bot.view || bot.view.phase !== Phase.Drawing || me?.guessed) return

    bot.say(w)
    await sleep(DEMO.guessGapMs)
  }
}

let roomCode = room
const roomReady = Promise.withResolvers<string>()

if (room !== DEMO.newRoomKeyword) roomReady.resolve(room)

async function run(name: string, index: number) {
  const bot = new Bot(name, url)
  const createsRoom = room === DEMO.newRoomKeyword && index === 0
  const res = createsRoom ? await bot.create(DEMO.newRoomSettings) : await bot.join(await roomReady.promise)

  if (!res.ok) return console.error(name, res.message)

  if (createsRoom) {
    roomCode = res.roomId
    roomReady.resolve(roomCode)
    console.log(`ROOM ${roomCode}`)
  }

  console.log(`${name} joined ${roomCode}`)

  const startAt = Number(startAtArg ?? Number(count) + 1)

  if (createsRoom) {
    const timer = setInterval(() => {
      if (bot.view?.phase === Phase.Lobby && bot.view.players.length >= startAt) {
        clearInterval(timer)
        setTimeout(() => bot.socket.emit(ClientEvent.GameStart), DEMO.startDelayMs)
      }
    }, DEMO.loopMs)
  }

  let lastTurn = ''

  while (bot.socket.connected) {
    const v = bot.view
    const key = v ? `${v.round}:${v.drawerId}:${v.phase}` : ''

    if (v && key !== lastTurn) {
      lastTurn = key

      if (v.phase === Phase.Choosing && bot.isDrawer && v.wordChoices) {
        const pick = Math.max(
          0,
          v.wordChoices.findIndex((w) => DOODLE_WORDS.includes(w.toLowerCase())),
        )

        await sleep(between(DEMO.pickDelayMs))
        bot.socket.emit(ClientEvent.TurnPick, pick)
      } else if (v.phase === Phase.Drawing && bot.isDrawer && v.word) {
        for (const s of DOODLES[v.word.toLowerCase()] ?? DOODLES[FALLBACK_DOODLE]) {
          await drawStroke(bot, s)
          await sleep(between(DEMO.pauseBetweenStrokesMs))
        }
      } else if (v.phase === Phase.Drawing && !bot.isDrawer) {
        void guessLater(bot)
      }
    }

    await sleep(DEMO.loopMs)
  }
}

await Promise.all(Array.from({ length: Number(count) }, (_, i) => run(BOT_NAMES[i % BOT_NAMES.length] + (i >= BOT_NAMES.length ? i : ''), i)))
