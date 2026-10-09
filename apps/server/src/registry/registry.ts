import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import writeFileAtomic from 'write-file-atomic'
import { RESTORE_GRACE_MS, type RoomSettings } from '@doodle/shared'
import { LOG_MESSAGES } from '../constants/logs'
import { SNAPSHOT_INTERVAL_MS } from '../constants/server'
import { Room } from '../game/room'
import { defaultSettings, sanitizeSettings } from '../game/settings'
import type { RoomSnapshot, SnapshotFile } from '../game/types'
import { newRoomCode } from '../utils/id'
export class Registry {
  readonly rooms = new Map<string, Room>()
  private dirty = false
  private timer: ReturnType<typeof setInterval> | null = null
  constructor(
    private readonly file: string | null,
    private readonly maxRooms: number,
  ) {}
  get size() {
    return this.rooms.size
  }
  create(settings?: Partial<RoomSettings>): Room | null {
    if (this.rooms.size >= this.maxRooms) return null
    let id = newRoomCode()
    while (this.rooms.has(id)) id = newRoomCode()
    const room = new Room(id, sanitizeSettings(settings, defaultSettings()), this.hooks(id))
    this.rooms.set(id, room)
    this.dirty = true
    return room
  }
  get(id: string): Room | undefined {
    return this.rooms.get(id.toUpperCase())
  }
  private hooks(id: string) {
    return {
      onEmpty: () => {
        this.rooms.delete(id)
        this.dirty = true
      },
      onChange: () => {
        this.dirty = true
      },
    }
  }
  start() {
    if (!this.file) return
    this.restore()
    this.timer = setInterval(() => this.flush(), SNAPSHOT_INTERVAL_MS)
    this.timer.unref()
  }
  flush() {
    if (!this.file || !this.dirty) return
    this.dirty = false
    try {
      const payload: SnapshotFile = { savedAt: Date.now(), rooms: [...this.rooms.values()].map((r) => r.snapshot()) }
      mkdirSync(dirname(this.file), { recursive: true })
      writeFileAtomic.sync(this.file, JSON.stringify(payload))
    } catch (err) {
      console.error(LOG_MESSAGES.persistFailed, err)
    }
  }
  private restore() {
    if (!this.file || !existsSync(this.file)) return
    try {
      const data = JSON.parse(readFileSync(this.file, 'utf8')) as Partial<SnapshotFile>
      for (const snap of data.rooms ?? ([] as RoomSnapshot[])) {
        if (!snap.players?.length) continue
        const room = Room.restore(snap, this.hooks(snap.id), RESTORE_GRACE_MS, defaultSettings())
        this.rooms.set(room.id, room)
      }
      if (this.rooms.size) console.log(LOG_MESSAGES.restored(this.rooms.size))
    } catch (err) {
      console.error(LOG_MESSAGES.restoreFailed, err)
    }
  }
  shutdown() {
    this.dirty = true
    this.flush()
    if (this.timer) clearInterval(this.timer)
    this.rooms.forEach((r) => r.destroy())
  }
}
