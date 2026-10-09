# Engineering note — Doodle Arena

Short answers to the four questions in the brief, plus the failure-handling table. Everything here is
implemented in this repo; file references are clickable from the README.

---

## 1. How the canvas is synced and how stroke data is sent

**The canvas model is tldraw's store.** Every client (drawer and viewers) runs a tldraw editor with only the
`draw` shape enabled and the camera locked to a fixed 1200×900 sheet, so a coordinate means the same thing on
every screen no matter the window size. Pen strokes, the fill tool and the eraser are all just changes to draw
shapes — one data type to sync, validate, undo and replay.

**Drawer → server.** `editor.store.listen({ source: 'user' })` fires on every pointer move. Changes are coalesced
into a `Map<shapeId, record | null>` ("latest record wins") and flushed every ~30 ms and immediately on
pointer-up, as one `canvas:ops { puts, removes }` message ([useCanvasStreaming.ts](../apps/web/src/hooks/useCanvasStreaming.ts)).

A *put* always carries the **complete record** of the shape, not a diff. That makes every message
idempotent and order-insensitive per shape: if one is dropped, the next one for the same shape repairs it.
The price is that a growing stroke is re-sent whole (a typical hand-drawn stroke is ~0.5–2 KB; tldraw already
delta-encodes the points inside `segments[].path` into base64, ~8 chars per point). Sending path deltas instead
is the obvious next optimisation; I chose robustness first.

**Server.** [canvas.ts](../apps/server/src/canvas/canvasStore.ts) validates the whole batch atomically
([shapeValidation.ts](../apps/server/src/canvas/shapeValidation.ts): draw shapes only, parent `page:page`, whitelisted
colour/size/fill, base64-only paths, ≤ 48 KB per record), applies it to its own `Map<id, record>` — the
authoritative copy — bumps a per-turn `seq`, and relays `canvas:ops { seq, puts, removes }` to everyone except the
sender. The drawer never waits for the server: their own strokes render locally with zero delay.

**Viewers.** Apply with `store.mergeRemoteChanges(...)`, so remote edits are neither echoed back nor pushed
onto anyone's undo stack. Canvas traffic bypasses React state entirely: a tiny
[canvas bus](../apps/web/src/services/canvasBus.ts) keeps a mirror of the drawing and forwards changes straight to
the tldraw editor, which also means a board that mounts late (or remounts) paints the canvas "as it stands".

**Undo / clear / eraser / fill** need no special messages: they are record puts and removes like any other.

**Late join / refresh / reconnect.** The server sends `canvas:full { shapes }` (its whole copy) together with the
player's personalised state. If the *drawer* reconnects, the client pushes its own copy back with `canvas:full`
so nothing drawn during the blip is lost.

**Replay.** While drawing, the server also appends to a per-turn event log. A stroke arrives as ~30 growing
snapshots; consecutive puts of the same shape within 600 ms are folded into one event with a start time and a
duration, so memory is bounded (and capped at 4,000 events/turn) and a replay is stroke-by-stroke rather than
packet-by-packet. At game end the log is sent to everyone; the client compresses idle gaps and re-animates each
stroke by revealing its points progressively.

## 2. Latency and ordering


| Concern          | What happens                                                                                                                                                                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transport        | WebSocket only (no long-polling fallback), `perMessageDeflate` off, so a relay is parse → validate → write with no queueing or compression in between.                                                                                                                                                                                            |
| Added delay      | Client coalescing ≈ 30 ms (≈ 33 updates/s); server adds none. Local drawing is optimistic, so the drawer feels 0 ms; viewers see strokes one network hop + ≤ 30 ms behind.                                                                                                                                                                        |
| Ordering         | One TCP stream per client and a single-threaded server loop per process mean a room has exactly one sequencer; viewers receive ops in the order the server applied them. `seq` is carried on every broadcast.                                                                                                                                     |
| Loss             | Messages can only be lost across a reconnect, and a reconnect always begins with `canvas:full`. Within a connection, full-record puts repair themselves.                                                                                                                                                                                          |
| Throttled drawer | If the server rate-limits a message it answers `canvas:reject { reason: 'rate' }`; the drawer client then sends one `canvas:full` (itself limited to 3 burst / 0.5 per s) and everyone converges.                                                                                                                                                 |
| Clocks           | Timers live on the server. Views carry `phaseEndsAt` in *server* time; the client estimates its offset with 5 NTP-style `time:sync` round trips (keeping the lowest-RTT sample), so countdowns agree across players to roughly half an RTT. A client clock that is wrong cannot affect scoring — points are computed from the server's own clock. |
| Measured         | Localhost, 5-player rooms all drawing continuously at 30 Hz: p50 1–7 ms, p99 ≤ 22 ms up to 600 rooms (table below). Real networks add their RTT/2 on top.                                                                                                                                                                                         |




## 3. What happens when the server restarts

Game state is in memory (it is a 60-second-per-turn game, not a database). To make a restart painless rather than
catastrophic, [registry.ts](../apps/server/src/registry/registry.ts) writes a small snapshot — room id, settings, host,
and each player's `{id, token, name, avatar}` — to `apps/server/data/rooms.json` whenever something changed (every
≤ 5 s, atomically via write-temp-then-rename) and on `SIGTERM`/`SIGINT`.

On boot, rooms are restored **as lobbies**. Browsers notice the dropped socket, reconnect with exponential back-off
(250 ms → 2.5 s) and re-send `{playerId, token}` from `sessionStorage`; the server re-attaches each seat. Players see
*"The server restarted — you're back in the lobby with your seat kept"* and the host just presses Start again.
Seats that nobody reclaims within 60 s are dropped, and empty rooms disappear.

What is **deliberately lost**: the in-progress turn, scores and the canvas. Persisting them is possible (the data is
small) but a half-finished drawing round is not worth the consistency risk of replaying timers. What survives is what
is expensive for humans to redo: the room link, the settings and everyone's seat. If the snapshot is missing or
corrupt, `ROOM_NOT_FOUND` shows a friendly "this room has ended" page instead of a spinner. This path is covered by
[registry.test.ts](../apps/server/src/registry/registry.test.ts) and was exercised live by the dev server's auto-restart.

## 4. Capacity — how many rooms per instance?

**Answer: about 600 busy rooms (≈ 3,000 connected players) per single-core Node process with headroom; it saturates
around 800–900.** Idle rooms (lobbies, thinking pauses) cost almost nothing, so real-world capacity is higher.

**How I measured** — `[scripts/loadtest.ts](../apps/server/scripts/loadtest.ts)`: spawns the *built* server, then N rooms
× 5 headless Socket.IO players across several generator processes. In every room the drawer streams a growing
stroke at 30 updates/s (new stroke every ~2 s, ~1 KB records) while the four guessers send chat — i.e. the
worst case of *every* room drawing *all the time*. Each record is stamped with the drawer's send time, so
latency = (viewer receive − drawer send), measured over a 15 s window after a 5 s warm-up. The server's CPU
(`process.cpuUsage`), RSS and event-loop delay (`perf_hooks.monitorEventLoopDelay`) are polled from `/api/stats`
every second.

Apple M3 Pro, 11 cores, loopback, Node 22:


| Rooms   | Players   | Updates delivered / s | Server CPU (of 1 core) | Latency p50 / p95 / p99 | Server RSS |
| ------- | --------- | --------------------- | ---------------------- | ----------------------- | ---------- |
| 120     | 600       | 10,200                | 32 %                   | 1 / 5 / 6 ms            | 123 MB     |
| 240     | 1,200     | 21,400                | 41 %                   | 4 / 9 / 11 ms           | 139 MB     |
| 360     | 1,800     | 32,000                | 49 %                   | 5 / 10 / 12 ms          | 227 MB     |
| **600** | **3,000** | **53,000**            | **83 %**               | **7 / 18 / 22 ms**      | 352 MB     |
| 1,000   | 5,000     | 81,000                | 100 %+ (saturated)     | 57 / 194 / 291 ms       | 512 MB     |


Cost is almost perfectly linear in delivered messages (~0.15 % of a core per busy room); the knee is where the event
loop runs out of time (loop-lag p99 jumps from 24 ms to 200 ms between 600 and 1,000 rooms, and a few connections
fail). Memory is roughly 0.5 MB per busy room.

**Caveats, stated plainly:** loopback has no real network latency; the load generators share the same 11 cores as
the server, which makes the larger runs *pessimistic*; the workload is synthetic worst-case (human play is closer to
a 40–60 % drawing duty cycle); and the bots send well-formed fake strokes, not real tldraw geometry. Reproduce with
`pnpm --filter @doodle/server loadtest --rooms 600 --procs 12 --seconds 15 --spawn` (raise `ulimit -n` first).

**Beyond one process.** Rooms are pinned to one process (their state is in memory), so scale by *routing*, not
sharing: one process per core behind a router that hashes the room code to an instance (the code is in the URL, so
it is known at connect time). Capacity then grows ≈ linearly with cores. The cheapest per-room wins before that are
batching broadcasts per tick and delta-encoding stroke paths — fan-out, not game logic, is the cost.

---



## Failure handling at a glance


| Situation                                                         | Behaviour                                                                                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Player refreshes / loses network < 30 s                           | Seat, score and "already guessed" kept; old tab (if any) is closed; canvas re-sent.                                         |
| Away > 30 s                                                       | Removed; if everyone else has guessed the turn ends; host passes on if needed.                                              |
| Drawer drops mid-turn                                             | Banner for others; if they don't return in 30 s the turn ends as "drawer left", no points to the drawer, next player draws. |
| Drawer leaves while choosing a word                               | Turn is skipped instantly, no empty turn-end screen.                                                                        |
| < 2 players left mid-game                                         | Clean return to the lobby.                                                                                                  |
| Client sends forged / oversized / wrong-type canvas data          | Rejected atomically; nothing stored or relayed.                                                                             |
| Client floods chat or strokes                                     | Token bucket → "Slow down" / `canvas:reject`; 200 strikes → disconnect; > 1 MB frame → disconnect.                          |
| Duplicate join for the same seat (React StrictMode, double click) | Idempotent — acknowledged, not an error.                                                                                    |
| Server restart                                                    | See §3.                                                                                                                     |


