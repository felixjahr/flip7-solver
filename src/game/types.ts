export type CardCategory = 'number' | 'bonus' | 'action'

export type CardOption = {
  id: string
  label: string
  category: CardCategory
  totalCount: number
}

export type ReceivedCard = CardOption & {
  isUsed?: boolean
}

export type Player = {
  id: number
  name: string
  totalScore: number
  cards: ReceivedCard[]
  isOut: boolean
  isBusted: boolean
  isFrozen: boolean
  isFlipSeven: boolean
}

export type DeferredAction = {
  kind: 'freeze' | 'flip-three'
  targetPlayerIndex: number
}

export type FlipThreeDraw = {
  targetPlayerIndex: number
  returnFromPlayerIndex: number
  cardsRemaining: number
  pendingActions: DeferredAction[]
  afterActions: DeferredAction[]
}

export type BoardState = {
  players: Player[]
  activePlayerIndex: number
  discardedCards: CardOption[]
  flipThreeDraw: FlipThreeDraw | null
}

export type ApplyCardResult = {
  player: Player
  discardedCard?: CardOption
}

export type DeferredActionResult = {
  players: Player[]
  flipThreeDraw: FlipThreeDraw | null
  activePlayerIndex: number
}
