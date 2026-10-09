import { SoundEffect } from '@/enums'

interface SoundNote {
  freq: number
  at: number
  dur: number
  vol: number
  wave: OscillatorType
  glideTo?: number
}

export const MASTER_VOLUME = 0.3
export const ATTACK_S = 0.01
export const SILENCE = 0.0001
export const TICK_FROM_MS = 10_000

type NoteInit = Partial<Pick<SoundNote, 'vol' | 'wave' | 'glideTo'>>

const note = (freq: number, at: number, dur: number, { vol = 0.5, wave = 'sine', glideTo }: NoteInit = {}): SoundNote => ({
  freq,
  at,
  dur,
  vol,
  wave,
  glideTo,
})

export const SOUNDS: Record<SoundEffect, SoundNote[]> = {
  [SoundEffect.Pop]: [note(520, 0, 0.08, { vol: 0.35, wave: 'sine', glideTo: 780 })],
  [SoundEffect.Join]: [note(523, 0, 0.12, { vol: 0.5, wave: 'triangle' }), note(659, 0.1, 0.18, { vol: 0.5, wave: 'triangle' })],
  [SoundEffect.Leave]: [note(659, 0, 0.12, { vol: 0.4, wave: 'triangle' }), note(440, 0.1, 0.18, { vol: 0.4, wave: 'triangle' })],
  [SoundEffect.YourTurn]: [
    note(523, 0, 0.12, { vol: 0.5, wave: 'triangle' }),
    note(659, 0.1, 0.12, { vol: 0.5, wave: 'triangle' }),
    note(784, 0.2, 0.12, { vol: 0.5, wave: 'triangle' }),
    note(1047, 0.3, 0.3, { vol: 0.55, wave: 'triangle' }),
  ],
  [SoundEffect.Start]: [note(330, 0, 0.25, { vol: 0.45, wave: 'sine', glideTo: 880 })],
  [SoundEffect.Correct]: [note(784, 0, 0.12, { vol: 0.45 }), note(988, 0.09, 0.12, { vol: 0.45 }), note(1175, 0.18, 0.25, { vol: 0.45 })],
  [SoundEffect.Success]: [
    note(659, 0, 0.1, { vol: 0.6 }),
    note(784, 0.08, 0.1, { vol: 0.6 }),
    note(988, 0.16, 0.1, { vol: 0.6 }),
    note(1319, 0.24, 0.35, { vol: 0.6 }),
  ],
  [SoundEffect.Close]: [note(392, 0, 0.1, { vol: 0.3, wave: 'triangle' }), note(392, 0.14, 0.1, { vol: 0.3, wave: 'triangle' })],
  [SoundEffect.Tick]: [note(1000, 0, 0.05, { vol: 0.25 })],
  [SoundEffect.TurnEnd]: [
    note(523, 0, 0.14, { vol: 0.45, wave: 'triangle' }),
    note(392, 0.14, 0.14, { vol: 0.45, wave: 'triangle' }),
    note(262, 0.28, 0.3, { vol: 0.45, wave: 'triangle' }),
  ],
  [SoundEffect.Win]: [
    note(523, 0, 0.14, { vol: 0.55, wave: 'triangle' }),
    note(523, 0.15, 0.14, { vol: 0.55, wave: 'triangle' }),
    note(523, 0.3, 0.14, { vol: 0.55, wave: 'triangle' }),
    note(659, 0.45, 0.2, { vol: 0.55, wave: 'triangle' }),
    note(784, 0.65, 0.5, { vol: 0.6, wave: 'triangle' }),
    note(1047, 0.65, 0.5, { vol: 0.35, wave: 'sine' }),
  ],
  [SoundEffect.GameOver]: [
    note(392, 0, 0.2, { vol: 0.45, wave: 'triangle' }),
    note(349, 0.2, 0.2, { vol: 0.45, wave: 'triangle' }),
    note(330, 0.4, 0.2, { vol: 0.45, wave: 'triangle' }),
    note(262, 0.6, 0.45, { vol: 0.45, wave: 'triangle' }),
  ],
}
