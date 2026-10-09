import { TurnEndReason } from '@doodle/shared'

export const GAME_COPY = {
  game: {
    room: 'Room',
    round: (round: number, total: number) => `Round ${round}/${total}`,
    youDrawing: 'You are drawing!',
    someoneDrawing: (name: string) => `${name} is drawing`,
    timer: (s: number) => `${s} seconds left`,
    drawThis: 'Draw this',
    theWord: 'The word',
    wordWas: 'The word was',
    pickingWord: 'Picking a word…',
    hintLabel: (n: number) => `Hint: ${n} characters`,
    fillAria: 'Fill tool',
  },
  toolbar: {
    label: 'Drawing tools',
    pen: 'Pen',
    fill: 'Fill',
    eraser: 'Eraser',
    colour: 'Colour',
    brushSize: 'Brush size',
    undo: 'Undo (Ctrl+Z)',
    clear: 'Clear canvas',
    shortcut: (label: string, key: string) => `${label} (${key})`,
    brushNames: { s: 'Fine', m: 'Medium', l: 'Bold', xl: 'Chunky' } as Record<string, string>,
  },
  overlay: {
    roundOf: (round: number, total: number) => `Round ${round} of ${total}`,
    yourTurn: 'Your turn! Pick a word',
    autoPick: (s: number) => `Auto-picking in ${s}s`,
    choosing: (name: string) => `${name} is choosing a word`,
    someone: 'Someone',
    nextTurn: (s: number) => `Next turn in ${s}…`,
    reasons: {
      [TurnEndReason.AllGuessed]: 'Everyone guessed it!',
      [TurnEndReason.Time]: 'Time’s up!',
      [TurnEndReason.DrawerLeft]: 'The drawer left',
    } as Record<TurnEndReason, string>,
    turnOver: 'Turn over',
    noPoints: '—',
  },
} as const
