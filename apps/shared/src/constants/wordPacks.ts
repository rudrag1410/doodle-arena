import { PackId } from '../enums'

export const WORD_PACKS: readonly {
  id: PackId
  label: string
  emoji: string
}[] = [
  { id: PackId.Classic, label: 'Classic', emoji: '🎲' },
  { id: PackId.Animals, label: 'Animals', emoji: '🐘' },
  { id: PackId.Food, label: 'Food & Drink', emoji: '🍕' },
  { id: PackId.Things, label: 'Everyday Things', emoji: '🪑' },
  { id: PackId.Places, label: 'Places & Travel', emoji: '🗺️' },
  { id: PackId.Tech, label: 'Tech & Science', emoji: '🚀' },
]

export const PACK_IDS: readonly string[] = WORD_PACKS.map((p) => p.id)
