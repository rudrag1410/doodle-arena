import { AVATARS } from '@doodle/shared'

const RING_WIDTH = '0.1875rem'
const PX_PER_REM = 16
const GLYPH_RATIO = 0.55

export const Avatar = ({ index, size = 40, ring }: { index: number; size?: number; ring?: string }) => {
  const { emoji, bg } = AVATARS[index % AVATARS.length] ?? AVATARS[0]

  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full border-(length:--border-width) border-ink select-none"
      style={{
        width: `${size / PX_PER_REM}rem`,
        height: `${size / PX_PER_REM}rem`,
        background: bg,
        fontSize: `${(size * GLYPH_RATIO) / PX_PER_REM}rem`,
        lineHeight: 1,
        boxShadow: ring && `0 0 0 ${RING_WIDTH} ${ring}`,
      }}
      aria-hidden
    >
      {emoji}
    </span>
  )
}
