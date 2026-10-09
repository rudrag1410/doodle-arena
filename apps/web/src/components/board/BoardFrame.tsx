import clsx from 'clsx'
import type { ReactNode } from 'react'
interface Props {
  children: ReactNode
  className?: string
}
export const BoardFrame = ({ children, className }: Props) => (
  <div className={clsx('fit-parent grid place-items-center', className)}>
    <div className="board-fit @container card relative overflow-hidden !bg-white">{children}</div>
  </div>
)
