export const LOG_MESSAGES = {
  listening: (port: number, maxRooms: number, staticDir: string) =>
    `Doodle Arena server on http://localhost:${port}  (max ${maxRooms} rooms, static: ${staticDir})`,
  noStatic: 'none',
  restored: (n: number) => `[registry] restored ${n} room(s) as lobbies`,
  persistFailed: '[registry] could not persist rooms',
  restoreFailed: '[registry] could not restore rooms',
  handlerError: '[socket] handler error',
  noBuild: 'Doodle Arena server is running. Build the web app (pnpm build) or use the Vite dev server on :5173.',
} as const
