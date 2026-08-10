import type { CardOption } from './types'

export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 18

export const numberCards: CardOption[] = Array.from(
  { length: 13 },
  (_, index) => {
    const value = 12 - index

    return {
      id: `number-${value}`,
      label: String(value),
      category: 'number',
      totalCount: value === 0 ? 1 : value,
    }
  },
)

export const bonusCards: CardOption[] = ['x2', '+2', '+4', '+6', '+8', '+10'].map(
  (label) => ({
    id: `bonus-${label}`,
    label,
    category: 'bonus',
    totalCount: 1,
  }),
)

export const actionCards: CardOption[] = [
  'Freeze',
  'Second Chance',
  'Flip Three',
].map((label) => ({
  id: `action-${label.toLowerCase().replaceAll(' ', '-')}`,
  label,
  category: 'action',
  totalCount: 3,
}))

export const cardOptions = [...numberCards, ...bonusCards, ...actionCards]

export function makeInitialNames(playerCount: number) {
  return Array.from({ length: playerCount }, (_, index) => `Player ${index + 1}`)
}
