import { cardOptions, numberCards } from './cards'
import {
  applyCardToPlayer,
  getPlayerPoints,
  getRemainingCardTotal,
  getRemainingCount,
  getUsedCardCounts,
  isPlayerInactive,
} from './rules'
import type { BoardState } from './types'

export function calculateDrawExpectedValue(boardState: BoardState) {
  const activePlayer = boardState.players[boardState.activePlayerIndex]

  if (!activePlayer || isPlayerInactive(activePlayer)) {
    return 0
  }

  const usedCardCounts = getUsedCardCounts(
    boardState.players,
    boardState.discardedCards,
  )
  const drawableCards = cardOptions.filter((card) => card.category !== 'action')
  const drawableCardTotal = drawableCards.reduce(
    (total, card) => total + getRemainingCount(card, usedCardCounts),
    0,
  )

  if (drawableCardTotal === 0) {
    return 0
  }

  return drawableCards.reduce((expectedValue, card) => {
    const remainingCount = getRemainingCount(card, usedCardCounts)

    if (remainingCount <= 0) {
      return expectedValue
    }

    const nextPlayer = applyCardToPlayer(activePlayer, card).player
    const drawProbability = remainingCount / drawableCardTotal

    return expectedValue + getPlayerPoints(nextPlayer) * drawProbability
  }, 0)
}

export function calculateBustPercentage(boardState: BoardState) {
  const activePlayer = boardState.players[boardState.activePlayerIndex]

  if (!activePlayer || isPlayerInactive(activePlayer)) {
    return 0
  }

  const hasUnusedSecondChance = activePlayer.cards.some(
    (card) => card.label === 'Second Chance' && !card.isUsed,
  )

  if (hasUnusedSecondChance) {
    return 0
  }

  const usedCardCounts = getUsedCardCounts(
    boardState.players,
    boardState.discardedCards,
  )
  const remainingCardTotal = getRemainingCardTotal(usedCardCounts)

  if (remainingCardTotal === 0) {
    return 0
  }

  const activeNumberLabels = new Set(
    activePlayer.cards
      .filter((card) => card.category === 'number')
      .map((card) => card.label),
  )
  const bustCardCount = numberCards
    .filter((card) => activeNumberLabels.has(card.label))
    .reduce(
      (total, card) => total + getRemainingCount(card, usedCardCounts),
      0,
    )

  return (bustCardCount / remainingCardTotal) * 100
}
