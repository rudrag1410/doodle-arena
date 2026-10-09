import { EnvVar } from '../../src/config/envVars'
export const DEFAULT_SERVER_URL = 'http://localhost:3001'
export const BOT_AVATAR = 1
export const BOT_STROKE_DEFAULT_POINTS = 8
export const PATH_FIRST_POINT_BYTES = 12
export const PATH_POINT_BYTES = 6
export const PATH_FILL_BYTE = 7
export const STROKE_ID_PREFIX = 'bot'
export const BOT_WAIT_POLL_MS = 10
export const BOT_WAIT_DEFAULT_MS = 5000
export const fastServerEnv = (port: number, extra: Partial<Record<EnvVar, string>> = {}): NodeJS.ProcessEnv => ({
  ...process.env,
  [EnvVar.Port]: String(port),
  [EnvVar.DataFile]: '',
  ...extra,
})
export const SERVER_READY_MARKER = 'server on'
export const SERVER_ENTRY_SOURCE = 'src/index.ts'
export const NODE_TSX_ARGS = ['--import', 'tsx'] as const
export const SERVER_STATS_PATH = '/api/stats'
