import { ATTACK_S, MASTER_VOLUME, SILENCE, SOUNDS } from '../constants/sound'
import type { SoundEffect } from '../enums'
import { useSoundStore } from '../store/soundStore'

let context: AudioContext | null = null

const audio = () => {
  if (typeof AudioContext === 'undefined') return null
  context ??= new AudioContext()
  if (context.state === 'suspended') void context.resume()
  return context
}

export const playSound = (effect: SoundEffect) => {
  if (useSoundStore.getState().muted) return
  const ctx = audio()
  if (!ctx) return
  const master = ctx.createGain()
  master.gain.value = MASTER_VOLUME
  master.connect(ctx.destination)
  const start = ctx.currentTime
  for (const { freq, at, dur, vol, wave, glideTo } of SOUNDS[effect]) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const from = start + at
    const to = from + dur
    osc.type = wave
    osc.frequency.setValueAtTime(freq, from)
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, to)
    gain.gain.setValueAtTime(SILENCE, from)
    gain.gain.linearRampToValueAtTime(vol, from + ATTACK_S)
    gain.gain.exponentialRampToValueAtTime(SILENCE, to)
    osc.connect(gain).connect(master)
    osc.start(from)
    osc.stop(to + ATTACK_S)
  }
}
