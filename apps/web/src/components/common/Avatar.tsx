import clsx from 'clsx'
import { AVATARS } from '@doodle/shared'
import { COPY } from '../../constants/copy'
const RING_WIDTH = '3px'
const GLYPH_RATIO = 0.55
export const Avatar = ({ index, size = 40, ring }: { index: number; size?: number; ring?: string }) => {
  const { emoji, bg } = AVATARS[index % AVATARS.length]
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full border-[2.5px] border-ink select-none"
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: size * GLYPH_RATIO,
        lineHeight: 1,
        boxShadow: ring && `0 0 0 ${RING_WIDTH} ${ring}`,
      }}
      aria-hidden
    >
      {emoji}
    </span>
  )
}
export const AvatarPicker = ({ value, onChange }: { value: number; onChange: (i: number) => void }) => (
  <div className="grid grid-cols-6 gap-1.5 short:grid-cols-12 short:gap-1 sm:gap-2" role="radiogroup" aria-label={COPY.common.avatarGroup}>
    {AVATARS.map(({ emoji, bg }, i) => (
      <button
        key={emoji}
        type="button"
        role="radio"
        aria-checked={value === i}
        aria-label={COPY.common.avatarLabel(i + 1)}
        onClick={() => onChange(i)}
        className={clsx(
          'grid aspect-square place-items-center rounded-2xl border-[2.5px] border-ink text-xl transition sm:text-2xl',
          value === i ? 'scale-110 shadow-pop-sm' : 'opacity-80 hover:-translate-y-0.5 hover:opacity-100',
        )}
        style={{ background: bg }}
      >
        {emoji}
      </button>
    ))}
  </div>
)
