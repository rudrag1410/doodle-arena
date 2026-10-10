export const LIMITS = {
  maxPlayers: 12,
  nameLen: 18,
  chatLen: 140,
  customWords: 300,
  customWordLen: 30,
  customWordsInputLen: 4000,
  recordBytes: 48000,
  opsPerMessage: 8,
  canvasItems: 600,
  canvasBytes: 900000,
  replayEventsPerTurn: 4000,
} as const

export const MAX_MESSAGE_BYTES = 1000000
export const MIN_CUSTOM_WORDS_ONLY = 3
export const MIN_PLAYERS_TO_START = 2
export const MIN_PLAYERS_IN_GAME = 2
