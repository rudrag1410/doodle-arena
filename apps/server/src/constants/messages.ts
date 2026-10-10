import { LIMITS, MIN_PLAYERS_TO_START } from '@doodle/shared'

export const ERROR_MESSAGES = {
  onlyHostSettings: 'Only the host can change settings',
  settingsLocked: 'Settings are locked during a game',
  onlyHostStart: 'Only the host can start the game',
  gameRunning: 'Game already running',
  needPlayers: `You need at least ${MIN_PLAYERS_TO_START} players`,
  onlyHost: 'Only the host can do that',
  gameNotFinished: 'Game is not finished',
  notChoosing: 'Not your turn to choose',
  invalidChoice: 'Invalid choice',
  notDrawing: 'You are not drawing right now',
  tooManyOps: 'Too many operations in one message',
  tooManyItems: 'Too many strokes',
  slowDown: 'Slow down a little!',
  drawingTooFast: 'Drawing too fast',
  resyncTooOften: 'Resyncing too often',
} as const

export const JOIN_MESSAGES = {
  rateLimited: 'Too many attempts — wait a moment',
  invalid: 'Invalid request',
  alreadyInRoom: 'Already in a room',
  serverBusy: 'The server is full right now — try again soon',
  roomFull: 'Room is full',
  roomFullMax: `Room is full (max ${LIMITS.maxPlayers} players)`,
  roomNotFound: 'That room does not exist (it may have ended)',
} as const

export const CHAT_MESSAGES = {
  joined: (name: string) => `${name} joined`,
  left: (name: string) => `${name} left`,
  newHost: (name: string) => `${name} is now the host`,
  choosing: (name: string) => `${name} is choosing a word…`,
  wordWas: (word: string) => `The word was “${word}”`,
  guessed: (name: string) => `${name} guessed the word!`,
  closeGuess: (text: string) => `“${text}” is close!`,
  drawerLeft: 'The drawer left — moving on',
  notEnoughPlayers: 'Not enough players to continue — back to the lobby',
} as const

export const NOTICE_MESSAGES = {
  drawerAway: (name: string, seconds: number) => `${name} lost connection — waiting up to ${seconds}s for them to return`,
} as const

export const KICK_REASONS = {
  replaced: 'This player opened the room in another tab',
} as const

export const VALIDATION_MESSAGES = {
  badId: 'bad shape id',
  strokeTooLarge: 'stroke is too large',
  canvasFull: 'canvas is full',
} as const
