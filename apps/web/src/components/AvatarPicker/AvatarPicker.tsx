import clsx from 'clsx'
import { AVATARS } from '@doodle/shared'

import { COPY } from '@/constants/copy'

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
