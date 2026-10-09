import { useDebouncedCommit } from '@/hooks/useDebouncedCommit'

interface Props {
  id: string
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  hint?: string
  onCommit: (v: number) => void
}

export const RangeField = ({ id, label, value, min, max, step = 1, suffix = '', hint, onCommit }: Props) => {
  const [local, change] = useDebouncedCommit(value, onCommit)

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="label" htmlFor={id}>
          {label}
        </label>
        <span className="font-display text-xl font-bold">
          {local}
          {suffix}
        </span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={local} onChange={(e) => change(Number(e.target.value))} className="slider" />
      {hint && <p className="mt-0.5 text-xs font-semibold text-ink-soft sm:text-sm">{hint}</p>}
    </div>
  )
}
