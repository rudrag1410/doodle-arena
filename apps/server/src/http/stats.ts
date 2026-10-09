import { monitorEventLoopDelay } from 'node:perf_hooks'
import { round } from 'lodash-es'
import type { ServerStats } from '@doodle/shared'
import { EVENT_LOOP_RESOLUTION_MS } from '../constants/server'
import type { Registry } from '../registry/registry'
const NS_PER_MS = 1e6
const US_PER_MS = 1000
const BYTES_PER_MB = 1048576
const round1 = (n: number) => round(n, 1)
export class StatsCollector {
  private loop = monitorEventLoopDelay({
    resolution: EVENT_LOOP_RESOLUTION_MS,
  })
  private lastCpu = process.cpuUsage()
  private lastCpuAt = Date.now()
  socketCount = 0
  constructor(private readonly registry: Registry) {
    this.loop.enable()
  }
  collect(): ServerStats {
    const now = Date.now()
    const cpu = process.cpuUsage(this.lastCpu)
    const cpuPct = ((cpu.user + cpu.system) / US_PER_MS / (now - this.lastCpuAt)) * 100
    this.lastCpu = process.cpuUsage()
    this.lastCpuAt = now
    const p99 = this.loop.percentile(99) / NS_PER_MS
    const mean = this.loop.mean / NS_PER_MS
    this.loop.reset()
    let players = 0
    this.registry.rooms.forEach((r) => (players += r.players.size))
    const mem = process.memoryUsage()
    return {
      rooms: this.registry.size,
      players,
      sockets: this.socketCount,
      cpuPct: round1(cpuPct),
      rssMB: round(mem.rss / BYTES_PER_MB),
      heapMB: round(mem.heapUsed / BYTES_PER_MB),
      eventLoopMeanMs: round1(mean),
      eventLoopP99Ms: round1(p99),
      uptimeSec: round(process.uptime()),
    }
  }
}
