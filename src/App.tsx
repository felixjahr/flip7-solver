import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { EvPanel } from './components/EvPanel'
import { GameHeader } from './components/GameHeader'
import { PlayersBoard } from './components/PlayersBoard'
import { Scoreboard } from './components/Scoreboard'
import { SetupScreen } from './components/SetupScreen'
import { TurnPanel } from './components/TurnPanel'
import { cardOptions, makeInitialNames, MIN_PLAYERS } from './game/cards'
import {
  applyCardToPlayer,
  applyDeferredActions,
  createPlayer,
  getNextActivePlayerIndex,
  getNextAvailableCardId,
  getPlayerPoints,
  getRemainingCardTotal,
  getRemainingCount,
  getUsedCardCounts,
  isPlayerInactive,
  recycleDiscardIfDrawPileEmpty,
  resetPlayerForRound,
  resolveFlipSeven,
} from './game/rules'
import {
  calculateBustPercentage,
  calculateDrawExpectedValue,
  calculateQuitExpectedValue,
} from './game/solver'
import type { BoardState, CardOption, DeferredAction, Player } from './game/types'

function App() {
  const [playerCount, setPlayerCount] = useState(MIN_PLAYERS)
  const [playerNames, setPlayerNames] = useState(() =>
    makeInitialNames(MIN_PLAYERS),
  )
  const [players, setPlayers] = useState<Player[] | null>(null)
  const [activePlayerIndex, setActivePlayerIndex] = useState(0)
  const [selectedCardId, setSelectedCardId] = useState(cardOptions[0].id)
  const [selectedTargetId, setSelectedTargetId] = useState('')
  const [flipThreeDraw, setFlipThreeDraw] = useState<BoardState['flipThreeDraw']>(
    null,
  )
  const [discardedCards, setDiscardedCards] = useState<CardOption[]>([])

  const selectedCard = useMemo(
    () => cardOptions.find((card) => card.id === selectedCardId) ?? cardOptions[0],
    [selectedCardId],
  )
  const usedCardCounts = useMemo(
    () => getUsedCardCounts(players, discardedCards),
    [discardedCards, players],
  )
  const remainingDeckCount = getRemainingCardTotal(usedCardCounts)
  const selectedCardRemaining = getRemainingCount(selectedCard, usedCardCounts)
  const boardState = useMemo<BoardState | null>(
    () =>
      players
        ? {
            players,
            activePlayerIndex,
            discardedCards,
            flipThreeDraw,
          }
        : null,
    [activePlayerIndex, discardedCards, flipThreeDraw, players],
  )

  const activePlayer = players?.[activePlayerIndex]
  const isResolvingFlipThree = flipThreeDraw !== null
  const isFreezeSelected = selectedCard.label === 'Freeze'
  const isFlipThreeSelected = selectedCard.label === 'Flip Three'
  const needsActionTarget = isFreezeSelected || isFlipThreeSelected
  const availableActionTargets =
    players?.filter((player) => !isPlayerInactive(player)) ?? []
  const actionTargetId = resolveActionTargetId(
    selectedTargetId,
    availableActionTargets,
  )
  const activePlayersRemaining =
    players?.filter((player) => !isPlayerInactive(player)).length ?? 0
  const isDeckEmpty = remainingDeckCount === 0
  const isRoundComplete =
    players !== null && (activePlayersRemaining === 0 || isDeckEmpty)
  const canStartGame = playerNames.every((name) => name.trim().length > 0)
  const canAddSelectedCard =
    selectedCardRemaining > 0 &&
    !isRoundComplete &&
    Boolean(
      activePlayer &&
        (isResolvingFlipThree || !isPlayerInactive(activePlayer)),
    ) &&
    (!needsActionTarget || actionTargetId.length > 0)

  const drawExpectedValue = boardState
    ? calculateDrawExpectedValue(boardState)
    : 0
  const quitExpectedValue = boardState
    ? calculateQuitExpectedValue(boardState)
    : 0
  const bustPercentage = boardState ? calculateBustPercentage(boardState) : 0

  function updatePlayerCount(count: number) {
    setPlayerCount(count)
    setPlayerNames((currentNames) =>
      Array.from(
        { length: count },
        (_, index) => currentNames[index] ?? `Player ${index + 1}`,
      ),
    )
  }

  function updatePlayerName(index: number, name: string) {
    setPlayerNames((currentNames) =>
      currentNames.map((currentName, currentIndex) =>
        currentIndex === index ? name : currentName,
      ),
    )
  }

  function startGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canStartGame) {
      return
    }

    setPlayers(playerNames.map(createPlayer))
    setActivePlayerIndex(0)
    setSelectedTargetId('1')
    setFlipThreeDraw(null)
    setDiscardedCards([])
  }

  function addCardToActivePlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!players || !activePlayer || !canAddSelectedCard) {
      return
    }

    if (flipThreeDraw) {
      resolveFlipThreeDraw()
      return
    }

    resolveNormalDraw()
  }

  function resolveFlipThreeDraw() {
    if (!players || !flipThreeDraw) {
      return
    }

    let discardedCard: CardOption | undefined
    const actionTargetIndex = getActionTargetIndex(players, actionTargetId)
    const nextPendingActions = addPendingAction(
      flipThreeDraw.pendingActions,
      actionTargetIndex,
    )
    const nextPlayers = resolveFlipSeven(
      players.map((player, index) => {
        if (index !== flipThreeDraw.targetPlayerIndex) {
          return player
        }

        const result = applyCardToPlayer(player, selectedCard)
        discardedCard = result.discardedCard
        return result.player
      }),
    )
    const updatedTargetPlayer = nextPlayers[flipThreeDraw.targetPlayerIndex]
    const nextCardsRemaining = flipThreeDraw.cardsRemaining - 1
    const finishedCleanly =
      !updatedTargetPlayer.isBusted && !updatedTargetPlayer.isFlipSeven

    const deckState = updateDeckAfterDraw(nextPlayers, discardedCard)
    setSelectedCardId(getNextAvailableCardId(deckState.usedCounts))
    setDiscardedCards(deckState.discardedCards)

    if (nextCardsRemaining > 0 && finishedCleanly) {
      setPlayers(nextPlayers)
      setFlipThreeDraw({
        ...flipThreeDraw,
        pendingActions: nextPendingActions,
        cardsRemaining: nextCardsRemaining,
      })
      setActivePlayerIndex(flipThreeDraw.targetPlayerIndex)
      return
    }

    const nextState =
      nextCardsRemaining === 0 && finishedCleanly
        ? applyDeferredActions(
            nextPlayers,
            [...nextPendingActions, ...flipThreeDraw.afterActions],
            flipThreeDraw.returnFromPlayerIndex,
          )
        : {
            players: nextPlayers,
            flipThreeDraw: null,
            activePlayerIndex: getNextActivePlayerIndex(
              nextPlayers,
              flipThreeDraw.returnFromPlayerIndex,
            ),
          }

    setPlayers(nextState.players)
    setFlipThreeDraw(nextState.flipThreeDraw)
    setActivePlayerIndex(nextState.activePlayerIndex)
  }

  function resolveNormalDraw() {
    if (!players) {
      return
    }

    let discardedCard: CardOption | undefined
    const actionTargetIndex = getActionTargetIndex(players, actionTargetId)
    const nextPlayers = resolveFlipSeven(
      players.map((player, index) => {
        if (index === activePlayerIndex) {
          const result = applyCardToPlayer(player, selectedCard)
          discardedCard = result.discardedCard

          return {
            ...result.player,
            isFrozen:
              isFreezeSelected && index === actionTargetIndex
                ? true
                : player.isFrozen,
          }
        }

        return isFreezeSelected && index === actionTargetIndex
          ? { ...player, isFrozen: true }
          : player
      }),
    )
    const deckState = updateDeckAfterDraw(nextPlayers, discardedCard)

    setPlayers(nextPlayers)
    setSelectedCardId(getNextAvailableCardId(deckState.usedCounts))
    setDiscardedCards(deckState.discardedCards)

    if (
      isFlipThreeSelected &&
      actionTargetIndex >= 0 &&
      !isPlayerInactive(nextPlayers[actionTargetIndex])
    ) {
      setFlipThreeDraw({
        targetPlayerIndex: actionTargetIndex,
        returnFromPlayerIndex: activePlayerIndex,
        cardsRemaining: 3,
        pendingActions: [],
        afterActions: [],
      })
      setActivePlayerIndex(actionTargetIndex)
      return
    }

    setActivePlayerIndex(getNextActivePlayerIndex(nextPlayers, activePlayerIndex))
  }

  function addPendingAction(
    pendingActions: DeferredAction[],
    targetPlayerIndex: number,
  ) {
    if (isFreezeSelected && targetPlayerIndex >= 0) {
      return [
        ...pendingActions,
        { kind: 'freeze', targetPlayerIndex } satisfies DeferredAction,
      ]
    }

    if (isFlipThreeSelected && targetPlayerIndex >= 0) {
      return [
        ...pendingActions,
        { kind: 'flip-three', targetPlayerIndex } satisfies DeferredAction,
      ]
    }

    return pendingActions
  }

  function updateDeckAfterDraw(
    nextPlayers: Player[],
    discardedCard: CardOption | undefined,
  ) {
    const nextDiscardedCards = discardedCard
      ? [...discardedCards, discardedCard]
      : discardedCards

    return recycleDiscardIfDrawPileEmpty(nextPlayers, nextDiscardedCards)
  }

  function quitRound() {
    if (!players || !activePlayer || isRoundComplete || isResolvingFlipThree) {
      return
    }

    const nextPlayers = players.map((player, index) =>
      index === activePlayerIndex ? { ...player, isOut: true } : player,
    )

    setPlayers(nextPlayers)
    setActivePlayerIndex(getNextActivePlayerIndex(nextPlayers, activePlayerIndex))
  }

  function proceedToNextRound() {
    if (!players) {
      return
    }

    const boardCards = players.flatMap((player) => player.cards)
    const nextPlayers = players.map((player) =>
      resetPlayerForRound({
        ...player,
        totalScore: player.totalScore + getPlayerPoints(player),
      }),
    )
    const nextDiscardedCards = [...discardedCards, ...boardCards]
    const deckState = recycleDiscardIfDrawPileEmpty(
      nextPlayers,
      nextDiscardedCards,
    )

    setPlayers(nextPlayers)
    setActivePlayerIndex(0)
    setSelectedCardId(getNextAvailableCardId(deckState.usedCounts))
    setSelectedTargetId(String(players[0]?.id ?? ''))
    setFlipThreeDraw(null)
    setDiscardedCards(deckState.discardedCards)
  }

  function resetGame() {
    setPlayers(null)
    setActivePlayerIndex(0)
    setSelectedCardId(cardOptions[0].id)
    setSelectedTargetId('')
    setFlipThreeDraw(null)
    setDiscardedCards([])
  }

  if (!players) {
    return (
      <SetupScreen
        canStartGame={canStartGame}
        playerCount={playerCount}
        playerNames={playerNames}
        onPlayerCountChange={updatePlayerCount}
        onPlayerNameChange={updatePlayerName}
        onStartGame={startGame}
      />
    )
  }

  return (
    <main className="app-shell">
      <GameHeader
        activePlayerName={activePlayer?.name}
        flipThreeCardsRemaining={flipThreeDraw?.cardsRemaining}
        flipThreeTargetName={
          flipThreeDraw ? players[flipThreeDraw.targetPlayerIndex]?.name : undefined
        }
        isDeckEmpty={isDeckEmpty}
        isResolvingFlipThree={isResolvingFlipThree}
        isRoundComplete={isRoundComplete}
        onNextRound={proceedToNextRound}
        onResetGame={resetGame}
      />
      <Scoreboard players={players} remainingDeckCount={remainingDeckCount} />
      <EvPanel
        bustPercentage={bustPercentage}
        drawExpectedValue={drawExpectedValue}
        quitExpectedValue={quitExpectedValue}
      />
      <TurnPanel
        actionTargetId={actionTargetId}
        activePlayer={activePlayer}
        availableActionTargets={availableActionTargets}
        canAddSelectedCard={canAddSelectedCard}
        isFreezeSelected={isFreezeSelected}
        isResolvingFlipThree={isResolvingFlipThree}
        isRoundComplete={isRoundComplete}
        needsActionTarget={needsActionTarget}
        selectedCardId={selectedCardId}
        usedCardCounts={usedCardCounts}
        onAddCard={addCardToActivePlayer}
        onQuitRound={quitRound}
        onSelectedCardChange={setSelectedCardId}
        onTargetChange={setSelectedTargetId}
      />
      <PlayersBoard
        activePlayerIndex={activePlayerIndex}
        isRoundComplete={isRoundComplete}
        players={players}
      />
    </main>
  )
}

function resolveActionTargetId(selectedTargetId: string, targets: Player[]) {
  return targets.some((player) => String(player.id) === selectedTargetId)
    ? selectedTargetId
    : String(targets[0]?.id ?? '')
}

function getActionTargetIndex(players: Player[], actionTargetId: string) {
  return players.findIndex((player) => String(player.id) === actionTargetId)
}

export default App
