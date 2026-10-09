import { useMemo } from 'react'
import { motion } from 'motion/react'
import { random, times } from 'lodash-es'
import { THEME } from '../../constants/theme'
import { CONFETTI_PIECES } from '../../constants/timing'
const makePiece = (i: number) => ({
  x: random(100, true),
  delay: random(1.2, true),
  dur: random(2.6, 4.8, true),
  rot: random(-450, 450, true),
  drift: random(-80, 80, true),
  w: random(7, 14, true),
  color: THEME.confetti[i % THEME.confetti.length],
  round: random(1, true) > 0.6,
})
export const Confetti = ({ count = CONFETTI_PIECES }: { count?: number }) => {
  const pieces = useMemo(() => times(count, makePiece), [count])
  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-0 block border border-ink/60"
          style={{ left: `${p.x}%`, width: p.w, height: p.w * 1.5, background: p.color, borderRadius: p.round ? '50%' : 2 }}
          initial={{ y: -40, opacity: 1, rotate: 0 }}
          animate={{ y: '105vh', x: p.drift, rotate: p.rot, opacity: [1, 1, 0.9, 0] }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}
