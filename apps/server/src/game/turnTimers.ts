type Timer = ReturnType<typeof setTimeout>

export class TurnTimers {
  private phase: Timer | null = null
  private hints: Timer[] = []

  schedulePhase(fn: () => void, ms: number) {
    this.phase = setTimeout(fn, ms)
  }

  scheduleHint(fn: () => void, ms: number) {
    this.hints.push(setTimeout(fn, ms))
  }

  clear() {
    if (this.phase) clearTimeout(this.phase)

    this.phase = null
    this.hints.forEach(clearTimeout)
    this.hints = []
  }
}
