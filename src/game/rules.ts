import { cardOptions } from './cards'
import type {
  ApplyCardResult,
  CardOption,
  DeferredAction,
  DeferredActionResult,
  Player,
  ReceivedCard,
} from './types'

export function getUsedCardCounts(
  players: Player[] | null,
  discardedCards: CardOption[],
) {
  const usedCounts = Object.fromEntries(
    cardOptions.map((card) => [card.id, 0]),
  ) as Record<string, number>

  players?.forEach((player) => {
    player.cards.forEach((card) => {
      usedCounts[card.id] += 1
    })
  })
  discardedCards.forEach((card) => {
    usedCounts[card.id] += 1
  })

  return usedCounts
}

export function getRemainingCount(
  card: CardOption,
  usedCounts: Record<string, number>,
) {
  return card.totalCount - usedCounts[card.id]
}

export function getRemainingCardTotal(usedCounts: Record<string, number>) {
  return cardOptions.reduce(
    (total, card) => total + getRemainingCount(card, usedCounts),
    0,
  )
}

export function getNextAvailableCardId(usedCounts: Record<string, number>) {
  return (
    cardOptions.find((card) => getRemainingCount(card, usedCounts) > 0)?.id ??
    cardOptions[0].id
  )
}

export function isPlayerInactive(player: Player) {
  return player.isOut || player.isBusted || player.isFrozen || player.isFlipSeven
}

export function hasUnusedSecondChance(player: Player) {
  return player.cards.some(
    (card) => card.label === 'Second Chance' && !card.isUsed,
  )
}

export function getNextActivePlayerIndex(players: Player[], currentIndex: number) {
  if (players.every((player) => isPlayerInactive(player))) {
    return currentIndex
  }

  for (let offset = 1; offset <= players.length; offset += 1) {
    const nextIndex = (currentIndex + offset) % players.length

    if (!isPlayerInactive(players[nextIndex])) {
      return nextIndex
    }
  }

  return currentIndex
}

export function calculatePlayerPoints(cards: ReceivedCard[]) {
  const numberTotal = cards
    .filter((card) => card.category === 'number')
    .reduce((total, card) => total + Number(card.label), 0)
  const hasMultiplier = cards.some((card) => card.label === 'x2')
  const bonusTotal = cards
    .filter((card) => card.category === 'bonus' && card.label.startsWith('+'))
    .reduce((total, card) => total + Number(card.label.slice(1)), 0)

  return (hasMultiplier ? numberTotal * 2 : numberTotal) + bonusTotal
}

export function getPlayerPoints(player: Player) {
  if (player.isFlipSeven) {
    return calculatePlayerPoints(player.cards) + 15
  }

  return player.isBusted ? 0 : calculatePlayerPoints(player.cards)
}

export function hasFlipSeven(cards: ReceivedCard[]) {
  return cards.filter((card) => card.category === 'number').length >= 7
}

export function createPlayer(name: string, index: number): Player {
  return {
    id: index + 1,
    name: name.trim(),
    totalScore: 0,
    cards: [],
    isOut: false,
    isBusted: false,
    isFrozen: false,
    isFlipSeven: false,
  }
}

export function resetPlayerForRound(player: Player): Player {
  return {
    ...player,
    cards: [],
    isOut: false,
    isBusted: false,
    isFrozen: false,
    isFlipSeven: false,
  }
}

export function applyCardToPlayer(player: Player, card: CardOption): ApplyCardResult {
  if (card.category !== 'number') {
    return {
      player: {
        ...player,
        cards: [...player.cards, card],
      },
    }
  }

  const alreadyHasNumber = player.cards.some(
    (playerCard) =>
      playerCard.category === 'number' && playerCard.label === card.label,
  )

  if (!alreadyHasNumber) {
    const nextCards = [...player.cards, card]

    return {
      player: {
        ...player,
        cards: nextCards,
        isFlipSeven: hasFlipSeven(nextCards),
      },
    }
  }

  const unusedSecondChanceIndex = player.cards.findIndex(
    (playerCard) => playerCard.label === 'Second Chance' && !playerCard.isUsed,
  )

  if (unusedSecondChanceIndex >= 0) {
    const nextCards = player.cards.map((playerCard, index) =>
      index === unusedSecondChanceIndex
        ? { ...playerCard, isUsed: true }
        : playerCard,
    )

    return {
      player: {
        ...player,
        cards: nextCards,
        isFlipSeven: hasFlipSeven(nextCards),
      },
      discardedCard: card,
    }
  }

  return {
    player: {
      ...player,
      cards: [...player.cards, card],
      isBusted: true,
    },
  }
}

export function resolveFlipSeven(players: Player[]) {
  const flipSevenWinnerIndex = players.findIndex((player) => player.isFlipSeven)

  if (flipSevenWinnerIndex < 0) {
    return players
  }

  return players.map((player, index) => {
    if (index === flipSevenWinnerIndex) {
      return {
        ...player,
        isOut: false,
        isBusted: false,
        isFrozen: false,
      }
    }

    return isPlayerInactive(player) ? player : { ...player, isOut: true }
  })
}

export function applyDeferredActions(
  players: Player[],
  actions: DeferredAction[],
  returnFromPlayerIndex: number,
): DeferredActionResult {
  let nextPlayers = players

  for (let index = 0; index < actions.length; index += 1) {
    const action = actions[index]
    const targetPlayer = nextPlayers[action.targetPlayerIndex]

    if (!targetPlayer || isPlayerInactive(targetPlayer)) {
      continue
    }

    if (action.kind === 'freeze') {
      nextPlayers = nextPlayers.map((player, playerIndex) =>
        playerIndex === action.targetPlayerIndex
          ? { ...player, isFrozen: true }
          : player,
      )
      continue
    }

    return {
      players: nextPlayers,
      flipThreeDraw: {
        targetPlayerIndex: action.targetPlayerIndex,
        returnFromPlayerIndex,
        cardsRemaining: 3,
        pendingActions: [],
        afterActions: actions.slice(index + 1),
      },
      activePlayerIndex: action.targetPlayerIndex,
    }
  }

  return {
    players: nextPlayers,
    flipThreeDraw: null,
    activePlayerIndex: getNextActivePlayerIndex(nextPlayers, returnFromPlayerIndex),
  }
}

export function recycleDiscardIfDrawPileEmpty(
  players: Player[],
  discardedCards: CardOption[],
) {
  const usedCounts = getUsedCardCounts(players, discardedCards)

  if (discardedCards.length === 0 || getRemainingCardTotal(usedCounts) > 0) {
    return {
      discardedCards,
      usedCounts,
    }
  }

  const boardOnlyUsedCounts = getUsedCardCounts(players, [])

  return {
    discardedCards: [],
    usedCounts: boardOnlyUsedCounts,
  }
}
