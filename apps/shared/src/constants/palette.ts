import { BrushSize, PaletteColor } from '../enums'

export const PALETTE: readonly {
  id: PaletteColor
  hex: string
}[] = [
  { id: PaletteColor.Black, hex: '#1d1d1d' },
  { id: PaletteColor.Grey, hex: '#9fa8b2' },
  { id: PaletteColor.White, hex: '#ffffff' },
  { id: PaletteColor.Red, hex: '#e03131' },
  { id: PaletteColor.LightRed, hex: '#f87777' },
  { id: PaletteColor.Orange, hex: '#e16919' },
  { id: PaletteColor.Yellow, hex: '#f1ac4b' },
  { id: PaletteColor.LightGreen, hex: '#4cb05e' },
  { id: PaletteColor.Green, hex: '#099268' },
  { id: PaletteColor.LightBlue, hex: '#4ba1f1' },
  { id: PaletteColor.Blue, hex: '#4465e9' },
  { id: PaletteColor.Violet, hex: '#ae3ec9' },
  { id: PaletteColor.LightViolet, hex: '#e085f4' },
]

export const PALETTE_IDS: readonly string[] = PALETTE.map((c) => c.id)
export const DEFAULT_COLOR = PaletteColor.Black

export const BRUSH_SIZES: readonly {
  id: BrushSize
  dot: number
  width: number
}[] = [
  { id: BrushSize.Small, dot: 6, width: 4 },
  { id: BrushSize.Medium, dot: 11, width: 9 },
  { id: BrushSize.Large, dot: 17, width: 18 },
  { id: BrushSize.ExtraLarge, dot: 24, width: 32 },
]

export const SIZE_IDS: readonly string[] = BRUSH_SIZES.map((s) => s.id)
export const DEFAULT_BRUSH = BrushSize.Medium
