import { Volume2, VolumeX } from 'lucide-react'
import { COPY } from '../../constants/copy'
import { useSoundStore } from '../../store'

export const SoundToggle = () => {
  const muted = useSoundStore((s) => s.muted)
  const toggle = useSoundStore((s) => s.toggle)
  const label = muted ? COPY.common.soundOff : COPY.common.soundOn
  return (
    <button className="btn btn-sm btn-icon" onClick={toggle} aria-label={label} aria-pressed={muted} title={label}>
      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
  )
}
