export enum RateName {
  Chat = 'chat',
  Canvas = 'canvas',
  CanvasFull = 'canvasFull',
  Control = 'control',
  Join = 'join',
}
export const RATES: Record<
  RateName,
  {
    capacity: number
    refillPerSec: number
  }
> = {
  [RateName.Chat]: { capacity: 5, refillPerSec: 1 },
  [RateName.Canvas]: { capacity: 120, refillPerSec: 60 },
  [RateName.CanvasFull]: { capacity: 3, refillPerSec: 0.5 },
  [RateName.Control]: { capacity: 20, refillPerSec: 4 },
  [RateName.Join]: { capacity: 12, refillPerSec: 0.4 },
}
