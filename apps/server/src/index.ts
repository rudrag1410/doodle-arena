import { existsSync } from 'node:fs'
import { Server } from 'socket.io'
import { MAX_MESSAGE_BYTES, type ClientToServerEvents, type ServerToClientEvents } from '@doodle/shared'
import { env } from './config/env'
import { LOG_MESSAGES } from './constants/logs'
import { IP_BUCKET_MAX, ProcessSignal, SHUTDOWN_FORCE_EXIT_MS, SOCKET_OPTIONS } from './constants/server'
import { createHttpServer } from './http/httpServer'
import { StatsCollector } from './http/stats'
import { Registry } from './registry/registry'
import { createIpGate } from './security/rateLimit'
import { attachSocketHandlers } from './socket/handlers'

const registry = new Registry(env.dataFile, env.maxRooms)

registry.start()

const stats = new StatsCollector(registry)
const httpServer = createHttpServer({ registry, stats, staticDir: env.staticDir })

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  maxHttpBufferSize: MAX_MESSAGE_BYTES,
  pingInterval: SOCKET_OPTIONS.pingIntervalMs,
  pingTimeout: SOCKET_OPTIONS.pingTimeoutMs,
  cors: { origin: env.corsOrigin },
  perMessageDeflate: SOCKET_OPTIONS.compress,
})

const ipGate = createIpGate(env.ipRateLimit, IP_BUCKET_MAX)

attachSocketHandlers(io, { registry, stats, ipGate, trustProxy: env.trustProxy })

httpServer.listen(env.port, () => {
  console.log(LOG_MESSAGES.listening(env.port, env.maxRooms, existsSync(env.staticDir) ? env.staticDir : LOG_MESSAGES.noStatic))
})

function shutdown() {
  registry.shutdown()
  io.close(() => process.exit(0))
  setTimeout(() => process.exit(0), SHUTDOWN_FORCE_EXIT_MS).unref()
}

process.on(ProcessSignal.Interrupt, shutdown)
process.on(ProcessSignal.Terminate, shutdown)
