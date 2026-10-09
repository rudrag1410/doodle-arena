<div align="center">

# 🎨 Doodle Arena

**Real-time multiplayer draw-and-guess for the browser.**

One player draws a secret word, everyone else races to guess it in chat.

[Quick start](#-quick-start) · [Features](#-features) · [Configuration](#-configuration) · [Scripts](#-scripts)

</div>

## ✨ Features

- **Private rooms** — share a link and play. The host sets rounds, draw time and the word list.
- **Live drawing** — pen, colours, brush sizes, eraser, fill, undo and clear, streamed stroke by stroke.
- **Fair play** — the server owns the word, the clock and the scores. Correct guessers can't leak the answer, and near misses get a private "close!".
- **Resilient** — join mid-round, refresh or drop your connection and keep your seat. If the drawer leaves, the game recovers.
- **Replay** — watch every drawing be redrawn stroke by stroke when the game ends.
- **Works everywhere** — fits any screen from a phone to a desktop without scrolling.

## 🚀 Quick start

### Docker

```bash
docker compose up --build
```

Open http://localhost:8080, create a room and send the invite link to your friends.

### Without Docker

Requires Node 22 and pnpm (`corepack enable`).

```bash
pnpm install
pnpm start
```

Open http://localhost:8080.

### Local development

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. The web app has hot reload and proxies to the game server on port 8080.

## 🎮 How to play

1. **Create a room** and share the invite link.
2. Everyone opens the link and picks a name.
3. The host adjusts the settings and starts the game.
4. The drawer picks one of three words and draws it. Everyone else guesses in chat.
5. Faster guesses score more. The best total wins.

Shortcuts: `B` pen · `E` eraser · `F` fill · `1`–`4` brush size · `Ctrl/Cmd + Z` undo.

## ⚙️ Configuration

Everything is optional. Copy `.env.example` to `.env` to change a value.

| Variable                  | Default                       | Description                                                      |
| ------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| `PORT`                    | `8080`                        | Server port (with Docker, the published host port)               |
| `MAX_ROOMS`               | `20000`                       | Maximum concurrent rooms                                         |
| `GRACE_MS`                | `30000`                       | How long a disconnected player keeps their seat                  |
| `DATA_FILE`               | `apps/server/data/rooms.json` | Snapshot used to restore rooms after a restart. Empty disables it |
| `TRUST_PROXY`             | off                           | Set to `1` when running behind a reverse proxy                   |
| `VITE_TLDRAW_LICENSE_KEY` |                               | tldraw licence key. Without one, tldraw shows a small badge      |

## 🧰 Stack

React 19, tldraw, Vite and Tailwind 4 on the client. Node, Socket.IO and zod on the server. TypeScript throughout, in a pnpm monorepo:

```
apps/
  shared/   Types, enums and constants used by both sides
  server/   Game server: rooms, scoring, validation, Socket.IO
  web/      React app: screens, tldraw board, stores, hooks
```

## 🛠 Scripts

| Command                             | Description                                     |
| ----------------------------------- | ----------------------------------------------- |
| `pnpm dev`                          | Web (3000) and server (8080) with hot reload    |
| `pnpm build`                        | Build the web app and the server                |
| `pnpm start`                        | Build, then serve everything on port 8080       |
| `pnpm check`                        | Format check, lint, type check and unit tests   |
| `pnpm lint` / `pnpm lint:fix`       | ESLint                                          |
| `pnpm format` / `pnpm format:check` | Prettier                                        |
| `pnpm test`                         | Server unit tests                               |
| `pnpm e2e`                          | Plays a full game with headless bots            |
| `pnpm demo-bots new 3`              | Creates a room and fills it with 3 drawing bots |
| `pnpm loadtest`                     | Capacity test                                   |

Run `pnpm check` before pushing.
