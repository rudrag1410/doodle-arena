export const DEFAULT_PORT = 8080
export const PATHS = { webDist: ['..', 'web', 'dist'], dataDir: 'data', snapshotFile: 'rooms.json' } as const
export enum ProcessSignal {
  Interrupt = 'SIGINT',
  Terminate = 'SIGTERM',
}
export const DEFAULT_MAX_ROOMS = 20000
export const SOCKET_OPTIONS = {
  pingIntervalMs: 10000,
  pingTimeoutMs: 8000,
  compress: false,
} as const
export const SNAPSHOT_INTERVAL_MS = 5000
export const IP_BUCKET_MAX = 5000
export const SHUTDOWN_FORCE_EXIT_MS = 1500
export const EVENT_LOOP_RESOLUTION_MS = 10
export const MAX_RATE_STRIKES = 200
export const WARN_COOLDOWN_MS = 1500
export const ID_LENGTH = 12
export const TOKEN_LENGTH = 32
export const PLAYER_ID_MAX_LEN = 32
export const TOKEN_MAX_LEN = 64
export const NAME_INPUT_MAX_LEN = 100
export const AVATAR_INPUT_MAX = 100
export const REPLAY_COALESCE_MS = 600
