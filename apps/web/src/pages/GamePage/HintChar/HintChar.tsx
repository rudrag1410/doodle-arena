import { toUpper } from 'lodash-es'
import { HINTS } from '@doodle/shared'

import { isWordChar } from '@/utils'

const BOX = 'h-7 w-5 sm:h-10 sm:w-7'

export const HintChar = ({ ch }: { ch: string }) => {
  if (ch === HINTS.separatorChar) return <span className="w-3 sm:w-5" />
  if (ch === HINTS.maskChar) return <span className={`${BOX} border-b-[4px] border-ink sm:border-b-[5px]`} />

  if (isWordChar(ch)) {
    return (
      <span
        className={`${BOX} grid place-items-end border-b-[4px] border-ink text-center font-display text-2xl font-bold sm:border-b-[5px] sm:text-4xl`}
      >
        {toUpper(ch)}
      </span>
    )
  }

  return <span className="font-display text-2xl font-bold sm:text-3xl">{ch}</span>
}
