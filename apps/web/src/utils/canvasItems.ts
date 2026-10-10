import { type CanvasItem } from '@doodle/shared'

export const applyOps = (items: CanvasItem[], puts: CanvasItem[], removes: string[]): CanvasItem[] => {
  const gone = new Set(removes)
  const next = items.filter((item) => !gone.has(item.id))
  const index = new Map(next.map((item, i) => [item.id, i]))

  for (const item of puts) {
    const at = index.get(item.id)

    if (at === undefined) {
      index.set(item.id, next.length)
      next.push(item)
    } else {
      next[at] = item
    }
  }

  return next
}

const lastPoint = (item: CanvasItem) => [item.points.at(-2), item.points.at(-1)] as const

export const sameItem = (a: CanvasItem | undefined, b: CanvasItem | undefined): boolean => {
  if (a === b) return true
  if (!a || !b) return false

  const [ax, ay] = lastPoint(a)
  const [bx, by] = lastPoint(b)

  return (
    a.id === b.id && a.kind === b.kind && a.color === b.color && a.size === b.size && a.points.length === b.points.length && ax === bx && ay === by
  )
}

export const extendsItem = (before: CanvasItem | undefined, after: CanvasItem | undefined): boolean => {
  if (!before || !after) return false
  if (before.id !== after.id || before.kind !== after.kind || before.color !== after.color || before.size !== after.size) return false
  if (after.points.length <= before.points.length) return false

  const [x, y] = lastPoint(before)
  const at = before.points.length - 2

  return after.points[at] === x && after.points[at + 1] === y
}
