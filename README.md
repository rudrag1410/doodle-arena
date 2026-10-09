<div align="center">

# 🎨 Doodle Arena

**Real-time multiplayer draw-and-guess in your browser.**
One player draws a secret word, everyone else races to guess it in chat — faster guesses score more.

`pnpm` monorepo · React + [tldraw](https://tldraw.dev) canvas · Node + Socket.IO authoritative server · TypeScript end to end

</div>

---

## Run it

Requires **Node 20+** and **pnpm** (`corepack enable` gives you one).

```bash
pnpm install && pnpm start
```

Open **http://localhost:8080**, click *Create a room*, copy the invite link, open it in another browser (or a few tabs — identity is per tab) and play.

That single command builds the web app and serves it **and** the game server from one port.

<details>
<summary>Other commands</summary>

| Command | What it does |
|---|---|
| `pnpm dev` | Vite dev server on :3000 (HMR) + server on :8080 with auto-restart. Use this while hacking. |
| `pnpm lint` / `pnpm lint:fix` | ESLint (typescript-eslint, react-hooks) with Prettier-compatible rules. |
| `pnpm format` / `pnpm format:check` | Write / verify Prettier formatting. |
| `pnpm check` | Format check + lint + typecheck + unit tests. |
| `docker compose up --build` | Run the whole app in a container on http://localhost:8080 (rooms persist in a volume). |
| `pnpm test` | Unit tests: game rules, scoring, secrecy, reconnect grace, canvas validation, restart recovery (31 tests) |
| `pnpm e2e` | Boots a real server and plays a full game with headless bots, including cheating attempts (17 checks) |
| `pnpm demo-bots ROOMCODE 3` | Drops 3 bots into a room that really draw (streamed strokes) and guess — handy for demos |
| `pnpm loadtest -- --rooms 300 --procs 8 --spawn` | Capacity test (see [docs/NOTES.md](docs/NOTES.md#4-capacity--how-many-rooms-per-instance)) |
| `pnpm typecheck` | `tsc` across all packages |

Environment (all optional): `PORT` (8080), `MAX_ROOMS`, `GRACE_MS`, `DATA_FILE` (room snapshot path, empty to disable), `VITE_TLDRAW_LICENSE_KEY`.

</details>

> **tldraw licence note:** tldraw draws a small "Get a license for production" badge in the corner of its canvas unless a licence key is supplied via `VITE_TLDRAW_LICENSE_KEY`. Fine for an assessment; get a key before shipping.

## How it plays

1. **Lobby** — share the room link. The host picks rounds (1–10), draw time (20–180 s), word packs and/or their own word list.
2. **Turn** — the drawer picks 1 of 3 words (auto-picks after 15 s), the clock starts, letters are revealed over time.
3. **Guessing** — type guesses in chat. Close guesses get a private *"close!"*. Correct guessers can still chat, but only with the drawer and other guessers — the word can't leak.
4. **Scoring** — `100 + up to 400 for time left + up to 50 for being early`; the drawer earns 30 % of every correct guess.
5. **End** — podium, final scores, and a **stroke-by-stroke replay of every drawing** (scrub, speed, save PNG).

Drawing tools: pen, 13 colours, 4 brush sizes, eraser, fill, undo (`Ctrl/⌘ Z`), clear. Shortcuts: `B` pen · `E` eraser · `F` fill · `1–4` size.

**Fill** is vector-style: click inside a *closed* shape to fill it, or click empty paper to wash the whole sheet. Both are ordinary strokes, so they stream, undo and replay like everything else.

## Libraries instead of hand-rolled helpers

| Concern | Library |
|---|---|
| HTTP + caching, create/join requests | `@tanstack/react-query`, `axios` |
| Routing | `wouter` |
| Collections, clamping, rounding, throttling, sampling | `lodash-es` |
| Hooks (intervals, clipboard, media queries, debounce) | `usehooks-ts`, `react-hotkeys-hook`, `use-stick-to-bottom` |
| Persisted client state | `zustand` + `persist` |
| Class names | `clsx` |
| Server: ids, rate limiting, static files, atomic writes, typo distance | `nanoid`, `limiter` + `lru-cache`, `sirv`, `write-file-atomic`, `damerau-levenshtein` |
| Validation | `zod` (socket payloads and every drawing record) |
| Formatting | `prettier` (`pnpm format`) |

## Layout rule: no page scroll

Every screen fits the viewport. The board takes whatever height is left and keeps its 4:3 shape (CSS container units), phones get tabs instead of stacked panels, and short landscape screens use compact variants.

## Architecture

```
doodle-arena/
└─ apps/
   ├─ shared/                  @doodle/shared — the contract both ends compile against
   │   └─ src/  enums.ts · constants/ (limits, canvas, palette, game rules, routes) · types/ · utils.ts
   ├─ server/                  @doodle/server — authoritative game server
   │   ├─ src/config/          env vars, rate-limit budgets
   │   ├─ src/constants/       http, messages, logs, server tunables
   │   ├─ src/game/            room.ts (state machine) · scoring · hints · guess · settings · wordPool
   │   ├─ src/canvas/          canvasStore (server copy + replay log) · shapeValidation (zod schema)
   │   ├─ src/security/        token buckets (limiter) + per-IP LRU gate
   │   ├─ src/registry/        room directory + atomic snapshot/restore
   │   ├─ src/http/            JSON API, static files (sirv), stats
   │   ├─ src/socket/          event handlers, zod schemas, client IP
   │   ├─ src/utils/ · data/   id/text helpers · word lists
   │   └─ scripts/             e2e, loadtest, demo-bots (+ lib/)
   └─ web/                     @doodle/web — React 19 + Vite + Tailwind 4 + tldraw
       ├─ src/constants/       copy (every UI string), board, api, timing, theme, motion, storage keys
       ├─ src/hooks/           queries & mutations (TanStack Query), canvas streaming, replay player, shortcuts, …
       ├─ src/services/        axios client + QueryClient, socket, room requests, canvas bus, clock sync
       ├─ src/store/           zustand: game state, persisted session/profile, socket bindings
       ├─ src/board/           tldraw configuration, bucket fill, replay maths
       └─ src/components/      common · screens · lobby · game · board · replay
```

```
 drawer's tldraw ──store.listen──► coalesce (latest per shape, ~30 ms) ──canvas:ops──►  SERVER  ──canvas:ops──► viewers' tldraw
                                                                                     validate · store · seq · replay log      mergeRemoteChanges
 server owns: word · clock · hints · guess checking · scores · who may draw · who may see what
```

### The server is the authority

| Requirement | How it's enforced |
|---|---|
| Edited client can't see the word | The word is only ever placed in the `RoomView` built for the drawer, for players who already guessed, and after the turn. Spectator payloads never contain it (asserted in `pnpm e2e`). |
| …or give itself points | There is no "I guessed it" message. Clients send raw chat text; the server compares it, computes points from *its own* clock, and updates scores. |
| Only the drawer draws | `canvas:ops` from anyone else is rejected; canvas messages are valid only in the `drawing` phase. |
| Correct guessers can't reveal the word | Their (and the drawer's) chat is routed only to drawer + guessers. A line containing the answer from someone still guessing counts as their correct guess instead of leaking to the room. |
| "close!" | Damerau-Levenshtein ≤ 1 (≤ 2 for 8+ letters), delivered only to the guesser. |
| Joins mid-round / refresh / 30 s drop | Joiners get `canvas:full` + their personalised state. A per-tab `{playerId, token}` re-attaches the same seat with score and "already guessed" intact for 30 s (`GRACE_MS`). A second tab with the same identity takes over and the old one is closed. |
| Drawer leaves | If the drawer vanishes the turn is skipped after the grace period (or immediately if they leave on purpose); players see *"X lost connection — waiting up to 30 s"* meanwhile. Fewer than 2 players → clean return to lobby. Host leaves → host passes on. |
| Abuse protection | Token buckets per socket: chat 5 burst / 1 per s, strokes 120 burst / 60 per s, controls, joins (also per IP). Limits: 140-char chat, 18-char names, 48 KB per stroke, ≤ 8 records per message, ≤ 600 shapes / 900 KB per canvas, 12 players per room, 1 MB hard transport cap. Strokes must be tldraw `draw` shapes with whitelisted colour/size/fill, base64 paths only. |

More detail — sync protocol, ordering, restarts, capacity numbers — in **[docs/NOTES.md](docs/NOTES.md)**.

## Requirement checklist

- [x] Rooms with shareable link; host sets rounds, draw time, word list
- [x] Pen, colours, brush size, eraser, fill, undo, clear — strokes stream live
- [x] Drawer picks from 3 words → countdown → letter hints → ends on timeout or when everyone guessed
- [x] Server-authoritative guesses, clock and points
- [x] Correct guessers can't reveal the word; near-misses get a private "close!"
- [x] Mid-round joiners see the canvas; refresh/drop ≤ 30 s keeps score
- [x] Drawer leaving mid-turn recovers cleanly
- [x] Rate limits + size limits on chat and strokes
- [x] Stroke-by-stroke replay of every drawing at the end
- [x] One-command run · 31 unit tests · 17 e2e checks · load test with measured numbers
# doodle-arena
