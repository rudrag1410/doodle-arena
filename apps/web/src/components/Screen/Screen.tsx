import clsx from 'clsx'
import type { ReactNode } from 'react'

export const Screen = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={clsx('relative mx-auto flex h-dvh w-full flex-col overflow-hidden', className)}>{children}</div>
)
