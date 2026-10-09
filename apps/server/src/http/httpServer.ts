import { existsSync } from 'node:fs'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import sirv from 'sirv'
import { HTTP_ROUTES, LIMITS, ROOM_INFO_PATTERN, type RoomInfo } from '@doodle/shared'
import { ASSETS_DIR, CacheControl, ContentType, FALLBACK_BASE_URL, Header, HttpMethod, HttpStatus } from '../constants/http'
import { LOG_MESSAGES } from '../constants/logs'
import type { Registry } from '../registry/registry'
import type { StatsCollector } from './stats'

const sendJson = (res: ServerResponse, status: HttpStatus, body: unknown) => {
  res.writeHead(status, { [Header.ContentType]: ContentType.Json, [Header.CacheControl]: CacheControl.NoStore })
  res.end(JSON.stringify(body))
}

const sendText = (res: ServerResponse, text: string) => {
  res.writeHead(HttpStatus.Ok, { [Header.ContentType]: ContentType.Text })
  res.end(text)
}

interface HttpDeps {
  registry: Registry
  stats: StatsCollector
  staticDir: string
}

export const createHttpServer = ({ registry, stats, staticDir }: HttpDeps): Server => {
  const assets = existsSync(staticDir)
    ? sirv(staticDir, {
        single: true,
        etag: true,
        setHeaders: (res, pathname) =>
          res.setHeader(Header.CacheControl, pathname.includes(`/${ASSETS_DIR}/`) ? CacheControl.Immutable : CacheControl.NoCache),
      })
    : null

  return createServer((req: IncomingMessage, res: ServerResponse) => {
    const { pathname } = new URL(req.url ?? '/', FALLBACK_BASE_URL)

    if (pathname === HTTP_ROUTES.health) return sendJson(res, HttpStatus.Ok, { ok: true })
    if (pathname === HTTP_ROUTES.stats) return sendJson(res, HttpStatus.Ok, stats.collect())

    const match = pathname.match(ROOM_INFO_PATTERN)

    const roomId = match?.[1]

    if (roomId) {
      const room = registry.get(roomId)

      if (!room) return sendJson(res, HttpStatus.NotFound, { exists: false } satisfies RoomInfo)

      const info: RoomInfo = {
        exists: true,
        players: room.players.size,
        maxPlayers: LIMITS.maxPlayers,
        phase: room.phase,
        host: room.players.get(room.hostId)?.name ?? null,
      }

      return sendJson(res, HttpStatus.Ok, info)
    }

    if (req.method !== HttpMethod.Get && req.method !== HttpMethod.Head) return void res.writeHead(HttpStatus.MethodNotAllowed).end()
    if (assets) return assets(req, res, () => sendText(res, LOG_MESSAGES.noBuild))

    sendText(res, LOG_MESSAGES.noBuild)
  })
}
