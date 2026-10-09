import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Phase } from '@doodle/shared'
import type { Player } from '../game/types'
import { testBot } from '../testing/fixtures'
import { Registry } from './registry'
const MAX_ROOMS = 100
test('after a restart rooms come back as lobbies and players re-attach with their token', () => {
  const dir = mkdtempSync(join(tmpdir(), 'doodle-'))
  const file = join(dir, 'rooms.json')
  try {
    const before = new Registry(file, MAX_ROOMS)
    const room = before.create({ rounds: 4, drawTime: 45, customWords: ['alpha', 'bravo', 'charlie'] })!
    const host = room.join('Host', 2, testBot().conn) as Player
    const guest = room.join('Guest', 3, testBot().conn) as Player
    host.score = 999
    before.flush()
    before.shutdown()
    const after = new Registry(file, MAX_ROOMS)
    after.start()
    const restored = after.get(room.id)!
    assert.ok(restored, 'room survives the restart')
    assert.equal(restored.phase, Phase.Lobby)
    assert.equal(restored.settings.rounds, 4)
    assert.equal(restored.settings.drawTime, 45)
    assert.equal(restored.hostId, host.id)
    assert.equal(restored.players.size, 2)
    const c = testBot()
    assert.ok(restored.rejoin(guest.id, guest.token, c.conn), 'saved token re-attaches the seat')
    assert.equal(restored.rejoin(host.id, 'forged', testBot().conn), null, 'a wrong token cannot take a seat')
    assert.equal(c.view()?.players.find((p) => p.id === guest.id)?.connected, true)
    after.shutdown()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
test('rooms nobody returns to are cleaned up after the grace period', async () => {
  const { mock } = await import('node:test')
  mock.timers.enable({ apis: ['setTimeout'] })
  const dir = mkdtempSync(join(tmpdir(), 'doodle-'))
  const file = join(dir, 'rooms.json')
  try {
    const a = new Registry(file, MAX_ROOMS)
    const room = a.create()!
    room.join('Solo', 0, testBot().conn)
    a.flush()
    a.shutdown()
    const b = new Registry(file, MAX_ROOMS)
    b.start()
    assert.equal(b.size, 1)
    mock.timers.tick(61000)
    assert.equal(b.size, 0, 'abandoned room is gone')
    b.shutdown()
  } finally {
    mock.timers.reset()
    rmSync(dir, { recursive: true, force: true })
  }
})
