import clsx from 'clsx'

interface Props<T extends string> {
  tabs: readonly {
    id: T
    label: string
  }[]
  value: T
  onChange: (id: T) => void
  className?: string
}

export const TabBar = <T extends string>({ tabs, value, onChange, className }: Props<T>) => (
  <div
    className={clsx('card grid shrink-0 gap-1 p-1 lg:hidden', className)}
    style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    role="tablist"
  >
    {tabs.map((t) => (
      <button
        key={t.id}
        role="tab"
        aria-selected={value === t.id}
        onClick={() => onChange(t.id)}
        className={clsx(
          'rounded-xl px-3 py-1.5 font-display text-sm font-semibold transition',
          value === t.id ? 'bg-sunny shadow-pop-sm' : 'text-ink-soft',
        )}
      >
        {t.label}
      </button>
    ))}
  </div>
)
