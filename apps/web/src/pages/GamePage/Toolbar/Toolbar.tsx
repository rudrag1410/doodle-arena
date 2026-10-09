import clsx from 'clsx'
import { Eraser, PaintBucket, Pencil, Trash2, Undo2, type LucideIcon } from 'lucide-react'
import { BRUSH_SIZES, PALETTE, type BrushSize, type PaletteColor } from '@doodle/shared'

import { COPY } from '@/constants/copy'
import { Tool } from '@/enums'
import { colourName } from '@/utils/colour'

interface ToolDef {
  id: Tool
  label: string
  icon: LucideIcon
  key: string
}

const TOOLS: ToolDef[] = [
  { id: Tool.Pen, label: COPY.toolbar.pen, icon: Pencil, key: 'B' },
  { id: Tool.Fill, label: COPY.toolbar.fill, icon: PaintBucket, key: 'F' },
  { id: Tool.Eraser, label: COPY.toolbar.eraser, icon: Eraser, key: 'E' },
]

interface Props {
  tool: Tool
  setTool: (t: Tool) => void
  color: PaletteColor
  setColor: (c: PaletteColor) => void
  size: BrushSize
  setSize: (s: BrushSize) => void
  onUndo: () => void
  onClear: () => void
  disabled?: boolean
}

const ICON_BTN = 'btn btn-icon max-sm:!rounded-lg max-sm:!p-1.5'

export const Toolbar = ({ tool, setTool, color, setColor, size, setSize, onUndo, onClear, disabled }: Props) => (
  <div
    className={clsx(
      'card flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1.5 p-2 transition sm:gap-x-4 sm:p-2.5',
      disabled && 'pointer-events-none opacity-50',
    )}
    role="toolbar"
    aria-label={COPY.toolbar.label}
  >
    <div className="flex gap-1">
      {TOOLS.map(({ id, label, icon: Icon, key }) => {
        const text = COPY.toolbar.shortcut(label, key)

        return (
          <button
            key={id}
            className={clsx(ICON_BTN, tool === id && 'btn-sunny !translate-y-0.5 !shadow-none')}
            onClick={() => setTool(id)}
            aria-pressed={tool === id}
            aria-label={text}
            title={text}
          >
            <Icon size="1.125rem" />
          </button>
        )
      })}
    </div>

    <div
      className="order-last grid basis-full grid-cols-[repeat(13,minmax(0,1fr))] gap-1 sm:order-none sm:basis-auto sm:gap-1.5"
      role="radiogroup"
      aria-label={COPY.toolbar.colour}
    >
      {PALETTE.map(({ id, hex }) => (
        <button
          key={id}
          role="radio"
          aria-checked={color === id}
          aria-label={colourName(id)}
          title={colourName(id)}
          onClick={() => setColor(id)}
          className={clsx(
            'aspect-square w-full rounded-full border-2 border-ink transition hover:-translate-y-0.5 sm:size-7 sm:border-(length:--border-width)',
            color === id && 'scale-110 ring-[3px] ring-sky ring-offset-1',
          )}
          style={{ background: hex }}
        />
      ))}
    </div>

    <div className="flex gap-1" role="radiogroup" aria-label={COPY.toolbar.brushSize}>
      {BRUSH_SIZES.map(({ id, dot }) => (
        <button
          key={id}
          role="radio"
          aria-checked={size === id}
          aria-label={COPY.toolbar.brushNames[id]}
          title={COPY.toolbar.brushNames[id]}
          onClick={() => setSize(id)}
          className={clsx(
            'grid size-9 place-items-center rounded-xl border-(length:--border-width) border-ink transition max-sm:size-7',
            size === id ? 'bg-sunny shadow-pop-sm' : 'bg-white hover:-translate-y-0.5',
          )}
        >
          <span className="rounded-full bg-ink" style={{ width: dot, height: dot }} />
        </button>
      ))}
    </div>

    <div className="ml-auto flex gap-1">
      <button className={ICON_BTN} onClick={onUndo} aria-label={COPY.toolbar.undo} title={COPY.toolbar.undo}>
        <Undo2 size="1.125rem" />
      </button>
      <button className={ICON_BTN} onClick={onClear} aria-label={COPY.toolbar.clear} title={COPY.toolbar.clear}>
        <Trash2 size="1.125rem" />
      </button>
    </div>
  </div>
)
