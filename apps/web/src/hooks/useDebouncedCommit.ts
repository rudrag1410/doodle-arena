import { useEffect, useState } from 'react'
import { useDebounceCallback } from 'usehooks-ts'

import { SETTINGS_DEBOUNCE_MS } from '@/constants/timing'

export const useDebouncedCommit = <T>(external: T, onCommit: (v: T) => void, delayMs = SETTINGS_DEBOUNCE_MS) => {
  const [local, setLocal] = useState(external)
  const commit = useDebounceCallback(onCommit, delayMs)

  useEffect(() => {
    if (!commit.isPending()) setLocal(external)
  }, [external, commit])

  const change = (value: T) => {
    setLocal(value)
    commit(value)
  }

  return [local, change] as const
}
