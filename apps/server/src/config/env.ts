import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CHOOSE_WORD_MS, GRACE_MS, TURN_END_MS } from '@doodle/shared'
import { DEFAULT_MAX_ROOMS, DEFAULT_PORT, PATHS } from '../constants/server'
import { findPackageRoot } from '../utils/paths'
import { ENV_OFF, ENV_ON, EnvVar } from './envVars'
const packageRoot = findPackageRoot(dirname(fileURLToPath(import.meta.url)))
const num = (name: EnvVar, fallback: number) => (process.env[name] ? Number(process.env[name]) : fallback)
export const env = {
  port: num(EnvVar.Port, DEFAULT_PORT),
  maxRooms: num(EnvVar.MaxRooms, DEFAULT_MAX_ROOMS),
  staticDir: resolve(process.env[EnvVar.StaticDir] ?? join(packageRoot, ...PATHS.webDist)),
  dataFile:
    process.env[EnvVar.DataFile] === '' ? null : resolve(process.env[EnvVar.DataFile] ?? join(packageRoot, PATHS.dataDir, PATHS.snapshotFile)),
  chooseMs: num(EnvVar.ChooseMs, CHOOSE_WORD_MS),
  turnEndMs: num(EnvVar.TurnEndMs, TURN_END_MS),
  graceMs: num(EnvVar.GraceMs, GRACE_MS),
  corsOrigin: process.env[EnvVar.CorsOrigin]?.split(',') ?? true,
  trustProxy: process.env[EnvVar.TrustProxy] === ENV_ON,
  ipRateLimit: process.env[EnvVar.IpRateLimit] !== ENV_OFF,
}
