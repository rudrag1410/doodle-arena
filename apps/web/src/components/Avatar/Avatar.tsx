import { AVATARS } from '@doodle/shared'

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
