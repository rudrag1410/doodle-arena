import { LIMITS, MIN_PLAYERS_TO_START } from '@doodle/shared'

export const HOME_COPY = {
  home: {
    nameRequired: 'Pick a name first!',
    create: 'Create a room',
    orJoin: 'or join friends',
    codePlaceholder: 'ROOM CODE',
    codeLabel: 'Room code or link',
    joinLabel: 'Join room',
    audience: `${MIN_PLAYERS_TO_START}–${LIMITS.maxPlayers} players · play in your browser · no sign-up`,
    steps: [
      { title: 'Draw', text: 'Get a secret word and sketch it before time runs out.' },
      { title: 'Guess', text: 'Type guesses in chat. Faster guesses score more points.' },
      { title: 'Win', text: 'Everyone takes a turn. Highest score takes the crown.' },
    ],
  },
  gate: {
    invited: "You're invited to room",
    inRoom: (n: number) => `${n} in the room`,
    hostedBy: (host: string) => ` · hosted by ${host}`,
    inProgress: ' · game in progress',
    join: 'Join the game',
    full: 'Room is full',
  },
} as const
